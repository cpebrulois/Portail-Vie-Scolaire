import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {fixture} from './test_cm2_fixture.mjs';
import {question} from './cm2_catalog.js';

const require=createRequire(import.meta.url),{chromium}=require(process.env.PVS_PLAYWRIGHT_MODULE||'playwright');
const root=path.dirname(fileURLToPath(import.meta.url)),out=process.env.PVS_CM2_QA_DIR||path.join(root,'tmp_cm2_qa');
const host='https://cm2.test',f=fixture(),errors=[],steps=[];
for(const name of Object.keys(f.db))if(name!=='pvs_identites')f.db[name]=[];
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
let offline=false;
async function context(width=1440,height=1000){
  const c=await browser.newContext({viewport:{width,height}});
  c.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
  await c.route('**/*',async route=>{
    const req=route.request(),u=new URL(req.url());
    if(u.origin!==host)return route.abort();
    if(u.pathname==='/api/cm2'){
      if(offline)return route.abort();
      const b=req.postDataJSON(),r=await f.call(b.action,b.token,b);
      return route.fulfill({status:r.status,contentType:'application/json',body:JSON.stringify(r.body)});
    }
    if(u.pathname==='/api/identite'){
      const b=req.postDataJSON();
      if(b.action==='connecter'){
        const known={'QA-PUPIL-1':'pupil','QA-PUPIL-2':'other','QA-TEACHER':'teacher'};
        let token=known[b.secret];
        if(!token){const row=f.db.pvs_identites.find(i=>i.code_secret===String(b.secret).toUpperCase());if(row){token=crypto.randomUUID();f.sessions[token]={code_public:row.code_public,portee:'legere'};}}
        const s=f.sessions[token],row=f.db.pvs_identites.find(i=>i.code_public===s?.code_public);
        return route.fulfill({status:row?200:403,contentType:'application/json',body:JSON.stringify(row?{ok:true,public:row.code_public,role:row.role,token}:{error:'Unknown fixture'})});
      }
      if(b.action==='verifier')return route.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,deja_cree:!!f.db.pvs_identites.find(i=>i.code_public===b.public)?.code_secret})});
      if(b.action==='creer'){
        const row=f.db.pvs_identites.find(i=>i.code_public===b.public);assert.ok(row);row.code_secret=String(b.secret).toUpperCase();
        return route.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,public:row.code_public})});
      }
      return route.fulfill({status:400,contentType:'application/json',body:'{}'});
    }
    if(u.pathname==='/blank')return route.fulfill({contentType:'text/html',body:'<!doctype html><title>QA</title>'});
    const file=path.resolve(root,'.'+decodeURIComponent(u.pathname));
    if(!file.startsWith(root+path.sep))return route.abort();
    const ext=path.extname(file),types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp'};
    try{return route.fulfill({contentType:types[ext]||'text/plain',body:await readFile(file)});}catch{return route.fulfill({status:404,body:''});}
  });
  return c;
}
async function login(page,secret){
  await page.goto(host+'/cm2.html');await page.locator('#account [data-action=login]').click();
  await page.locator('#secret').fill(secret);await page.locator('#loginForm button[type=submit]').click();
  await page.waitForFunction(()=>document.getElementById('login').open===false);
}
async function noOverflow(page){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'page must not overflow horizontally');}
async function latestRun(page,owner='decouverte'){
  return page.evaluate(owner=>Object.values(JSON.parse(localStorage.getItem('liam_cm2_carnet_v1:'+owner)||'{}')).sort((a,b)=>(b.created_at||'').localeCompare(a.created_at||''))[0],owner);
}
async function answer(page,owner){
  await page.locator('.exercise').waitFor({state:'visible'});
  const r=await latestRun(page,owner),index=[0,1,2,3,4,5].find(i=>!r.answers.some(a=>a.question_index===i)),q=question(r.activity,index,r.seed,r.level);
  if(q.kind==='choice')await page.locator(`[data-action=choose][data-value='${q.expected}']`).click();
  else await page.locator('#answer').fill(q.kind==='writing'?'Un texte de fiction relu et amélioré.':String(q.expected).replace('.',','));
  await page.locator('[data-action=validate]').click();await page.locator('[data-action=next]').waitFor();await page.locator('[data-action=next]').click();
}
try{
  const free=await context(),p=await free.newPage();
  await p.goto(host+'/cm2.html');await p.locator('.activity').first().waitFor();assert.equal(await p.locator('.activity').count(),16);
  await p.locator('#subject').selectOption('Français');assert.equal(await p.locator('.activity').count(),3);
  await p.locator('#search').fill('zzzzzz');assert.equal(await p.locator('.activity').count(),0);
  await p.locator('#search').fill('');await p.locator('#subject').selectOption('');
  await p.evaluate(()=>document.querySelectorAll('img').forEach(i=>i.loading='eager'));
  await p.waitForFunction(()=>[...document.querySelectorAll('img')].every(i=>i.complete&&i.naturalWidth>0));
  await noOverflow(p);await p.screenshot({path:path.join(out,'cm2_desktop.png')});steps.push('desktop catalog, filters, assets');
  await p.locator('[data-action=start][data-id=fractions]').click();
  await answer(p,'decouverte');await answer(p,'decouverte');
  await p.reload();await p.locator('[data-action=notebook]').click();await p.locator('[data-action=resume]').click();
  assert.match(await p.locator('.progress-line').innerText(),/Étape 3 sur 6/);
  for(let i=2;i<6;i++)await answer(p,'decouverte');
  assert.match(await p.locator('.summary').innerText(),/6\/6/);steps.push('free practice, six answers, resume after reload');
  await p.locator('[data-action=home]').first().click();await p.locator('[data-action=start][data-id=ecriture]').click();
  await p.locator('#answer').fill('Mon brouillon conservé sur cet appareil.');
  await p.reload();await p.locator('[data-action=notebook]').click();
  await p.locator('tr').filter({hasText:'Écrire et améliorer'}).locator('[data-action=resume]').click();
  assert.equal(await p.locator('#answer').inputValue(),'Mon brouillon conservé sur cet appareil.');steps.push('writing draft retained');
  const tc=await context(),teacher=await tc.newPage();await login(teacher,'QA-TEACHER');
  await teacher.locator('#createForm input[name=name]').fill('CM2 – école de test');await teacher.locator('#createForm button[type=submit]').click();
  await teacher.locator('.code').waitFor();const invite=(await teacher.locator('.code').innerText()).match(/[a-f0-9]{24}/)[0];
  await teacher.locator('[data-action=open_class]').click();
  await teacher.locator('#initialCodesForm button[type=submit]').click();
  await teacher.waitForFunction(()=>document.querySelectorAll('#initialCodesForm').length===1&&document.body.textContent.includes('CM2-'));
  const initial=f.db.pvs_cm2_members.find(m=>m.issued_here).student;
  const nc=await context(),newPupil=await nc.newPage();
  await newPupil.goto(host+'/rejoindre.html?retour=cm2&public='+initial);
  assert.equal(await newPupil.locator('#inPub').inputValue(),initial);
  await newPupil.locator('#btnPub').click();await newPupil.locator('#btnCreer').waitFor({state:'visible'});await newPupil.locator('#btnCreer').click();
  await newPupil.locator('#ec3').waitFor({state:'visible'});await newPupil.locator('#btnEntrer').click();
  await newPupil.waitForURL('**/cm2.html');await newPupil.locator('#account').getByText(initial,{exact:true}).waitFor();steps.push('first access with animal, adjective, random number and existing identity API');
  await newPupil.locator('[data-action=start][data-id=calcul]').click();await answer(newPupil,initial);
  const preservedRun=f.db.pvs_cm2_runs.find(r=>r.student===initial).id;
  await teacher.locator('[data-action=refresh]').click();teacher.once('dialog',d=>d.accept());
  await teacher.locator(`[data-action=reset_student][data-student='${initial}']`).click();
  await teacher.waitForFunction(()=>document.getElementById('status').textContent.includes('réinitialisé'));
  assert.ok(f.db.pvs_cm2_runs.some(r=>r.id===preservedRun));
  await newPupil.reload();await newPupil.locator('#account [data-action=login]').waitFor();steps.push('teacher recovery keeps pupil work and revokes the old session');
  const pc=await context(),pupil=await pc.newPage();await login(pupil,'QA-PUPIL-1');await pupil.locator('[data-action=class]').click();
  await pupil.locator('#joinForm input').fill(invite);await pupil.locator('#joinForm button').click();
  await pupil.getByText('Demande transmise : ton professeur confirmera le rattachement.',{exact:true}).waitFor();
  await teacher.locator('[data-action=refresh]').click();await teacher.locator('[data-action=approve][data-student="PUPIL-1"]').click();
  await teacher.locator('tr').filter({hasText:'PUPIL-1'}).filter({hasText:'Confirmé'}).first().waitFor();
  await teacher.locator('#assignForm input[name=title]').fill('La mission du voyage');
  await teacher.locator('#assignForm input[value=lecture]').check();await teacher.locator('#assignForm input[value=ecriture]').check();
  await teacher.locator('#assignForm select[name=level]').selectOption('2');await teacher.locator('#assignForm button[type=submit]').click();
  await teacher.getByRole('heading',{name:'La mission du voyage',exact:true}).waitFor();
  await pupil.locator('#account').getByText('PUPIL-1',{exact:true}).waitFor();await pupil.locator('[data-action=notebook]').click();await pupil.locator('[data-action=refresh]').click();await pupil.locator('[data-action=class]').click();
  await pupil.locator('[data-action=assigned][data-id=lecture]').click();
  for(let i=0;i<6;i++)await answer(pupil,'PUPIL-1');
  await pupil.locator('[data-action=class]').click();await pupil.locator('[data-action=assigned][data-id=ecriture]').click();
  for(let i=0;i<6;i++)await answer(pupil,'PUPIL-1');
  assert.match(await pupil.locator('#app').innerText(),/pas reçu de note automatique/);
  await teacher.locator('[data-action=refresh]').click();
  const writing=f.db.pvs_cm2_runs.find(r=>r.student==='PUPIL-1'&&r.activity==='ecriture');
  await teacher.locator(`[data-action=teacher_run][data-id='${writing.id}']`).click();
  await teacher.locator('#reviewForm textarea').fill('Texte relu. Précise le lieu de la rencontre.');await teacher.locator('#reviewForm select').selectOption('a_reprendre');await teacher.locator('#reviewForm button[type=submit]').click();
  await pupil.locator('[data-action=notebook]').click();await pupil.locator('[data-action=refresh]').click();
  await pupil.locator('tr').filter({hasText:'Écrire et améliorer'}).locator('[data-action=resume]').click();await pupil.getByText('Texte relu. Précise le lieu de la rencontre.',{exact:true}).waitFor();
  steps.push('teacher class, approval, individual assignments, central answers and teacher review');
  await teacher.locator('[data-action=back_class]').click();await teacher.locator('#studentFilter').selectOption('PUPIL-1');
  const download=teacher.waitForEvent('download');await teacher.locator('[data-action=export]').click();const csv=await download;await csv.saveAs(path.join(out,'suivi_fixture.csv'));
  assert.match(await readFile(path.join(out,'suivi_fixture.csv'),'utf8'),/PUPIL-1/);
  await teacher.screenshot({path:path.join(out,'cm2_teacher.png'),fullPage:true});await noOverflow(teacher);steps.push('teacher filtering and CSV export');
  await pupil.locator('[data-action=home]').first().click();await pupil.locator('[data-action=start][data-id=calcul]').click();
  offline=true;for(let i=0;i<6;i++)await answer(pupil,'PUPIL-1');assert.equal(await pupil.locator('[data-action=sync]').count(),1);
  offline=false;await pupil.locator('[data-action=sync]').click();await pupil.locator('[data-action=sync]').waitFor({state:'detached'});
  assert.equal(f.db.pvs_cm2_answers.filter(a=>a.run_id===f.db.pvs_cm2_runs.at(-1).id).length,6);steps.push('connection interruption and queued answer synchronization');
  await pupil.locator('[data-action=logout]').click();await login(pupil,'QA-PUPIL-2');await pupil.locator('[data-action=notebook]').click();assert.equal(await pupil.locator('[data-action=resume]').count(),0);steps.push('pupil cache isolation');
  const ac=await context();await ac.addInitScript(()=>{if(location.origin==='https://cm2.test')sessionStorage.setItem('liam_cm2_session',JSON.stringify({public:'ADMIN-1',role:'admin',token:'full',expire_at:new Date(Date.now()+3600000).toISOString()}));});
  const admin=await ac.newPage();await admin.goto(host+'/cm2.html?espace=prof');await admin.locator('#teachersForm input').fill('2');await admin.locator('#teachersForm button[type=submit]').click();
  await admin.waitForFunction(()=>document.querySelectorAll('#teacherInvitations a').length===2);
  assert.match(await admin.locator('#teacherInvitations').innerText(),/RANCE-PRIM-0001/);steps.push('administrator invitation screen for primary teachers');
  for(const width of [390,320]){
    const c=await context(width,844),m=await c.newPage();await m.goto(host+'/cm2.html');await m.locator('.activity').first().waitFor();await noOverflow(m);await m.screenshot({path:path.join(out,'cm2_mobile_'+width+'.png')});
    await m.locator('[data-action=start][data-id=fractions]').click();await noOverflow(m);await m.screenshot({path:path.join(out,'cm2_exercise_'+width+'.png')});await c.close();
  }
  steps.push('mobile 390 and 320: home, exercise, no page overflow');
  for(const name of ['hub_francais.html','hub_maths.html','hub_histoire.html','hub_sciences.html','hub_methodes.html','p4_m01_matieres.html']){
    await p.goto(host+'/'+name);await p.waitForLoadState('load');
    if(name==='hub_francais.html'||name==='hub_maths.html'){
      await p.evaluate(()=>{S.xp=47;S.done[DATA[0].id]=true;saveP();});await p.reload();assert.equal(await p.evaluate(()=>S.xp),47);assert.equal(await p.evaluate(()=>!!S.done[DATA[0].id]),true);
    }
  }
  steps.push('six legacy pages load; French and maths restore real saved chapter state');
  const bc=await context();await bc.addInitScript(()=>{if(location.origin==='https://cm2.test'){sessionStorage.setItem('pvs_tok','teacher');localStorage.setItem('pvs_role','prof');}});
  const boot=await bc.newPage();await boot.goto(host+'/cm2.html');await boot.locator('#account').getByText('TEACHER-1',{exact:true}).waitFor();await boot.locator('[data-action=logout]').click();await boot.locator('#account [data-action=login]').waitFor();
  assert.equal(await boot.evaluate(()=>sessionStorage.getItem('pvs_tok')),null);steps.push('logout also clears a reused portal token');
  assert.deepEqual(errors,[]);
  const report={checked_at:new Date().toISOString(),mode:'local browser tests with isolated fixtures; no live pupil data',steps,errors};
  await writeFile(path.join(out,'browser_verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}catch(e){
  for(const [i,c] of browser.contexts().entries())for(const [j,p] of c.pages().entries()){await p.screenshot({path:path.join(out,`failure_${i}_${j}.png`)}).catch(()=>{});console.error('Page',i,j,(await p.locator('#status').textContent().catch(()=>'')));}
  console.error(e);console.error('Browser errors:',errors);process.exitCode=1;
}finally{await browser.close();}

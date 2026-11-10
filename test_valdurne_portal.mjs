import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PVS_PLAYWRIGHT_MODULE);
const root=path.dirname(fileURLToPath(import.meta.url)),out=process.env.PVS_VALDURNE_QA_DIR;
await mkdir(out,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});
const A='TEST-VALDURNE-A',steps=[],errors=[];
try{
 const context=await browser.newContext({viewport:{width:1440,height:1100}});
 await context.route('**/*',async route=>{
  const u=new URL(route.request().url());if(u.hostname!=='valdurne.test')return route.abort();
  if(u.pathname.endsWith('.csv'))return route.fulfill({contentType:'text/csv',body:''});
  if(u.pathname.startsWith('/api/'))return route.fulfill({status:503,contentType:'application/json',body:'{"error":"Test offline"}'});
  const file=path.resolve(root,'.'+(u.pathname==='/'?'/index.html':u.pathname));if(!file.startsWith(root+path.sep))return route.abort();
  const types={'.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.webp':'image/webp','.html':'text/html; charset=utf-8','.json':'application/json','.png':'image/png'};
  try{return route.fulfill({contentType:types[path.extname(file)]||'application/octet-stream',body:await readFile(file)});}catch{return route.fulfill({status:404,body:''});}
 });
 await context.addInitScript(A=>{
  if(location.hostname!=='valdurne.test'||sessionStorage.getItem('qa-seeded'))return;
  sessionStorage.setItem('qa-seeded','1');sessionStorage.setItem('pvs_session_auth_v1','1');
  localStorage.setItem('pvs_current_player',A);localStorage.setItem('pvs_role','eleve');
  localStorage.setItem('pvs_hof_v2',JSON.stringify({players:{[A]:{code:A,cp:{pixhare:0,psc1:0,sanctuaire:0,loge:0,autres:0,liberte:0,fraternite:0},videoG:20000,filageDone:{},acadDone:{}}},registry:[{code_joueur:A}],logs:[],seen:{},adults:[],parents:[]}));
  localStorage.setItem('pvs_tutorial_seen_v1','1');localStorage.setItem('pvs_rules_seen_v1','1');
 },A);
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto('https://valdurne.test/index.html');await page.locator('#valdurneWelcome[open]').waitFor();
 await page.frameLocator('#valdurneWelcome iframe').locator('#titre').getByText('La Route',{exact:true}).waitFor();
  await page.frameLocator('#valdurneWelcome iframe').locator('#illus img').waitFor();assert.ok(await page.frameLocator('#valdurneWelcome iframe').locator('#illus img').evaluate(i=>i.complete&&i.naturalWidth>1000));
  assert.equal(await page.evaluate(()=>document.fullscreenElement),null);assert.equal(await page.locator('#rewardOverlay').evaluate(e=>e.classList.contains('active')),false);
 await page.screenshot({path:path.join(out,'portail_accueil_desktop.png')});steps.push('actual portal opens the illustrated welcome after restored authentication');
 await page.locator('#valdurneWelcomeClose').click();await page.waitForFunction(()=>!document.querySelector('#valdurneWelcome').open);
 await page.reload();await page.locator('#valdurneWelcome[open]').waitFor();steps.push('actual portal reopening shows the welcome again');
 await page.locator('#valdurneWelcomeClose').click();
 await page.evaluate(A=>{const h=JSON.parse(localStorage.getItem('pvs_hof_v2'));h.players[A].rankData={i:3};localStorage.setItem('pvs_hof_v2',JSON.stringify(h));},A);
 for(let volume=1;volume<=4;volume++){
  for(let i=1;i<=10;i++){
   const nn=String(i).padStart(2,'0'),file='roman'+(volume===1?'':volume)+'_ch'+nn+'.html';
   await page.goto('https://valdurne.test/'+file);
   await page.locator('.valdurne-book-art img').waitFor();
   await page.waitForFunction(()=>{const i=document.querySelector('.valdurne-book-art img');return i&&i.complete&&i.naturalWidth>=1024;});
   if(await page.locator('#mainContent').count())assert.ok(await page.locator('#mainContent').isVisible(),file+' content hidden');
   const image=page.locator('.valdurne-book-art img');assert.ok((await image.getAttribute('alt')).length>10);
   const desktopBox=await image.boundingBox();assert.ok(desktopBox.height<=651&&Math.abs(desktopBox.width/desktopBox.height-2/3)<.01);
   if(i===3)await page.screenshot({path:path.join(out,'roman'+volume+'_ch03_desktop.png')});
   await page.setViewportSize({width:390,height:844});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),file+' mobile overflow');
   const mobileBox=await image.boundingBox();assert.ok(mobileBox.width<=390&&mobileBox.height<=581&&Math.abs(mobileBox.width/mobileBox.height-2/3)<.01);
   if(i===3)await page.screenshot({path:path.join(out,'roman'+volume+'_ch03_mobile.png')});
   await page.setViewportSize({width:1440,height:1100});
  }
 }
 steps.push('all forty chapter pages load full portrait illustrations with accessible captions; no stretching or desktop/mobile overflow');
 await page.goto('https://valdurne.test/seuil.html');
 for(let i=0;i<8;i++){
  await page.evaluate(i=>ouvrirEtape(i),i);
  await page.waitForFunction(()=>{const i=document.querySelector('#illus img');return i&&i.complete&&i.naturalWidth>1000;});
  if(i===4){assert.ok((await page.locator('#illus img').getAttribute('src')).includes('seuil_05_registre_v2.webp'));await page.screenshot({path:path.join(out,'registre_v2_desktop.png')});}
 }
 steps.push('all eight threshold images render, including the fixed Kern reference');
 await page.goto('https://valdurne.test/hub_narration.html');
 await page.waitForFunction(()=>document.querySelectorAll('.chapter.has-img').length===40);
 for(const volume of [1,2,3,4]){
  const id='#listChapitres'+(volume===1?'':volume);assert.equal(await page.locator(id+' .chapter.has-img').count(),10);
  const expected=Array.from({length:10},(_,i)=>(volume-1)*5000+i*500);
  assert.deepEqual(await page.evaluate(v=>window['CHAPITRES'+(v===1?'':v)].filter(c=>c.img).map(c=>c.xpRequired),volume),expected);
  for(const image of await page.locator(id+' .ch-thumb-wrap img').all()){
   await image.scrollIntoViewIfNeeded();await image.evaluate(i=>i.decode());assert.ok(await image.evaluate(i=>i.naturalWidth>=1024));
  }
 }
 steps.push('library renders all forty thumbnails with original XP thresholds and keeps the three book-game entries');
 assert.equal(await page.locator('.chapter').count(),43);
 await page.evaluate(()=>{CURRANK=0;renderChapitres2(20000);renderChapitres3(20000);renderChapitres4(20000);});
 assert.equal(await page.locator('#listChapitres2 .unlocked,#listChapitres3 .unlocked,#listChapitres4 .unlocked').count(),0);
 await page.evaluate(()=>{CURRANK=3;renderChapitres2(4999);renderChapitres3(9999);renderChapitres4(14999);});
 assert.equal(await page.locator('#listChapitres2 .unlocked,#listChapitres3 .unlocked,#listChapitres4 .unlocked').count(),0);
 await page.evaluate(()=>{renderChapitres2(20000);renderChapitres3(20000);renderChapitres4(20000);});
 steps.push('rank and XP gates still reject locked volumes; no player progress was changed');
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.locator('#listChapitres3').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'bibliotheque_tome3_mobile.png')});
 await page.setViewportSize({width:1440,height:1100});await page.screenshot({path:path.join(out,'bibliotheque_tome3_desktop.png')});
 assert.deepEqual(errors,[]);const report={checked_at:new Date().toISOString(),steps,errors,mode:'Local browser with synthetic pupil; all external services blocked.'};
 await writeFile(path.join(out,'portal_checks.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}

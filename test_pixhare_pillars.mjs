import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile, mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PVS_PLAYWRIGHT_MODULE || 'playwright');
const root=path.dirname(fileURLToPath(import.meta.url));
const player='TEST-PIXHARE';
const rewards={JURIDIQUE:[300,375,450,525,625,175,350,400,450,500],NUMERIQUE:[75,100,120,150,200,175,200,225,250,300]};
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1280,height:1000}});
// Only the module's React runtime may access the network. No production API is called.
await context.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.hostname==='unpkg.com')return route.continue();
  if(url.hostname!=='pixhare.test')return route.abort();
  if(url.pathname==='/blank')return route.fulfill({contentType:'text/html',body:'<!doctype html><title>QA</title>'});
  const target=path.resolve(root,'.'+decodeURIComponent(url.pathname));
  if(!target.startsWith(root+path.sep))return route.abort();
  try{return await route.fulfill({contentType:target.endsWith('.html')?'text/html; charset=utf-8':target.endsWith('.js')?'text/javascript':'text/plain',body:await readFile(target)});}catch{return route.fulfill({status:404,body:''});}
});
const page=await context.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://pixhare.test/blank');
await page.evaluate(p=>{localStorage.clear();localStorage.setItem('pvs_current_player',p);localStorage.setItem('pvs_phare_player',p);},player);
const results=[];
const nativeGroups=new Set();

async function visible(selector){
  const list=page.locator(selector);
  for(let i=0;i<await list.count();i++)if(await list.nth(i).isVisible()&&await list.nth(i).isEnabled())return list.nth(i);
}
async function advance(){
  const inputs=page.locator('input[type="text"]');
  for(let i=0;i<await inputs.count();i++){
    const input=inputs.nth(i);
    if(await input.isVisible()&&!await input.inputValue())await input.fill(i===0?player:'4e QA');
  }
  // Next/submit actions take precedence after a choice; disabled navigation is excluded.
  let el;
  const buttons=page.getByRole('button');
  for(let i=0;i<await buttons.count();i++){
    const b=buttons.nth(i);if(!await b.isVisible()||!await b.isEnabled())continue;
    if(await b.evaluate(e=>e.matches('.opt-btn,.quiz-choice,.choice-btn,.phase-choice,.xfer-choice,.quiz-option')))continue;
    const text=(await b.innerText()).trim();
    if(/COMMENCER|INITIALISER|PERCER LA BULLE|REVÊTIR L'ARMURE|CONTINUER|SUIV|VALIDER|NIVEAU [23]|PHASE (2|FINALE)|TERMINER|RÉSULTAT|Passer |Accéder |CERTIFI|ANALYSER/i.test(text)){
      await b.click();return 'button:'+text;
    }
  }
  const feedActions=page.locator('.post-actions button');
  for(let i=0;i<await feedActions.count();i++){
    const action=feedActions.nth(i);
    if(await action.isVisible()&&await action.evaluate(e=>getComputedStyle(e).pointerEvents!=='none')){
      await action.click();return 'feed action';
    }
  }
  for(const selector of ['.quiz-choice:not([disabled])','.quiz-option:not(.disabled)','.option:not(.disabled)','.opt','.choice-btn:not([disabled])','.flashcard','.flashcard-wrap','.flashcard-container [onclick]']){
    el=await visible(selector);if(el){await el.click();return selector;}
  }
  // Native modules use inline handlers for their theory, simulation and transfer exercises.
  const choices=page.locator('[onclick]');
  const candidates=[];
  for(let i=0;i<await choices.count();i++){
    const c=choices.nth(i);if(!await c.isVisible()||!await c.isEnabled())continue;
    const handler=await c.getAttribute('onclick');
    const parts=handler.match(/^(\w+)\((?:this,)?(\d+)?/);
    const group=parts?.[1]+(parts?.[2]||'');
    if(nativeGroups.has(group))continue;
    if(/goLevel|returnHub|restart|goHub|toggle|unlockLevel/.test(handler))continue;
    if(!/Choice|choose|answer|flip|reflect|select|reveal/i.test(handler))continue;
    if(await c.evaluate(e=>getComputedStyle(e).pointerEvents==='none'||getComputedStyle(e.parentElement).pointerEvents==='none'))continue;
    candidates.push({c,handler,group,rank:/true|'best'|'good'|,'B'|,3,|,3\)/.test(handler)?0:1});
  }
  candidates.sort((a,b)=>a.rank-b.rank);
  if(candidates.length){await candidates[0].c.click();nativeGroups.add(candidates[0].group);return candidates[0].handler;}
  return null;
}

try{
  for(const [pillar,values] of Object.entries(rewards))for(const [i,xp] of values.entries()){
    const id=`${pillar}_${String(i+1).padStart(2,'0')}`;
    const file=`PIX_pHARe_Module_${id}.html`;
    const source=await readFile(path.join(root,file),'utf8');
    for(const match of source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(match[1],{filename:file});
    errors.length=0;
    nativeGroups.clear();
    await page.goto(`http://pixhare.test/${file}?player=${player}`);
    await page.waitForTimeout(100);
    const invalidHandlers=await page.locator('[onclick]').evaluateAll(nodes=>nodes.flatMap(n=>{const code=n.getAttribute('onclick');try{new Function(code);return []}catch(e){return [{code,error:e.message}]}}));
    assert.deepEqual(invalidHandlers,[],id+' inline handlers');
    const actions=[];
    let completed=false;
    for(let step=0;step<160;step++){
      completed=await page.evaluate(id=>!!localStorage.getItem('CERT_PHARE_'+id),id);
      if(completed)break;
      assert.deepEqual(errors,[],id);
      const action=await advance();
      if(!action){await page.waitForTimeout(2000);const retry=await advance();if(!retry)throw Error(id+' stalled\n'+await page.locator('body').innerText());actions.push(retry);}
      else actions.push(action);
      await page.waitForTimeout(25);
    }
    assert.ok(completed,id+' failed to complete: '+actions.slice(-12).join(', '));
    assert.deepEqual(errors,[],id);
    const events=await page.evaluate(()=>JSON.parse(localStorage.getItem('pvs_bridge_events')||'[]'));
    const completion=events.filter(e=>e.type==='PIXHARE_PROGRESS'&&e.module===id);
    assert.ok(completion.length>=1,id+' completion event');
    assert.ok(completion.every(e=>e.player===player&&e.xp===xp),id+' player/reward mismatch: '+JSON.stringify(completion));
    assert.match(await page.locator('body').innerText(),new RegExp('(?:^|\\D)'+xp+'\\s*XP'),id+' displayed completion reward');
    results.push({id,xp,steps:actions.length});
    console.log('PASS',id,xp+' XP',actions.length+' interactions');
    if(process.env.PVS_QA_DIR){await mkdir(process.env.PVS_QA_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.PVS_QA_DIR,id+'.png'),fullPage:true});}
  }
  // Reopen PIXHARe with the certificates actually earned above.
  await page.goto(`http://pixhare.test/index_PIXHARe.html?player=${player}`);
  await page.waitForFunction(()=>typeof doneCount==='function'&&doneCount()===20);
  const expectedXP=Object.values(rewards).flat().reduce((a,b)=>a+b,0);
  assert.equal(await page.evaluate(()=>totalXP()),expectedXP);
  for(const [pillar,values] of Object.entries(rewards)){
    const catalogue=await page.evaluate(name=>PILLARS.find(p=>p.modules.some(m=>m.id.startsWith(name+'_'))).modules,pillar);
    assert.deepEqual(catalogue.map(m=>m.xp),values);
    assert.ok(await page.evaluate(name=>{const p=PILLARS.find(p=>p.modules.some(m=>m.id.startsWith(name+'_')));return p.modules.every((m,i)=>isUnlocked(p,i));},pillar));
  }
  const popupPromise=context.waitForEvent('page');
  await page.evaluate(()=>launchArcade());
  const arcade=await popupPromise;
  await arcade.waitForLoadState();
  assert.match(arcade.url(),/BONUS_ARCADE\.html\?power=20/);
  assert.deepEqual(await arcade.evaluate(()=>({num:BONUSES.NUM,jur:BONUSES.JUR})),{num:10,jur:10});
  await arcade.getByRole('button',{name:'INITIALISER PROTOCOLE'}).click();
  const ship=await arcade.evaluate(()=>{
    GAME.active=false;bullets=[];player.shoot();const hp=player.hp;player.hit();
    return {lasers:bullets.length,shield:player.shield,hp,afterHit:player.hp};
  });
  assert.deepEqual(ship,{lasers:11,shield:9,hp:100,afterHit:100});
  await arcade.close();
  console.log('PASS PIXHARe progression and arcade: 20 certificates, 11 lasers, 10 shield charges');

  // Seed an isolated local test profile; all remote requests remain blocked by routing.
  await page.evaluate(p=>{
    localStorage.setItem('pvs_hof_v2',JSON.stringify({week:'',players:{},logs:[],seen:{},registry:[{nom:'QA',prenom:'Test',code_joueur:p,code_temoin:'QA-WITNESS',code_public:'QA-PUBLIC'}],adults:[],parents:[],neg_reports:[],citizen_lists:{}}));
  },player);
  await page.goto('http://pixhare.test/index.html');
  await page.waitForFunction(p=>typeof S!=='undefined'&&S.players[p]?.cp.pixhare===20,player);
  let hub=await page.evaluate(p=>({count:S.players[p].cp.pixhare,xp:S.players[p].pixhareXp,done:Object.keys(S.players[p].pixhareDone)}),player);
  assert.equal(hub.count,20);assert.equal(hub.xp,expectedXP);
  assert.equal(await page.evaluate(p=>JSON.parse(localStorage.getItem('pvs_arcade_xp_v1'))[p].earned,player),expectedXP);
  await page.evaluate(p=>{
    const events=Object.keys(S.players[p].pixhareDone).map((module,i)=>({id:'QA-REPLAY-'+i,type:'PIXHARE_PROGRESS',player:p,module,xp:999999,d:new Date().toISOString()}));
    localStorage.setItem('pvs_bridge_events',JSON.stringify(events));processBridge();
  },player);
  hub=await page.evaluate(p=>({count:S.players[p].cp.pixhare,xp:S.players[p].pixhareXp}),player);
  assert.deepEqual(hub,{count:20,xp:expectedXP});
  await page.reload();
  await page.waitForFunction(p=>S.players[p]?.cp.pixhare===20,player);
  assert.equal(await page.evaluate(p=>S.players[p].pixhareXp,player),expectedXP);
  console.log('PASS central hub: '+expectedXP+' XP persisted, replay does not duplicate or inflate rewards');

  // Sparse progress must award one upgrade per certificate, including modules 06–10.
  await page.evaluate(()=>{
    for(const key of Object.keys(localStorage))if(key.startsWith('CERT_'))localStorage.removeItem(key);
    localStorage.setItem('CERT_PHARE_NUMERIQUE_10','true');
    localStorage.setItem('CERT_PHARE_JURIDIQUE_06','true');
    localStorage.setItem('CERT_JUR_6','legacy');
  });
  await page.goto('http://pixhare.test/BONUS_ARCADE.html');
  assert.deepEqual(await page.evaluate(()=>({num:BONUSES.NUM,jur:BONUSES.JUR})),{num:1,jur:1});
  await page.evaluate(()=>{
    localStorage.setItem('CERT_PHARE_NUMERIQUE_09','true');
    window.dispatchEvent(new StorageEvent('storage',{key:'CERT_PHARE_NUMERIQUE_09'}));
  });
  assert.equal(await page.evaluate(()=>BONUSES.NUM),2);
  await page.getByRole('button',{name:'INITIALISER PROTOCOLE'}).click();
  assert.deepEqual(await page.evaluate(()=>{GAME.active=false;bullets=[];player.shoot();return{lasers:bullets.length,shield:player.shield};}),{lasers:3,shield:1});
  console.log('PASS sparse/legacy certificates and upgrades received while hangar is open');
  console.log('MODULES COMPLETE',JSON.stringify(results));
}finally{await browser.close();}

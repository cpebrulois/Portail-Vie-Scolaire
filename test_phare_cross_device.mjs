import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PVS_PLAYWRIGHT_MODULE||'playwright');
const root=path.dirname(fileURLToPath(import.meta.url));
const A='TEST-RESTORED-A',B='TEST-RESTORED-B';
const pillars=['GROUPE','HISTOIRE','JURIDIQUE','NEURO','NUMERIQUE','VEA'];
const ids=pillars.flatMap(p=>Array.from({length:10},(_,i)=>p+'_'+String(i+1).padStart(2,'0')));
let saved={pixhareDone:Object.fromEntries(ids.filter(id=>id!=='HISTOIRE_10').map(id=>[id,'2026-10-29T09:00:00Z']))};
if(process.env.PVS_PHARE_LIVE_FIXTURE){
 const fixture=JSON.parse(await readFile(process.env.PVS_PHARE_LIVE_FIXTURE,'utf8'));
 saved=fixture.profiles.find(p=>ids.filter(id=>p.full_state?.pixhareDone?.[id]).length===59).full_state;
}
// Only validation maps are used; no real identity is placed in test pages or logs.
const profile={code:A,pixhareDone:saved.pixhareDone,jdrDone:saved.jdrDone||{},metacogDone:saved.metacogDone||{}};
const expected=ids.filter(id=>profile.pixhareDone[id]);
assert.equal(expected.length,59);
const missing=ids.find(id=>!profile.pixhareDone[id]);
const second={code:B,pixhareDone:{GROUPE_01:'2026-10-29T09:00:00Z'}};
let offline=false,writes=0,reads=0;
const browser=await chromium.launch({channel:'msedge',headless:true});
const errors=[];
async function setup(context){
 context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
 await context.route('**/*',async r=>{
  const u=new URL(r.request().url());
  if(u.hostname==='unpkg.com')return r.continue();
  if(u.hostname.endsWith('.supabase.co')){
   assert.equal(r.request().method(),'GET','restoration must never write to the cloud');reads++;
   if(offline)return r.abort();
   const player=u.searchParams.get('player_id');
   assert.ok([`eq.${A}`,`eq.${B}`].includes(player));
   return r.fulfill({contentType:'application/json',body:JSON.stringify([{player_id:player.slice(3),full_state:player===`eq.${A}`?profile:second}])});
  }
  if(u.hostname!=='restore.test')return r.abort();
  if(u.pathname==='/blank')return r.fulfill({contentType:'text/html',body:'<!doctype html><title>QA</title>'});
  const file=path.resolve(root,'.'+u.pathname);if(!file.startsWith(root+path.sep))return r.abort();
  try{return r.fulfill({contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html; charset=utf-8':'text/plain',body:await readFile(file)});}
  catch{return r.fulfill({status:404,body:''});}
 });
}
try{
 const context=await browser.newContext();await setup(context);
 const hub=await context.newPage();await hub.goto('http://restore.test/blank');
 await hub.evaluate(({A,B,profile,second})=>{
  localStorage.setItem('pvs_current_player',A);sessionStorage.setItem('pvs_session_auth_v1','1');
  localStorage.setItem('pvs_hof_v2',JSON.stringify({players:{},registry:[{code_joueur:A},{code_joueur:B}]}));
  localStorage.setItem('PIXHARE_WELCOME_SEEN','true');
 },{A,B,profile,second});
 await hub.addInitScript(({A,B,profile,second})=>{
  window.__cloudWrites=0;
  window.supabase={createClient:()=>({from:table=>({
   select:()=>({
    then:resolve=>Promise.resolve({data:table==='pvs_sync'?[{player_id:A,full_state:profile},{player_id:B,full_state:second}]:[],error:null}).then(resolve),
    eq:(key,value)=>({maybeSingle:async()=>({data:table==='pvs_sync'?{player_id:value,full_state:value===A?profile:second}:null,error:null})})
   }),upsert:async()=>{window.__cloudWrites++;return {error:null};}
  })})};
 },{A,B,profile,second});
 await hub.goto('http://restore.test/index.html');
 await hub.waitForFunction(({A})=>typeof S!=='undefined'&&S.players[A]?.cp.pixhare===59,{A});
 assert.equal(await hub.evaluate(()=>cur),A);
 const baseline=await hub.evaluate(A=>({xp:S.players[A].pixhareXp,done:JSON.stringify(S.players[A].pixhareDone)}),A);
 const popup=context.waitForEvent('page');
 await hub.evaluate(()=>openTracked('theme','PIXHARE_HUB','index_PIXHARe.html'));
 const phare=await popup;await phare.waitForLoadState('load');
 await phare.waitForFunction(()=>document.querySelectorAll('.module-card.done').length===59);
 assert.equal(await phare.evaluate(()=>doneCount()),59);
 assert.equal(await phare.evaluate(id=>isDone(id),missing),false);
 assert.equal(await phare.evaluate(id=>{const p=PILLARS.find(p=>p.modules.some(m=>m.id===id));return isUnlocked(p,p.modules.findIndex(m=>m.id===id));},missing),true);
 await phare.waitForFunction(()=>document.getElementById('pb-sync').textContent.includes('synchronisées'));
 await phare.reload();assert.equal(await phare.locator('.module-card.done').count(),59);
 assert.equal(await hub.evaluate(A=>S.players[A].pixhareXp,A),baseline.xp);
 assert.equal(await hub.evaluate(A=>JSON.stringify(S.players[A].pixhareDone),A),baseline.done);
 assert.equal(await hub.evaluate(()=>window.__cloudWrites),0,'restoration does not create a new completion/save');
 const arcade=await context.newPage();await arcade.addInitScript(()=>window.requestAnimationFrame=()=>0);
 await arcade.goto('http://restore.test/BONUS_ARCADE.html');
 assert.deepEqual(await arcade.evaluate(()=>BONUSES),Object.fromEntries(Object.entries({NUM:'NUMERIQUE',JUR:'JURIDIQUE',GRO:'GROUPE',HIS:'HISTOIRE',NEURO:'NEURO'}).map(([key,p])=>[key,expected.filter(id=>id.startsWith(p+'_')).length])));
 await arcade.close();
 // A different pupil must see only their own certificates, even when both
 // pupils' profiles are cached in the same central hub.
 await hub.evaluate(B=>{cur=B;save(false);refresh();},B);
 await phare.goto('http://restore.test/index_PIXHARe.html?player='+B);
 await phare.waitForFunction(()=>document.getElementById('pb-sync').textContent.includes('synchronisées'));
 assert.deepEqual(await phare.evaluate(()=>PILLARS.flatMap(p=>p.modules.filter(m=>isDone(m.id)).map(m=>m.id))),['GROUPE_01']);
 await phare.evaluate(A=>{localStorage.setItem('pvs_bridge_events',JSON.stringify([{player:A,type:'PIXHARE_PROGRESS',module:'HISTOIRE_10'}]));checkReturn();},A);
 assert.equal(await phare.evaluate(()=>isDone('HISTOIRE_10')),false,'another pupil event must not validate a module');
 await phare.evaluate(()=>localStorage.setItem('pvs_bridge_events','[]'));
 await hub.evaluate(A=>{cur=A;save(false);refresh();},A);
 await phare.goto('http://restore.test/index_PIXHARe.html?player='+A);
 assert.equal(await phare.evaluate(()=>doneCount()),59);
 offline=true;await phare.reload();
 await phare.waitForFunction(()=>document.getElementById('pb-sync').textContent.includes('indisponible'));
 assert.equal(await phare.evaluate(()=>doneCount()),59,'offline reload preserves recovered validations');
 await phare.evaluate(id=>validateModule(id,true),missing);
 await hub.waitForFunction(A=>S.players[A].cp.pixhare===60,A);
 const credited=await hub.evaluate(A=>S.players[A].pixhareXp,A);
 assert.ok(credited>baseline.xp);await phare.reload();
 assert.equal(await phare.evaluate(()=>doneCount()),60);
 assert.equal(await hub.evaluate(A=>S.players[A].pixhareXp,A),credited,'no extra XP on reload');
 writes+=await hub.evaluate(()=>window.__cloudWrites);
 await context.close();
 // A direct link on a completely empty second PC also recovers from the cloud.
 offline=false;const fresh=await browser.newContext();await setup(fresh);
 const direct=await fresh.newPage();await direct.goto('http://restore.test/index_PIXHARe.html?player='+A);
 await direct.waitForFunction(()=>document.querySelectorAll('.module-card.done').length===59);
 assert.equal(await direct.evaluate(()=>JSON.parse(localStorage.getItem('pvs_bridge_events')||'[]').length),0);
 // Guard against a late cloud answer for the player who just logged out.
 await direct.evaluate(async B=>{const pending=PVSPhareProgress.pull();PVSPhareProgress.activate(B,{code:B,pixhareDone:{}});await pending;},B);
 assert.equal(await direct.evaluate(()=>doneCount()),0);
 assert.deepEqual(errors,[]);
 assert.ok(reads>0);
 console.log('PASS fresh-PC central pull → 59 certificates, module prerequisites, arcade upgrades, no duplicate XP, offline reload, pupil isolation, direct cloud recovery and stale-response guard');
}finally{await browser.close();}

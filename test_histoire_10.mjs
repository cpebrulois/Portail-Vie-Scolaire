import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PVS_PLAYWRIGHT_MODULE||'playwright');
const root=path.dirname(fileURLToPath(import.meta.url));
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.stack));
 await page.route('**/*',async r=>{
  const u=new URL(r.request().url());if(u.hostname!=='history.test')return r.abort();
  if(u.pathname==='/blank')return r.fulfill({contentType:'text/html',body:'<!doctype html><title>QA</title>'});
  const file=path.resolve(root,'.'+u.pathname);if(!file.startsWith(root+path.sep))return r.abort();
  try{return await r.fulfill({contentType:file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript':'text/plain',body:await readFile(file)});}catch{return r.fulfill({status:404,body:''});}
 });
 await page.goto('http://history.test/blank');
 await page.evaluate(()=>{localStorage.clear();localStorage.setItem('pvs_hof_v2',JSON.stringify({players:{},registry:[{code_joueur:'TEST-HIST10'}]}));});
 await page.goto('http://history.test/PIX_pHARe_Module_HISTOIRE_10.html?player=TEST-HIST10');
 const invalid=await page.locator('[onclick]').evaluateAll(nodes=>nodes.flatMap(e=>{try{new Function(e.getAttribute('onclick'));return []}catch(error){return [{handler:e.getAttribute('onclick'),error:error.message}]}}));
 assert.deepEqual(invalid,[],'every response, including wrong answers, compiles');
 await page.locator('#n1-opts .opt-btn').first().click();
 await page.locator('#btn-n1-next').click();
 for(let i=1;i<=3;i++){
  const phase=page.locator('#ph'+i);await phase.waitFor({state:'visible'});
  await phase.locator('[onclick*="\'good\'"]').click();
 }
 await page.locator('#sim-result').waitFor({state:'visible'});
 await page.locator('button[onclick="unlockLevel(3)"]').click();
 for(let i=1;i<=3;i++)await page.locator('#xf'+i+'-opts [onclick*="this,3,"]').click();
 await page.locator('#btn-n3-finish').click();
 assert.equal(await page.locator('#screen-fin').isVisible(),true);
 const completion=await page.evaluate(()=>({cert:JSON.parse(localStorage.getItem('CERT_PHARE_HISTOIRE_10')),events:JSON.parse(localStorage.getItem('pvs_bridge_events'))}));
 assert.equal(completion.cert.m,'HISTOIRE_10');assert.equal(completion.cert.f,true);
 assert.ok(completion.events.some(e=>e.type==='PIXHARE_PROGRESS'&&e.player==='TEST-HIST10'&&e.module==='HISTOIRE_10'&&e.xp===300));
 await page.getByRole('button',{name:'← Retour au Hub pHARe'}).click();
 await page.waitForURL('**/index_PIXHARe.html?player=TEST-HIST10');
 assert.equal(await page.evaluate(()=>isDone('HISTOIRE_10')),true);
 const synchronization=await page.evaluate(()=>{
  const count=JSON.parse(localStorage.getItem('pvs_bridge_events')).length;
  checkReturn();checkReturn();
  return {count,after:JSON.parse(localStorage.getItem('pvs_bridge_events')).length};
 });
 assert.equal(synchronization.count,2,'module event plus one index synchronization');
 assert.equal(synchronization.after,synchronization.count);
 const retry=await page.evaluate(()=>{
  const events=localStorage.getItem('pvs_bridge_events');
  localStorage.removeItem(syncBridgeKey('HISTOIRE_10'));
  localStorage.setItem('pvs_bridge_events','broken');
  const failed=syncModuleCompletion('HISTOIRE_10');
  const marker=localStorage.getItem(syncBridgeKey('HISTOIRE_10'));
  localStorage.setItem('pvs_bridge_events',events);
  return {failed,marker,retried:syncModuleCompletion('HISTOIRE_10')};
 });
 assert.deepEqual(retry,{failed:false,marker:null,retried:true});
 await page.goto('http://history.test/index.html');
 await page.waitForFunction(()=>typeof S!=='undefined'&&S.players['TEST-HIST10']?.cp.pixhare===1);
 assert.equal(await page.evaluate(()=>S.players['TEST-HIST10'].pixhareXp),300);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('pvs_arcade_xp_v1'))['TEST-HIST10'].earned),300);
 await page.evaluate(()=>{localStorage.setItem('pvs_bridge_events',JSON.stringify([{id:'HIST10-REPLAY',type:'PIXHARE_PROGRESS',player:'TEST-HIST10',module:'HISTOIRE_10',xp:99999,d:new Date().toISOString()}]));processBridge();});
 await page.reload();await page.waitForFunction(()=>S.players['TEST-HIST10']?.cp.pixhare===1);
 assert.equal(await page.evaluate(()=>S.players['TEST-HIST10'].pixhareXp),300);
 assert.deepEqual(errors,[]);
 console.log('PASS Histoire 10: all inline handlers, complete exercises, certificate, PIXHARe return, 300 XP accepted by hub and arcade budget, replay/reload without duplicate');
}finally{await browser.close();}

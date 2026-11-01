import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PVS_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const source=await readFile(new URL('./index.html',import.meta.url),'utf8');
 await page.route('**/*',r=>r.request().url()==='http://audit.test/'?r.fulfill({contentType:'text/html',body:source}):r.abort());
 await page.goto('http://audit.test/');
 const result=await page.evaluate(()=>{
  const p=mkP('TEST-NEW');p.cp.pixhare=1;p.pixhareDone={HISTOIRE_10:new Date().toISOString()};
  syncPixharePlayerProgress(p);p.acadDone={fr6_gram1:true};p.filageDone={'0_1':new Date().toISOString()};
  S.players[p.code]=p;S.citizen_lists={};
  const once=xg(p),final=xgFinal(p),life=xgLife(p);
  p.pixhareXp=30000;const bounded=scoreNiveau(p);
  p.filageDone=Object.fromEntries(Array.from({length:8},(_,i)=>['0_'+(i+1),new Date().toISOString()]));
  const revealed=scoreNiveau(p);
  const old=mkP(p.code);old.filageDone={'0_1':'2025-01-01T00:00:00Z'};
  mergeCloudPlayer(p.code,old);
  mode='global';renderHall();const globalHead=document.getElementById('scoreHead').textContent;
  mode='week';renderHall();const weeklyHead=document.getElementById('scoreHead').textContent;
  return {once,final,life,bounded,revealed,chapters:filageChapitres(S.players[p.code],0),globalHead,weeklyHead};
 });
 assert.equal(result.once,306);assert.equal(result.final,306);assert.equal(result.life,306);
 assert.equal(result.bounded.score,34);assert.ok(result.bounded.attente>0);
 assert.ok(result.revealed.score>100);assert.equal(result.revealed.attente,0);
 assert.equal(result.chapters,8,'cloud merge must retain chapters completed locally');
 assert.equal(result.globalHead,'Score de progression (%)');
 assert.equal(result.weeklyHead,'XP hebdomadaires après coefficient');
 assert.match(await page.locator('#hallRule').innerText(),/Ce classement ne trie pas les XP bruts/);
 assert.deepEqual(errors,[]);
 console.log('PASS coefficient applied once, filage cap and release, chapter preservation, explicit ranking units');
}finally{await browser.close();}

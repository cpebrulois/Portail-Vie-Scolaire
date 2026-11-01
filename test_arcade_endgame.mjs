import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PVS_PLAYWRIGHT_MODULE||'playwright');
const source=await readFile(new URL('./BONUS_ARCADE.html',import.meta.url),'utf8');
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 // Drive the real game loop with explicit timestamps instead of waiting 23 minutes.
 await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
 await page.route('**/*',r=>r.request().url().startsWith('http://endgame.test/')?r.fulfill({contentType:'text/html; charset=utf-8',body:source}):r.abort());
 await page.goto('http://endgame.test/');
 await page.getByRole('button',{name:'GARDIEN',exact:true}).click();
 assert.equal(await page.evaluate(()=>sectorDurationMs(10)),1822500);
 await page.getByRole('button',{name:'APPRENTI',exact:true}).click();
 assert.equal(await page.evaluate(()=>sectorUnlocked(11)),false);
 await page.evaluate(()=>{
  for(let tier=2;tier<=10;tier++)for(const name of Object.values(SECTOR_PILLARS))localStorage.setItem('CERT_PHARE_'+name+'_'+String(tier).padStart(2,'0'),'true');
  refreshHangar();
 });
 assert.equal(await page.locator('#sector-picker button').count(),10);
 for(let level=6;level<=10;level++){
  assert.equal(await page.evaluate(n=>sectorUnlocked(n),level),true);
  await page.evaluate(n=>{localStorage.removeItem('CERT_PHARE_VEA_'+String(n).padStart(2,'0'));refreshHangar();},level);
  assert.equal(await page.evaluate(n=>sectorUnlocked(n),level),false);
  await page.evaluate(n=>{localStorage.setItem('CERT_PHARE_VEA_'+String(n).padStart(2,'0'),'true');refreshHangar();},level);
 }
 const durations=await page.evaluate(()=>[5,6,7,8,9,10].map(sectorDurationMs));
 assert.deepEqual(durations,[180000,270000,405000,607500,911250,1366875]);
 for(let i=1;i<durations.length;i++)assert.equal(durations[i]/durations[i-1],1.5);
 await page.getByRole('button',{name:/^Niveau 10 ·/}).click();
 await page.getByRole('button',{name:'INITIALISER PROTOCOLE'}).click();
 await page.evaluate(()=>{GAME.lastTick=0;GAME.elapsedMs=0;loop(1000);GAME.active=false;});
 assert.equal(await page.evaluate(()=>GAME.elapsedMs),1000);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});GAME.active=true;loop(60000);GAME.active=false;});
 assert.equal(await page.evaluate(()=>GAME.elapsedMs),1000);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});GAME.active=true;loop(90000);GAME.active=false;});
 assert.equal(await page.evaluate(()=>GAME.elapsedMs),1000,'returning to tab does not count hidden time');
 for(let level=6;level<=10;level++){
  const result=await page.evaluate(n=>{
   GAME.sector=n;GAME.bossMode=false;boss=null;GAME.frame=1;GAME.score=1e9;
   GAME.elapsedMs=sectorDurationMs(n)-1;spawnManager();const before=boss===null&&!GAME.bossMode;
   GAME.elapsedMs++;spawnManager();const after=boss instanceof Boss;
   return {before,after,mega:boss instanceof MegaBoss};
  },level);
  assert.deepEqual(result,{before:true,after:true,mega:level===10});
 }
 const phase=await page.evaluate(()=>{
  boss.phase='FIGHT';boss.hp=boss.hpMax*2/3+1;boss.takeDamage(10);
  const stage2=boss.stage,hp=boss.hp;boss.takeDamage(100);
  const shield=boss.hp===hp;
  boss.shieldFrames=0;boss.hp=boss.hpMax/3+1;boss.takeDamage(10);
  const stage3=boss.stage;
  boss.shieldFrames=0;boss.frame=179;bullets=[];boss.update();
  return {stage2,stage3,shield,shots:bullets.filter(b=>b.source==='ENEMY').length};
 });
 assert.equal(phase.stage2,2);assert.equal(phase.stage3,3);assert.equal(phase.shield,true);assert.ok(phase.shots>=20);
 assert.equal(await page.locator('#victory-screen').isVisible(),false);
 await page.evaluate(()=>{GAME.active=true;boss.hp=1;boss.shieldFrames=0;boss.takeDamage(10);});
 await page.locator('#victory-screen').waitFor({state:'visible'});
 assert.equal(await page.evaluate(()=>GAME.active),false);
 assert.equal(await page.evaluate(()=>localStorage.getItem('pvs_bridge_events')),null);
 assert.deepEqual(errors,[]);
 console.log('PASS levels 6–10, six-pillar gates, exact 1.5 duration ratios, active-time clock, timed boss boundaries, three-phase megaboss and final victory');
}finally{await browser.close();}

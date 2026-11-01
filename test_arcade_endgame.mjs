import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PVS_PLAYWRIGHT_MODULE||'playwright');
const source=await readFile(new URL('./BONUS_ARCADE.html',import.meta.url),'utf8');
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 // Drive complete authored wave sequences without waiting for real-time flight animations.
 await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
 await page.route('**/*',r=>r.request().url().startsWith('http://endgame.test/')?r.fulfill({contentType:'text/html; charset=utf-8',body:source}):r.abort());
 await page.goto('http://endgame.test/');
 await page.getByRole('button',{name:'GARDIEN',exact:true}).click();
 assert.equal(await page.evaluate(()=>sectorRoutePlan(10).waves),231);
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
 const plans=await page.evaluate(()=>Array.from({length:10},(_,i)=>sectorRoutePlan(i+1)));
 assert.deepEqual(plans.map(p=>p.waves),[6,9,14,21,31,46,69,103,154,231]);
 assert.deepEqual(plans.map(p=>p.enemies),[30,54,97,168,278,459,759,1235,2001,3234]);
 assert.equal(await page.evaluate(()=>typeof sectorDurationMs),'undefined');
 await page.getByRole('button',{name:/^Niveau 10 ·/}).click();
 await page.getByRole('button',{name:'INITIALISER PROTOCOLE'}).click();
 const paused=await page.evaluate(()=>{
  const before=JSON.stringify(GAME.route),frame=GAME.frame;
  Object.defineProperty(document,'hidden',{configurable:true,value:true});loop();
  const unchanged=before===JSON.stringify(GAME.route)&&frame===GAME.frame;
  Object.defineProperty(document,'hidden',{configurable:true,value:false});GAME.active=false;
  return unchanged;
 });
 assert.equal(paused,true);
 for(let level=1;level<=10;level++){
  const result=await page.evaluate(n=>{
   GAME.sector=n;GAME.bossMode=false;GAME.route=newRoute(n);boss=null;enemies=[];bullets=[];
   GAME.score=1e9;GAME.frame=1e9;
   let rounds=0,maxActive=0,heldLast=false;
   while(!GAME.bossMode&&rounds++<150000){
    spawnManager();
    maxActive=Math.max(maxActive,enemies.filter(e=>e.active).length);
    const route=GAME.route;
    if(!heldLast&&route.wave===route.waves-1&&route.current&&route.spawned===route.current.length){
     for(let i=0;i<100;i++)spawnManager();
     if(boss||GAME.bossMode)throw Error('Boss appeared before last enemies were cleared');
     heldLast=true;
    }
    for(const e of enemies)if(e.active)e.takeDamage(e.hp);
    enemies=enemies.filter(e=>e.active);particles=[];
   }
   return {spawned:GAME.route.totalSpawned,budget:GAME.route.enemies,waves:GAME.route.wave,heldLast,maxActive,boss:boss instanceof Boss,mega:boss instanceof MegaBoss};
  },level);
  assert.equal(result.spawned,plans[level-1].enemies);
  assert.equal(result.budget,result.spawned);assert.equal(result.waves,plans[level-1].waves);
  assert.ok(result.heldLast);assert.ok(result.maxActive<=16);assert.ok(result.boss);assert.equal(result.mega,level===10);
 }
 await page.evaluate(()=>updateUI());
 assert.equal(await page.locator('#route-progress').getAttribute('aria-valuenow'),'100');
 assert.match(await page.locator('#sector-hud').innerText(),/MÉGABOSS/);
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
 console.log('PASS ten progressively longer complete wave routes, exact enemy budgets, no timer/score shortcuts, pause, six-pillar gates, final-enemy guard and megaboss victory');
}finally{await browser.close();}

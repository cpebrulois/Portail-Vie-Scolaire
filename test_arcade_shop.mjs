import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PVS_PLAYWRIGHT_MODULE||'playwright');
const root=path.dirname(fileURLToPath(import.meta.url));
const browser=await chromium.launch({channel:'msedge',headless:true});
const errors=[];
try {
 const context=await browser.newContext({viewport:{width:1280,height:1000}});
 await context.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
 context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
 await context.route('**/*',async r=>{
  const u=new URL(r.request().url());
  if(u.hostname!=='shop.test')return r.abort();
  if(u.pathname==='/blank')return r.fulfill({contentType:'text/html',body:'<!doctype html><title>QA</title>'});
  const target=path.resolve(root,'.'+u.pathname);
  if(!target.startsWith(root+path.sep))return r.abort();
  try{return await r.fulfill({contentType:target.endsWith('.html')?'text/html; charset=utf-8':target.endsWith('.js')?'text/javascript':'text/plain',body:await readFile(target)});}catch{return r.fulfill({status:404,body:''});}
 });
 const page=await context.newPage();await page.goto('https://shop.test/blank');
 await page.evaluate(()=>{
  localStorage.clear();localStorage.setItem('pvs_current_player','TEST-ARCADE-A');
  localStorage.setItem('pvs_hof_v2',JSON.stringify({players:{},registry:[{code_joueur:'TEST-ARCADE-A'},{code_joueur:'TEST-ARCADE-B'}]}));
 });
 const hub=await context.newPage();await hub.goto('https://shop.test/index.html');
 await hub.waitForFunction(()=>typeof mkP==='function'&&typeof S!=='undefined');
 const initial=await hub.evaluate(()=>{
  const a=mkP('TEST-ARCADE-A'),b=mkP('TEST-ARCADE-B');
  a.videoG=5000;a.cp.psc1=2;a.acadDone={FR_6E_01:true};
  a.pixhareDone={JURIDIQUE_01:new Date().toISOString(),NUMERIQUE_01:new Date().toISOString()};
  syncPixharePlayerProgress(a);b.videoG=100;S.players={[a.code]:a,[b.code]:b};save(false);
  return {xp:xgLife(a),snapshot:JSON.parse(localStorage.getItem('pvs_arcade_xp_v1')),raw:localStorage.getItem('pvs_hof_v2')};
 });
 assert.equal(initial.xp,5605);assert.equal(initial.snapshot['TEST-ARCADE-A'].earned,5605);
 await page.goto('https://shop.test/BONUS_ARCADE.html');
 await page.locator('#shop-disclosure summary').click();
 await page.locator('button[data-part="lateral"]').click();
 await page.waitForFunction(()=>readWallet(shopPlayer()).levels.lateral===1,null,{polling:50});
 assert.deepEqual(await page.evaluate(()=>{const w=readWallet(shopPlayer());return{level:w.levels.lateral,spent:w.spent,earned:w.earned};}),{level:1,spent:80,earned:5605});
 assert.equal(await page.evaluate(()=>localStorage.getItem('pvs_hof_v2')),initial.raw);
 await page.reload();assert.equal(await page.evaluate(()=>readWallet(shopPlayer()).levels.lateral),1);
 const tab=await context.newPage();await tab.goto('https://shop.test/BONUS_ARCADE.html');
 const concurrent=await Promise.all([page.evaluate(()=>buyPart('lateral')),tab.evaluate(()=>buyPart('lateral'))]);
 assert.deepEqual(concurrent,[true,true]);
 assert.deepEqual(await page.evaluate(()=>{const w=readWallet(shopPlayer());return [w.levels.lateral,w.spent];}),[3,460]);
 assert.equal(await page.evaluate(()=>buyPart('lateral',1)),false,'stale displayed price cannot buy a different tier');
 assert.equal(await page.evaluate(()=>readWallet(shopPlayer()).spent),460);
 await page.evaluate(()=>{localStorage.setItem('pvs_current_player','TEST-ARCADE-B');refreshHangar();});
 assert.equal(await page.evaluate(()=>buyPart('wing')),false);
 assert.equal(await page.evaluate(()=>buyPart('shield')),true);
 assert.equal(await page.evaluate(()=>buyPart('shield')),false);
 assert.equal(await page.evaluate(()=>readWallet(shopPlayer()).spent),100);
 await page.evaluate(()=>{localStorage.setItem('pvs_current_player','TEST-ARCADE-A');refreshHangar();});
 assert.equal(await page.evaluate(()=>readWallet(shopPlayer()).levels.shield||0),0);
 const grown=await hub.evaluate(()=>{S.players['TEST-ARCADE-A'].videoG+=6000;save(false);return {xp:xgLife(S.players['TEST-ARCADE-A']),raw:localStorage.getItem('pvs_hof_v2')};});
 assert.equal(grown.xp,11725);
 await page.evaluate(()=>refreshHangar());
 for(const id of ['lateral','pulse','shield','repair','wing']){
  while(await page.evaluate(id=>(readWallet(shopPlayer()).levels[id]||0)<5,id))assert.equal(await page.evaluate(id=>buyPart(id),id),true);
  assert.equal(await page.evaluate(id=>buyPart(id,4),id),false);
 }
 const wallet=await page.evaluate(()=>readWallet(shopPlayer()));
 assert.equal(wallet.spent,10870);assert.equal(wallet.earned,11725);
 assert.equal(await page.evaluate(()=>localStorage.getItem('pvs_hof_v2')),grown.raw);
 await page.getByRole('button',{name:'INITIALISER PROTOCOLE'}).click();
 const stats=await page.evaluate(()=>{
  GAME.active=false;const x=player.x,y=player.y;INPUT.right=true;player.update();INPUT.right=false;
  bullets=[];player.shoot();
  return {dx:player.x-x,dy:player.y-y,pulses:player.pulses,shield:player.shield,regen:player.regenRate,shots:bullets.length,wing:bullets.filter(b=>b.tint==='#00ff99').map(b=>b.enemyDamage)};
 });
 assert.ok(Math.abs(stats.dx-11.2)<1e-8);assert.equal(stats.dy,0);assert.equal(stats.pulses,5);assert.equal(stats.shield,5);assert.equal(stats.regen,1);
 assert.equal(stats.shots,3);assert.deepEqual(stats.wing,[26,26]);
 const defence=await page.evaluate(()=>{
  const before=player.hp;player.hit();const protectedHP=player.hp===before;
  player.hp=95;for(let i=0;i<60;i++)player.update();
  return {shield:player.shield,protectedHP,hp:player.hp};
 });
 assert.deepEqual(defence,{shield:4,protectedHP:true,hp:96});
 await page.evaluate(()=>{
  GAME.active=true;enemies=[new Enemy('RUMEUR')];bullets=[new Bullet(0,0,0,0,'ENEMY'),new Bullet(0,0,0,0,'PLAYER')];
  boss=new Boss();boss.phase='FIGHT';boss.hp=500;boss.hpMax=500;
 });
 await page.keyboard.press('b');
 assert.deepEqual(await page.evaluate(()=>({pulses:player.pulses,activeEnemies:enemies.filter(e=>e.active).length,hostile:bullets.filter(b=>b.source==='ENEMY').length,bossHP:boss.hp})),{pulses:4,activeEnemies:0,hostile:0,bossHP:200});
 await page.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'b',repeat:true})));
 assert.equal(await page.evaluate(()=>player.pulses),4);
 await page.locator('#pulse-button').click();
 assert.equal(await page.evaluate(()=>player.pulses),3);
 assert.equal(await page.evaluate(()=>buyPart('shield')),false);
 await page.evaluate(()=>{GAME.active=false;});await page.reload();
 await page.getByRole('button',{name:'INITIALISER PROTOCOLE'}).click();
 assert.equal(await page.evaluate(()=>player.pulses),5);
 assert.equal(await page.evaluate(()=>readWallet(shopPlayer()).spent),10870);
 assert.equal(await page.evaluate(()=>localStorage.getItem('pvs_hof_v2')),grown.raw);
 await page.evaluate(()=>{GAME.active=false;localStorage.setItem(walletKey(shopPlayer()),'broken');});await page.reload();
 assert.equal(await page.evaluate(()=>buyPart('shield')),false);
 assert.equal(await page.evaluate(()=>localStorage.getItem(walletKey(shopPlayer()))),'broken');
 assert.equal(await page.locator('#arcade-shop button:not([disabled])').count(),0);
 await page.evaluate(()=>{localStorage.setItem('pvs_current_player','VISITEUR');refreshHangar();});
 assert.equal(await page.evaluate(()=>buyPart('shield')),false);
 await page.evaluate(()=>{localStorage.setItem('pvs_current_player','UNKNOWN');refreshHangar();});
 assert.equal(await page.evaluate(()=>buyPart('shield')),false);
 await page.evaluate(()=>{localStorage.removeItem('pvs_current_player');localStorage.setItem('pvs_phare_player','TEST-ARCADE-A');refreshHangar();});
 assert.equal(await page.evaluate(()=>shopPlayer()),'','old PIXHARe code cannot select a logged-out wallet');
 assert.deepEqual(errors,[]);
 console.log('PASS actual hub XP export, purchases, concurrent tabs, persistence, player isolation, five tiers, actual movement/projectiles/pulse, no XP debit, corrupt/visitor/unknown wallets');
}finally{await browser.close();}

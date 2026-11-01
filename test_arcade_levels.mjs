import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PVS_PLAYWRIGHT_MODULE||'playwright');
const source=await readFile(new URL('./BONUS_ARCADE.html',import.meta.url),'utf8');
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:900,height:700}}), errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>r.request().url().startsWith('http://arcade.test/')?r.fulfill({contentType:'text/html; charset=utf-8',body:source}):r.abort());
 await page.goto('http://arcade.test/');
 assert.deepEqual(await page.evaluate(()=>[1,2,3,4,5].map(sectorUnlocked)),[true,false,false,false,false]);
 await page.evaluate(()=>{chooseSector(5);});
 assert.equal(await page.evaluate(()=>selectedSector),1);
 const pillars=['GROUPE','HISTOIRE','JURIDIQUE','NEURO','NUMERIQUE','VEA'];
 for(let tier=2;tier<=5;tier++){
   await page.evaluate(({pillars,tier})=>{
     for(const p of pillars.filter(p=>p!=='VEA'))localStorage.setItem('CERT_PHARE_'+p+'_0'+tier,'true');
     refreshHangar();
   },{pillars,tier});
   assert.equal(await page.evaluate(n=>sectorUnlocked(n),tier),false,'VEA required for tier '+tier);
   await page.evaluate(t=>{localStorage.setItem('CERT_PHARE_VEA_0'+t,'true');window.dispatchEvent(new StorageEvent('storage',{key:'CERT_PHARE_VEA_0'+t}));},tier);
   assert.equal(await page.evaluate(n=>sectorUnlocked(n),tier),true);
   await page.getByRole('button',{name:new RegExp('^Niveau '+tier+' ·')}).click();
   assert.equal(await page.evaluate(()=>selectedSector),tier);
 }
 assert.deepEqual(await page.evaluate(()=>[0,6,NaN,2.5].map(sectorUnlocked)),[false,false,false,false]);
 // A missing lower tier still locks later sectors, even with all higher certificates.
 await page.evaluate(()=>{localStorage.removeItem('CERT_PHARE_NEURO_02');refreshHangar();});
 assert.deepEqual(await page.evaluate(()=>[2,3,4,5].map(sectorUnlocked)),[false,false,false,false]);
 assert.equal(await page.evaluate(()=>selectedSector),1);
 await page.evaluate(()=>{localStorage.setItem('CERT_NEU_2','legacy');refreshHangar();});
 assert.equal(await page.evaluate(()=>sectorUnlocked(5)),true);
 await page.getByRole('button',{name:/^Niveau 5 ·/}).click();
 await page.getByRole('button',{name:'INITIALISER PROTOCOLE'}).click();
 const upgraded=await page.evaluate(()=>{
   GAME.active=false;bullets=[];player.shoot();
   const shots=bullets.map(b=>({damage:b.enemyDamage,boss:b.bossDamage,up:b.photonV}));
   INPUT.fire=true;player.fireDelay=0;player.update();INPUT.fire=false;
   const cadence=player.fireDelay, enemy=new Enemy('RUMEUR'), bossHP=new Boss().hp;
   enemies=[];boss=null;GAME.bossMode=false;GAME.score=0;GAME.frame=5760;spawnManager();
   return {sector:GAME.sector,shots,cadence,hp:enemy.hp,bossHP,wave:enemies.length};
 });
 assert.equal(upgraded.sector,5);assert.ok(upgraded.shots.every(b=>b.damage===30&&b.boss===20&&b.up));
 assert.equal(upgraded.cadence,5); // update decrements the six-frame cooldown once.
 assert.equal(upgraded.hp,44);assert.equal(upgraded.bossHP,1100);assert.equal(upgraded.wave,3);
 const hitHP=await page.evaluate(()=>{
   const target=new Enemy('REVENGE PORN');target.x=200;target.y=200;target.speed=0;
   enemies=[target];boss=null;bullets=[new Bullet(200,200,0,0,'PLAYER',true)];
   GAME.score=0;GAME.frame=1;GAME.active=true;loop();GAME.active=false;
   return target.hp;
 });
 assert.equal(hitHP,234,'upgraded projectile removes 30 HP from a sector-five tank (264 HP)');
 await page.evaluate(()=>{localStorage.clear();for(const n of [1,2,3,4,6])localStorage.setItem('CERT_PHARE_NUMERIQUE_'+String(n).padStart(2,'0'),'true');});
 await page.reload();
 assert.equal(await page.evaluate(()=>new Player().photonV),false,'five arbitrary modules do not unlock Photon V');
 await page.getByRole('button',{name:'INITIALISER PROTOCOLE'}).click();
 const standard=await page.evaluate(()=>{GAME.active=false;bullets=[];player.shoot();return bullets.map(b=>[b.enemyDamage,b.bossDamage,b.photonV]);});
 assert.ok(standard.every(b=>b[0]===15&&b[1]===10&&!b[2]));
 assert.equal(await page.evaluate(()=>localStorage.getItem('pvs_bridge_events')),null,'no new arcade XP issued');
 assert.deepEqual(errors,[]);
 console.log('PASS sectors 1–5, six pillars, missing prerequisites, legacy certificates, Photon V, real projectiles and scaled waves/boss');
} finally {await browser.close();}

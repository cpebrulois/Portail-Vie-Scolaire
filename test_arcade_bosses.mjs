import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PVS_PLAYWRIGHT_MODULE||'playwright');
const source=await readFile(new URL('./BONUS_ARCADE.html',import.meta.url),'utf8');
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1520,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
 await page.route('**/*',r=>r.request().url().startsWith('http://boss.test/')?r.fulfill({contentType:'text/html; charset=utf-8',body:source}):r.abort());
 await page.goto('http://boss.test/');
 const previews=await page.evaluate(()=>{
  player.x=canvas.width/2-100;player.y=canvas.height-150;
  const results=[];
  for(let sector=1;sector<=10;sector++) {
   GAME.sector=sector;const enemy=sector===10?new MegaBoss():new Boss();
   enemy.phase='FIGHT';enemy.frame=120;enemy.x=canvas.width/2;enemy.y=200;enemy.shotPattern=1;
   bullets=[];enemy.firePattern();
   const signature=JSON.stringify(bullets.map(b=>[b.x,b.y,+b.dx.toFixed(5),+b.dy.toFixed(5)]));
   const fired=bullets.length;
   ctx.clearRect(0,0,canvas.width,canvas.height);enemy.draw();
   const art=document.createElement('canvas');art.width=300;art.height=300;
   const c=art.getContext('2d');c.fillStyle='#090e20';c.fillRect(0,0,300,300);
   c.drawImage(canvas,enemy.x-150,enemy.y-150,300,300,0,0,300,300);
   bullets=[];for(let i=0;i<90;i++)enemy.update();
   results.push({sector,name:enemy.profile.name,hint:enemy.profile.hint,pattern:enemy.profile.pattern,signature,fired,scheduled:bullets.length,image:art.toDataURL()});
  }
  return results;
 });
 assert.equal(new Set(previews.map(p=>p.name)).size,10);
 assert.equal(new Set(previews.map(p=>p.pattern)).size,10);
 assert.equal(new Set(previews.map(p=>p.signature)).size,10);
 assert.equal(new Set(previews.map(p=>p.image)).size,10);
 assert.ok(previews.every(p=>p.fired>0&&p.scheduled>0));
 assert.deepEqual(errors,[]);
 console.log('PASS ten distinct boss names, silhouettes, projectile geometries and live scheduled attacks; megaboss preserved');
 if(process.env.PVS_BOSS_PREVIEW) {
  await page.setContent('<!doctype html><meta charset="utf-8"><style>body{background:#090e20;color:#dce9ff;font:15px Arial;margin:20px}h1{color:#00ddff}main{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}article{border:1px solid #345;border-radius:12px;padding:8px}img{width:100%;display:block}h2{font-size:15px;color:#ffd700}p{line-height:1.4;min-height:45px}</style><h1>Les dix gardiens des réseaux</h1><p>Boss dessinés par le moteur du jeu · Silhouettes et attaques propres à chaque secteur</p><main></main>');
  await page.evaluate(list=>{for(const p of list){const card=document.createElement('article'),title=document.createElement('h2'),img=document.createElement('img'),text=document.createElement('p');title.textContent=p.sector+' · '+p.name;img.src=p.image;img.alt=p.name;text.textContent=p.hint;card.append(title,img,text);document.querySelector('main').appendChild(card);}},previews);
  await mkdir(path.dirname(process.env.PVS_BOSS_PREVIEW),{recursive:true});
  await page.screenshot({path:process.env.PVS_BOSS_PREVIEW,fullPage:true});
 }
}finally{await browser.close();}

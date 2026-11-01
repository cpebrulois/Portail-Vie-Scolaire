import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PVS_PLAYWRIGHT_MODULE||'playwright');
const root=path.dirname(fileURLToPath(import.meta.url));
const manifest=JSON.parse(await readFile(path.join(root,'assets/arcade/cyberspace-manifest.json'),'utf8'));
assert.equal(manifest.assets.length,10);assert.equal(new Set(manifest.assets.map(a=>a.sha256)).size,10);
for(const asset of manifest.assets){const data=await readFile(path.join(root,asset.file));assert.equal(createHash('sha256').update(data).digest('hex'),asset.sha256);assert.equal(data.length,asset.bytes);assert.ok(asset.width>1000&&asset.height>600);}
const browser=await chromium.launch({channel:'msedge',headless:true});
function seed(){
 window.requestAnimationFrame=()=>0;
 for(const name of ['GROUPE','HISTOIRE','JURIDIQUE','NEURO','NUMERIQUE','VEA'])for(let n=1;n<=10;n++)localStorage.setItem('CERT_PHARE_'+name+'_'+String(n).padStart(2,'0'),'true');
}
async function serve(route){
 const u=new URL(route.request().url());if(u.hostname!=='background.test')return route.abort();
 const file=path.resolve(root,'.'+u.pathname);if(!file.startsWith(root+path.sep))return route.abort();
 try{return await route.fulfill({contentType:file.endsWith('.png')?'image/png':file.endsWith('.jpg')?'image/jpeg':file.endsWith('.html')?'text/html; charset=utf-8':'text/plain',body:await readFile(file)});}catch{return route.fulfill({status:404,body:''});}
}
try{
 const page=await browser.newPage({viewport:{width:1520,height:1000}}),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/cyberspace-\d+.png/.test(r.url()))requests.push(r.url());});
 await page.addInitScript(seed);await page.route('**/*',serve);
 await page.goto('http://background.test/BONUS_ARCADE.html');
 await page.waitForFunction(()=>document.querySelector('#bg-image').dataset.backgroundSector==='1',null,{polling:50});
 assert.equal(new Set(requests).size,1,'only selected backdrop is loaded');
 let release;const held=new Promise(resolve=>{release=resolve;});
 await page.route('**/cyberspace-03.png',async r=>{await held;await serve(r);});
 const pending=page.waitForRequest('**/cyberspace-03.png');
 await page.evaluate(()=>chooseSector(3));await pending;
 await page.evaluate(()=>chooseSector(4));
 await page.waitForFunction(()=>document.querySelector('#bg-image').dataset.backgroundSector==='4',null,{polling:50});
 const late=page.waitForResponse('**/cyberspace-03.png');release();await late;await page.waitForTimeout(100);
 assert.equal(await page.locator('#bg-image').getAttribute('data-background-sector'),'4','late old load cannot replace current sector');
 for(let n=1;n<=10;n++){
  await page.getByRole('button',{name:new RegExp('^Niveau '+n+' ·')}).click();
  await page.waitForFunction(n=>document.querySelector('#bg-image').dataset.backgroundSector===String(n),n,{polling:50});
  const css=await page.locator('#bg-image').evaluate(el=>getComputedStyle(el).backgroundImage);
  assert.ok(css.includes('cyberspace-'+String(n).padStart(2,'0')+'.png'));
 }
 const before=requests.length;await page.evaluate(()=>{refreshHangar();refreshHangar();setSectorBackdrop(0);});
 assert.equal(requests.length,before,'refresh does not reload the same backdrop');
 await page.evaluate(()=>{const slider=document.querySelector('.opacity-control input');slider.value=25;slider.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.getByRole('button',{name:'INITIALISER PROTOCOLE'}).click();
 assert.equal(await page.locator('#bg-image').evaluate(el=>el.style.opacity),'0.25');
 assert.equal(await page.locator('#bg-image').evaluate(el=>getComputedStyle(el).filter),'none');
 await page.evaluate(()=>{const slider=document.querySelector('.opacity-control input');slider.value=50;slider.dispatchEvent(new Event('input',{bubbles:true}));});
 if(process.env.PVS_BACKGROUND_QA_DIR){await mkdir(process.env.PVS_BACKGROUND_QA_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.PVS_BACKGROUND_QA_DIR,'niveau-10-en-jeu.png')});}
 // Missing image remains playable with the original background.
 const fallback=await browser.newPage();await fallback.addInitScript(seed);await fallback.route('**/*',serve);
 await fallback.route('**/cyberspace-10.png',r=>r.abort());
 await fallback.goto('http://background.test/BONUS_ARCADE.html');await fallback.evaluate(()=>chooseSector(10));
 await fallback.waitForFunction(()=>document.querySelector('#bg-image').dataset.backgroundState==='fallback',null,{polling:50});
 assert.ok(await fallback.locator('#bg-image').evaluate(el=>el.style.backgroundImage.includes('background.jpg')));
 await fallback.close();
 assert.deepEqual(errors,[]);
 console.log('PASS ten decoded unique assets with hashes, actual sector buttons, lazy loading, stale-request protection, opacity, original colors and graceful fallback');
 if(process.env.PVS_BACKGROUND_PREVIEW){
  const titles=await page.evaluate(()=>SECTORS);
  await page.evaluate(()=>{GAME.active=false;});
  await page.setContent('<!doctype html><meta charset="utf-8"><style>body{background:#080f20;color:#e2edff;font:16px Arial;margin:22px}h1{color:#5ee6ff}main{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}article{background:#101a30;border:1px solid #345;border-radius:10px;padding:10px}img{display:block;width:100%}h2{font-size:19px;color:#ffd16a}</style><h1>GUARDIAN pHARe — Dix cyberespaces</h1><p>Fonds originaux générés pour les dix niveaux · Couloir central sombre pour préserver la lisibilité du jeu</p><main></main>');
  await page.evaluate(titles=>{titles.forEach((title,i)=>{const article=document.createElement('article'),h=document.createElement('h2'),img=document.createElement('img');h.textContent=(i+1)+' · '+title;img.src='assets/arcade/cyberspace-'+String(i+1).padStart(2,'0')+'.png';img.alt=title;article.append(h,img);document.querySelector('main').appendChild(article);});},titles);
  await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
  await mkdir(path.dirname(process.env.PVS_BACKGROUND_PREVIEW),{recursive:true});
  await page.screenshot({path:process.env.PVS_BACKGROUND_PREVIEW,fullPage:true});
 }
}finally{await browser.close();}

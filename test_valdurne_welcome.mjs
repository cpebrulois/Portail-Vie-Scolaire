import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PVS_PLAYWRIGHT_MODULE);
const root=path.dirname(fileURLToPath(import.meta.url)),out=process.env.PVS_VALDURNE_QA_DIR;
await mkdir(out,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});
const steps=[],errors=[];const A='TEST-VALDURNE-A',B='TEST-VALDURNE-B';
try{
 const context=await browser.newContext({viewport:{width:1280,height:1000}});
 await context.route('**/*',async route=>{
  const u=new URL(route.request().url());if(u.hostname!=='valdurne.test')return route.abort();
  if(u.pathname==='/harness.html')return route.fulfill({contentType:'text/html; charset=utf-8',body:'<!doctype html><html><head><link rel="stylesheet" href="valdurne_accueil.css"></head><body><button id="outside">Le portail</button><script>var cur="'+A+'",isVisitor=false,adminOn=false;</script><script src="valdurne_accueil.js"></script></body></html>'});
  const file=path.resolve(root,'.'+u.pathname);if(!file.startsWith(root+path.sep))return route.abort();
  try{return route.fulfill({contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':'text/html; charset=utf-8',body:await readFile(file)});}catch{return route.fulfill({status:404,body:''});}
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto('https://valdurne.test/harness.html');
 await page.evaluate(({A,B})=>{sessionStorage.setItem('pvs_session_auth_v1','1');localStorage.setItem('pvs_current_player',A);localStorage.setItem('pvs_hof_v2',JSON.stringify({players:{[A]:{rankData:{i:0},filageDone:{},cp:{}},[B]:{rankData:{i:2},filageDone:{'2_1':'2026-11-01'},cp:{}}}}));localStorage.setItem('pvs_seuil',JSON.stringify({etape:7,fini:true}));},{A,B});
 assert.equal(await page.evaluate(()=>PVSValdurneWelcome.maybeOpen()),true);
 await page.frameLocator('iframe').locator('#titre').getByText('La Route',{exact:true}).waitFor();
 assert.equal(await page.frameLocator('iframe').locator('#titre').textContent(),'La Route');
 await page.screenshot({path:path.join(out,'accueil_desktop.png')});steps.push('new pupil sees threshold first; unowned legacy state is not assigned to that pupil');
 await page.locator('#valdurneWelcomeClose').click();assert.equal(await page.locator('dialog').evaluate(e=>e.open),false);
 await page.locator('#outside').click();assert.equal(await page.evaluate(()=>PVSValdurneWelcome.maybeOpen()),true);assert.equal(await page.locator('dialog').evaluate(e=>e.open),false);
 steps.push('close allows free exploration; normal refresh does not reopen the same view');
 await page.reload();await page.evaluate(()=>PVSValdurneWelcome.maybeOpen());await page.frameLocator('iframe').locator('#titre').waitFor();assert.equal(await page.locator('dialog').evaluate(e=>e.open),true);
 steps.push('a new portal opening welcomes the pupil again');
 await page.frameLocator('iframe').locator('#btnQuit').click();await page.waitForFunction(()=>!document.querySelector('dialog').open);
 steps.push('embedded Quit closes the welcome without opening a nested portal');
 await page.evaluate(B=>{cur=B;localStorage.setItem('pvs_current_player',B);PVSValdurneWelcome.maybeOpen();},B);
 assert.match(await page.locator('iframe').getAttribute('src'),/filage\.html/);await page.frameLocator('iframe').locator('#titre').waitFor();
 const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('pvs_hof_v2')).players);
 assert.deepEqual(before[B].filageDone,{'2_1':'2026-11-01'});steps.push('returning pupil opens the level-appropriate filage; verified chapters and XP are not modified on opening');
 await page.locator('#valdurneWelcomeClose').click();
 await page.evaluate(()=>{cur='VISITOR';isVisitor=true;});assert.equal(await page.evaluate(()=>PVSValdurneWelcome.maybeOpen()),false);
 await page.evaluate(()=>{cur='ADMIN';isVisitor=false;adminOn=true;});assert.equal(await page.evaluate(()=>PVSValdurneWelcome.maybeOpen()),false);
 await page.evaluate(()=>{cur='PROF';adminOn=false;localStorage.setItem('pvs_role','prof');});assert.equal(await page.evaluate(()=>PVSValdurneWelcome.maybeOpen()),false);
 steps.push('no forced student quest for visitor, administrator or primary teacher');
 await page.evaluate(A=>{cur=A;localStorage.setItem('pvs_current_player',A);localStorage.removeItem('pvs_role');localStorage.setItem('pvs_seuil:'+A,JSON.stringify({player:A,etape:3,bloc:0}));},A);
 await page.goto('https://valdurne.test/seuil.html');await page.locator('#titre').getByText("Avant de veiller sur d'autres",{exact:true}).waitFor();
 await page.evaluate(B=>localStorage.setItem('pvs_current_player',B),B);await page.reload();assert.equal(await page.locator('#titre').textContent(),'La Route');steps.push('threshold positions are isolated per pupil and survive reload');
 await page.setViewportSize({width:390,height:844});await page.goto('https://valdurne.test/harness.html');await page.evaluate(()=>{localStorage.removeItem('pvs_role');PVSValdurneWelcome.maybeOpen();});
 await page.frameLocator('iframe').locator('#titre').waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:path.join(out,'accueil_mobile.png')});
 steps.push('mobile modal is framed inside the viewport with a visible exit');
 assert.deepEqual(errors,[]);console.log(JSON.stringify({ok:true,steps,errors},null,2));
 await writeFile(path.join(out,'welcome_checks.json'),JSON.stringify({checked_at:new Date().toISOString(),steps,errors},null,2));
}finally{await browser.close();}

import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PVS_PLAYWRIGHT_MODULE);
const root=path.dirname(fileURLToPath(import.meta.url)),out=process.env.PVS_VALDURNE_QA_DIR;
await mkdir(out,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});
const A='TEST-VALDURNE-A',steps=[],errors=[];
try{
 const context=await browser.newContext({viewport:{width:1440,height:1100}});
 await context.route('**/*',async route=>{
  const u=new URL(route.request().url());if(u.hostname!=='valdurne.test')return route.abort();
  if(u.pathname.endsWith('.csv'))return route.fulfill({contentType:'text/csv',body:''});
  if(u.pathname.startsWith('/api/'))return route.fulfill({status:503,contentType:'application/json',body:'{"error":"Test offline"}'});
  const file=path.resolve(root,'.'+(u.pathname==='/'?'/index.html':u.pathname));if(!file.startsWith(root+path.sep))return route.abort();
  const types={'.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.webp':'image/webp','.html':'text/html; charset=utf-8','.json':'application/json','.png':'image/png'};
  try{return route.fulfill({contentType:types[path.extname(file)]||'application/octet-stream',body:await readFile(file)});}catch{return route.fulfill({status:404,body:''});}
 });
 await context.addInitScript(A=>{
  if(location.hostname!=='valdurne.test'||sessionStorage.getItem('qa-seeded'))return;
  sessionStorage.setItem('qa-seeded','1');sessionStorage.setItem('pvs_session_auth_v1','1');
  localStorage.setItem('pvs_current_player',A);localStorage.setItem('pvs_role','eleve');
  localStorage.setItem('pvs_hof_v2',JSON.stringify({players:{[A]:{code:A,cp:{pixhare:0,psc1:0,sanctuaire:0,loge:0,autres:0,liberte:0,fraternite:0},videoG:20000,filageDone:{},acadDone:{}}},registry:[{code_joueur:A}],logs:[],seen:{},adults:[],parents:[]}));
  localStorage.setItem('pvs_tutorial_seen_v1','1');localStorage.setItem('pvs_rules_seen_v1','1');
 },A);
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto('https://valdurne.test/index.html');await page.locator('#valdurneWelcome[open]').waitFor();
 await page.frameLocator('#valdurneWelcome iframe').locator('#titre').getByText('La Route',{exact:true}).waitFor();
  await page.frameLocator('#valdurneWelcome iframe').locator('#illus img').waitFor();assert.ok(await page.frameLocator('#valdurneWelcome iframe').locator('#illus img').evaluate(i=>i.complete&&i.naturalWidth>1000));
  assert.equal(await page.evaluate(()=>document.fullscreenElement),null);assert.equal(await page.locator('#rewardOverlay').evaluate(e=>e.classList.contains('active')),false);
 await page.screenshot({path:path.join(out,'portail_accueil_desktop.png')});steps.push('actual portal opens the illustrated welcome after restored authentication');
 await page.locator('#valdurneWelcomeClose').click();await page.waitForFunction(()=>!document.querySelector('#valdurneWelcome').open);
 await page.reload();await page.locator('#valdurneWelcome[open]').waitFor();steps.push('actual portal reopening shows the welcome again');
 await page.locator('#valdurneWelcomeClose').click();
 for(let i=1;i<=10;i++){
  const nn=String(i).padStart(2,'0');await page.goto('https://valdurne.test/roman_ch'+nn+'.html');
  await page.locator('.valdurne-book-art img').waitFor();assert.ok(await page.locator('.valdurne-book-art img').evaluate(i=>i.complete&&i.naturalWidth>=1024));
  if(i===3){await page.screenshot({path:path.join(out,'roman_ch03_desktop.png')});await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:path.join(out,'roman_ch03_mobile.png')});await page.setViewportSize({width:1440,height:1100});}
 }
 steps.push('all ten volume-I chapter pages load their full illustrations; mobile chapter has no page overflow');
 await page.goto('https://valdurne.test/seuil.html');
 for(let i=0;i<8;i++){
  await page.evaluate(i=>ouvrirEtape(i),i);
  await page.waitForFunction(()=>{const i=document.querySelector('#illus img');return i&&i.complete&&i.naturalWidth>1000;});
 }
 steps.push('all eight threshold images render, including the fixed Kern reference');
 await page.goto('https://valdurne.test/hub_narration.html');
 await page.waitForFunction(()=>document.querySelectorAll('#listChapitres .chapter.has-img').length===10);
 assert.equal(await page.evaluate(()=>CHAPITRES.map(c=>c.xpRequired).join(',')),'0,500,1000,1500,2000,2500,3000,3500,4000,4500');
 steps.push('library lists ten illustrated chapters and retains the original XP unlock thresholds');
 assert.deepEqual(errors,[]);const report={checked_at:new Date().toISOString(),steps,errors,mode:'Local browser with synthetic pupil; all external services blocked.'};
 await writeFile(path.join(out,'portal_checks.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}

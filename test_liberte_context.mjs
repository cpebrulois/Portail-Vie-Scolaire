import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PVS_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const source=await readFile(new URL('./index_PIX_LIBERTE.html',import.meta.url),'utf8');
 await page.route('**/*',async r=>{
  const u=new URL(r.request().url());
  if(u.hostname==='unpkg.com')return r.continue();
  if(u.hostname==='liberte.test')return r.fulfill({contentType:'text/html',body:u.pathname==='/LIB_DR01.html'?await readFile(new URL('./LIB_DR01.html',import.meta.url),'utf8'):source});
  return r.abort();
 });
 await page.goto('http://liberte.test/?player=TEST-PUBLIC-0159');
 await page.locator('.mod-card').first().waitFor();
 assert.equal(await page.locator('.mod-card').count(),13);
 assert.equal(await page.evaluate(()=>getPlayer()),'TEST-PUBLIC-0159');
 assert.equal(await page.locator('#libForgeBtn').isVisible(),false);
 assert.equal(await page.locator('input[type=password]').count(),0);
 await page.locator('.mod-card').first().click();
 await page.waitForURL('**/LIB_DR01.html');
 assert.equal(await page.evaluate(()=>getPlayer()),'TEST-PUBLIC-0159');
 await page.evaluate(()=>sessionStorage.setItem('pvs_admin_session_v1','1'));
 await page.goto('http://liberte.test/');await page.locator('.mod-card').first().waitFor();
 assert.equal(await page.locator('#libForgeBtn').isVisible(),true);
 await page.locator('#libForgeBtn').click();
 assert.equal(await page.locator('#adminGateModal').isVisible(),true);
 assert.equal(await page.locator('#adminGateInput').getAttribute('type'),'password');
 assert.deepEqual(errors,[]);
 console.log('PASS thirteen learner modules accessible with inherited public identity; Forge hidden for pupils and still password protected');
}finally{await browser.close();}

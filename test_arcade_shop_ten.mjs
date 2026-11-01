import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PVS_PLAYWRIGHT_MODULE||'playwright');
const source=await readFile(new URL('./BONUS_ARCADE.html',import.meta.url),'utf8');
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  window.requestAnimationFrame=()=>0;
  localStorage.setItem('pvs_current_player','TEN-LEGACY');
  localStorage.setItem('pvs_arcade_xp_v1',JSON.stringify({'TEN-LEGACY':{earned:200000}}));
 });
 await page.route('**/*',r=>r.request().url().startsWith('https://ten.test/')?r.fulfill({contentType:'text/html; charset=utf-8',body:source}):r.abort());
 await page.goto('https://ten.test/');
 const oldCosts=[[80,140,240,400,650],[150,250,400,650,1000],[100,180,300,500,800],[120,220,360,580,900],[180,320,500,750,1100]];
 assert.deepEqual(await page.evaluate(()=>SHOP_ITEMS.map(p=>p.costs.slice(0,5))),oldCosts);
 assert.ok(await page.evaluate(()=>SHOP_ITEMS.every(p=>p.costs.length===10&&p.costs.every((cost,i)=>Number.isSafeInteger(cost)&&cost>0&&(i===0||cost>p.costs[i-1])))));
 // Restore the exact previous five-tier ledger; opening the new shop must not rewrite it.
 const legacy=JSON.stringify({v:1,earned:200000,spent:10870,levels:{lateral:5,pulse:5,shield:5,repair:5,wing:5}});
 await page.evaluate(raw=>{localStorage.setItem(walletKey(shopPlayer()),raw);renderShop();},legacy);
 assert.equal(await page.evaluate(()=>localStorage.getItem(walletKey(shopPlayer()))),legacy);
 assert.equal(await page.evaluate(()=>readWallet(shopPlayer()).spent),10870);
 assert.equal(await page.locator('#arcade-shop h3').filter({hasText:'5/10'}).count(),5);
 for(const id of ['lateral','pulse','shield','repair','wing']){
  for(let level=5;level<10;level++)assert.equal(await page.evaluate(({id,level})=>buyPart(id,level),{id,level}),true);
  assert.equal(await page.evaluate(id=>buyPart(id),id),false);
 }
 const wallet=await page.evaluate(()=>readWallet(shopPlayer()));
 assert.deepEqual(Object.values(wallet.levels),[10,10,10,10,10]);
 assert.equal(wallet.spent,await page.evaluate(()=>SHOP_ITEMS.reduce((n,p)=>n+p.costs.reduce((a,b)=>a+b,0),0)));
 assert.equal(await page.locator('#arcade-shop button:not([disabled])').count(),0);
 await page.reload();
 assert.deepEqual(await page.evaluate(()=>readWallet(shopPlayer()).levels),wallet.levels);
 await page.getByRole('button',{name:'INITIALISER PROTOCOLE'}).click();
 const performance=await page.evaluate(()=>{
  GAME.active=false;const x=player.x;INPUT.right=true;player.update();INPUT.right=false;
  bullets=[];player.shoot();
  return {dx:player.x-x,pulses:player.pulses,shield:player.shield,regen:player.regenRate,wing:bullets.filter(b=>b.tint==='#00ff99').map(b=>b.enemyDamage)};
 });
 assert.ok(Math.abs(performance.dx-15.4)<1e-8);
 assert.deepEqual({...performance,dx:0},{dx:0,pulses:10,shield:10,regen:2,wing:[46,46]});
 assert.equal(await page.evaluate(()=>localStorage.getItem('pvs_bridge_events')),null);
 assert.deepEqual(errors,[]);
 console.log('PASS exact legacy five-tier wallet preserved, all five parts upgrade to ten, old prices unchanged, max cap, reload, real ship performance and no school XP events');
}finally{await browser.close();}

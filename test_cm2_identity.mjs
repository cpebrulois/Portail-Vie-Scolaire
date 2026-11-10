import assert from 'node:assert/strict';
import test from 'node:test';
import worker from './worker.js';

const origin='https://portal.example.invalid',env={SUPABASE_URL:'https://database.example.invalid',SUPABASE_SERVICE:'fixture-only'};
async function create(body){
  const r=await worker.fetch(new Request(origin+'/api/identite',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({action:'creer',...body})}),env,{});
  return {status:r.status,body:await r.json()};
}
test('predictable RANCE-PRIM codes cannot be activated without a personal invitation',async t=>{
  t.mock.method(globalThis,'fetch',async()=>assert.fail('No database call without an invitation'));
  assert.equal((await create({public:'RANCE-PRIM-0001',secret:'LYNX-COURAGEUX-8047'})).status,403);
});
test('primary activation hashes the invitation and uses the private atomic function',async t=>{
  let called=false;
  t.mock.method(globalThis,'fetch',async(url,options)=>{
    const u=new URL(url);assert.equal(u.origin,env.SUPABASE_URL);
    if(u.pathname.endsWith('/pvs_identites'))return Response.json(u.searchParams.has('code_secret')?[]:[{code_public:'RANCE-PRIM-0001',code_secret:null}]);
    assert.ok(u.pathname.endsWith('/rpc/pvs_cm2_activate_teacher'));called=true;
    const b=JSON.parse(options.body);assert.equal(b.p_code,'RANCE-PRIM-0001');assert.match(b.p_invite_hash,/^[a-f0-9]{64}$/);assert.notEqual(b.p_invite_hash,'a'.repeat(48));assert.equal(b.role,undefined);
    return Response.json(true);
  });
  assert.equal((await create({public:'RANCE-PRIM-0001',secret:'LYNX-COURAGEUX-8047',invitation:'a'.repeat(48),role:'admin'})).status,200);assert.equal(called,true);
});
test('expired or consumed primary invitations produce an explicit refusal',async t=>{
  t.mock.method(globalThis,'fetch',async(url)=>{
    const u=new URL(url);assert.equal(u.origin,env.SUPABASE_URL);
    if(u.pathname.endsWith('/pvs_identites'))return Response.json(u.searchParams.has('code_secret')?[]:[{code_public:'RANCE-PRIM-0001',code_secret:null}]);
    return Response.json({message:'Invitation expired'},{status:403});
  });
  const r=await create({public:'RANCE-PRIM-0001',secret:'LYNX-COURAGEUX-8047',invitation:'a'.repeat(48)});assert.equal(r.status,403);assert.match(r.body.error,/expirée/);
});
test('an already activated pupil identity cannot be overwritten by a racing signup',async t=>{
  t.mock.method(globalThis,'fetch',async(url,options)=>{
    const u=new URL(url);assert.equal(u.origin,env.SUPABASE_URL);
    if(options.method==='PATCH'){assert.equal(u.searchParams.get('code_secret'),'is.null');return Response.json([]);}
    return Response.json(u.searchParams.has('code_secret')?[]:[{code_public:'RANCE-0001',code_secret:null}]);
  });
  assert.equal((await create({public:'RANCE-0001',secret:'LYNX-COURAGEUX-8047'})).status,409);
});

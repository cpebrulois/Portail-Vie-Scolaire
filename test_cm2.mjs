import assert from 'node:assert/strict';
import test from 'node:test';
import {ACTIVITIES,question,grade} from './cm2_catalog.js';
import {fixture,classId,foreignId,assignmentId,runId} from './test_cm2_fixture.mjs';

test('all 16 catalogues are deterministic and grade their expected answers',()=>{
  assert.equal(ACTIVITIES.length,16);
  for(const a of ACTIVITIES)for(const seed of [0,1,17,99,4294967295])for(const level of [1,2,3])for(let i=0;i<6;i++){
    const q=question(a.id,i,seed,level);
    assert.deepEqual(q,question(a.id,i,seed,level));
    assert.ok(q.prompt&&q.explanation&&q.hint);
    assert.equal(grade(q,q.kind==='writing'?'Un texte':q.expected).correct,q.kind==='writing'?null:true);
    if(q.kind==='number')assert.equal(grade(q,'').correct,false);
  }
});
test('origin and session checks precede access to private tables',async()=>{
  const f=fixture();
  assert.equal((await f.call('state','pupil',{}, {headers:{Origin:'https://foreign.invalid'}})).status,403);
  assert.equal((await f.call('state','missing')).status,401);
  assert.equal(f.calls.length,0);
});
test('a removed identity cannot use an orphaned session',async()=>{
  const f=fixture();f.db.pvs_identites=f.db.pvs_identites.filter(r=>r.code_public!=='PUPIL-1');
  assert.equal((await f.call('state')).status,401);
});
test('forged roles and public codes cannot escalate pupil access',async()=>{
  const f=fixture();
  assert.equal((await f.call('create_class','pupil',{role:'admin',public:'TEACHER-1',name:'Hacked',school_year:'2026-2027'})).status,403);
  assert.equal((await f.call('class','pupil',{class_id:classId})).status,403);
});
test('admin management requires the stronger password session',async()=>{
  const f=fixture();assert.equal((await f.call('state','admin')).status,403);assert.equal((await f.call('state','full')).status,200);
});
test('teachers only see classes they own',async()=>{
  const f=fixture(),state=await f.call('state','teacher');assert.equal(state.body.classes.length,1);
  assert.equal(state.body.classes[0].id,classId);
  assert.equal((await f.call('class','teacher',{class_id:foreignId})).status,404);
  assert.equal((await f.call('run','foreign',{run_id:runId})).status,404);
});
test('class creation stores only a hash of a random invitation',async()=>{
  const f=fixture(),r=await f.call('create_class','teacher',{name:'CM2 C',school_year:'2026-2027'});
  assert.equal(r.status,200);assert.match(r.body.join_code,/^[a-f0-9]{24}$/);
  const row=f.db.pvs_cm2_classes.find(c=>c.id===r.body.id);assert.match(row.join_hash,/^[a-f0-9]{64}$/);assert.equal(row.join_code,undefined);
});
test('invitation rotation keeps members but invalidates the previous code',async()=>{
  const f=fixture(),created=await f.call('create_class','teacher',{name:'C',school_year:'2026-2027'});
  const id=created.body.id;await f.call('join','pupil',{code:created.body.join_code});
  const renewed=await f.call('renew_invite','teacher',{class_id:id});assert.equal(renewed.status,200);
  assert.notEqual(renewed.body.join_code,created.body.join_code);
  assert.equal((await f.call('join','other',{code:created.body.join_code})).status,404);
  assert.equal((await f.call('join','other',{code:renewed.body.join_code})).status,200);
  assert.equal(f.db.pvs_cm2_members.filter(m=>m.class_id===id).length,2);
  assert.equal((await f.call('renew_invite','foreign',{class_id:id})).status,404);
});
test('joining alone does not approve membership',async()=>{
  const f=fixture(),c=await f.call('create_class','teacher',{name:'C',school_year:'2026-2027'});
  assert.equal((await f.call('join','other',{code:c.body.join_code})).status,200);
  assert.equal(f.db.pvs_cm2_members.at(-1).approved,false);
  assert.equal((await f.call('join','other',{code:c.body.join_code})).status,200);
  assert.equal(f.db.pvs_cm2_members.filter(m=>m.student==='PUPIL-2').length,1);
});
test('teacher can target an individual approved pupil without selecting everyone',async()=>{
  const f=fixture();f.db.pvs_cm2_members.push({class_id:classId,student:'PUPIL-2',approved:true});
  const r=await f.call('assign','teacher',{class_id:classId,title:'Individuel',activities:['lecture'],students:['PUPIL-2'],level:2});
  assert.equal(r.status,200);assert.deepEqual(f.db.pvs_cm2_assignments.at(-1).students,['PUPIL-2']);
  assert.equal((await f.call('state','pupil')).body.assignments.length,1);
  assert.equal((await f.call('state','other')).body.assignments.length,1);
});
test('invalid and impossible due dates are rejected as user errors',async()=>{
  const f=fixture();for(const due of ['2026-13-01','2026-02-30','2026-01-99',{},'not-a-date']){
    assert.equal((await f.call('assign','teacher',{class_id:classId,title:'Date',activities:['lecture'],level:2,due})).status,400);
  }
});
test('an unapproved pupil cannot be assigned work',async()=>{
  const f=fixture();assert.equal((await f.call('assign','teacher',{class_id:classId,title:'Test',activities:['lecture'],students:['PUPIL-2'],level:2})).status,400);
});
test('pupils can independently start a central run without a class',async()=>{
  const f=fixture(),r=await f.call('start','other',{activity:'fractions',level:2,public:'PUPIL-1'});
  assert.equal(r.status,200);const row=f.db.pvs_cm2_runs.at(-1);
  assert.equal(row.student,'PUPIL-2');assert.equal(row.class_id,null);assert.equal(row.assignment_id,null);
});
test('free practice can be attached to an approved class, never to another class',async()=>{
  const f=fixture();
  assert.equal((await f.call('start','pupil',{activity:'calcul',class_id:classId})).status,200);
  assert.equal(f.db.pvs_cm2_runs.at(-1).class_id,classId);
  assert.equal((await f.call('start','other',{activity:'calcul',class_id:classId})).status,403);
});
test('logging out revokes only the current session',async()=>{
  const f=fixture();assert.equal((await f.call('logout')).status,200);
  assert.equal((await f.call('state')).status,401);assert.equal((await f.call('state','other')).status,200);
});
test('assigned starts enforce audience, membership and teacher-selected level',async()=>{
  const f=fixture();
  assert.equal((await f.call('start','other',{activity:'calcul',assignment_id:assignmentId})).status,403);
  const r=await f.call('start','pupil',{activity:'calcul',assignment_id:assignmentId,level:3});assert.equal(r.status,200);assert.equal(r.body.run.level,1);
  assert.equal((await f.call('start','pupil',{activity:'lecture',assignment_id:assignmentId})).status,403);
});
test('private runs cannot be opened by another pupil',async()=>{
  const f=fixture();assert.equal((await f.call('run','other',{run_id:runId})).status,404);
  assert.equal((await f.call('answer','other',{run_id:runId,index:0,answer:'1'})).status,404);
});
test('server grading ignores client marks and first answers cannot be rewritten',async()=>{
  const f=fixture(),q=question('calcul',0,17,2);
  const wrong=await f.call('answer','pupil',{run_id:runId,index:0,answer:'-999',correct:true});assert.equal(wrong.status,200);assert.equal(wrong.body.saved.correct,false);
  const repeat=await f.call('answer','pupil',{run_id:runId,index:0,answer:q.expected,correct:true});assert.equal(repeat.body.saved.correct,false);assert.equal(f.db.pvs_cm2_answers.length,1);
});
test('six distinct answers mark a run completed',async()=>{
  const f=fixture();for(let i=0;i<6;i++){
    const q=question('calcul',i,17,2),r=await f.call('answer','pupil',{run_id:runId,index:i,answer:q.expected});assert.equal(r.status,200);assert.equal(r.body.completed,i===5);
  }assert.equal(f.db.pvs_cm2_runs[0].completed,true);
});
test('writing is retained for human review, never given an automatic mark',async()=>{
  const f=fixture();f.db.pvs_cm2_runs[0].activity='ecriture';
  const r=await f.call('answer','pupil',{run_id:runId,index:0,answer:'Une production.'});assert.equal(r.body.saved.correct,null);
});
test('suspension or archiving prevents assigned writes, but not free practice',async()=>{
  for(const archive of [false,true]){
    const f=fixture();if(archive)f.db.pvs_cm2_assignments[0].active=false;else f.db.pvs_cm2_members[0].approved=false;
    assert.equal((await f.call('answer','pupil',{run_id:runId,index:0,answer:'8'})).status,403);
    assert.equal((await f.call('start','pupil',{activity:'calcul'})).status,200);
  }
});
test('reviews are reserved for the owner and are visible to the pupil',async()=>{
  const f=fixture();
  assert.equal((await f.call('review','foreign',{run_id:runId,status:'relu',comment:'Not mine'})).status,404);
  assert.equal((await f.call('review','teacher',{run_id:runId,status:'relu',comment:'Continue ainsi.'})).status,200);
  assert.equal((await f.call('run','pupil',{run_id:runId})).body.run.review.comment,'Continue ainsi.');
});
test('old catalogues remain readable but cannot receive new answers',async()=>{
  const f=fixture();f.db.pvs_cm2_runs[0].catalog_version='old';
  assert.equal((await f.call('run','pupil',{run_id:runId})).status,200);
  assert.equal((await f.call('answer','pupil',{run_id:runId,index:0,answer:'8'})).status,409);
});
test('malformed input and excessive requests fail safely',async()=>{
  const f=fixture();assert.equal((await f.call('class','teacher',{class_id:'x&owner=eq.TEACHER-2'})).status,400);
  assert.equal((await f.call('state','pupil',{}, {raw:'x'.repeat(16001)})).status,413);
  assert.equal((await f.call('state','pupil',{}, {raw:'[]'})).status,400);
  assert.equal((await f.call('state','pupil',{}, {env:{RL:{get:async()=>'90',put:async()=>assert.fail('Rate limit write')}}})).status,429);
});
test('a missing CM2 schema produces an explicit setup message',async()=>{
  const f=fixture(),original=f.helpers.sb;
  f.helpers.sb=async(...args)=>{if(args[2].startsWith('pvs_cm2_'))throw new Error('PGRST205');return original(...args);};
  const r=await f.call('state');assert.equal(r.status,503);assert.equal(r.body.setup_required,true);
});
test('teacher summary distinguishes graded questions, aids and human-reviewed writing',async()=>{
  const f=fixture();f.db.pvs_cm2_answers.push({run_id:runId,question_index:0,correct:true,assisted:true},{run_id:runId,question_index:1,correct:false,assisted:false},{run_id:runId,question_index:2,correct:null,assisted:false});
  const r=await f.call('class','teacher',{class_id:classId}),run=r.body.runs[0];
  assert.equal(run.answered,3);assert.equal(run.graded,2);assert.equal(run.correct,1);assert.equal(run.assisted,1);
  assert.equal(run.pvs_cm2_answers,undefined,'summary does not expose answer bodies');
});
test('only the owning teacher may prepare first-access accounts, always as pupils',async()=>{
  const f=fixture();
  assert.equal((await f.call('initial_codes','pupil',{class_id:classId,count:2})).status,403);
  assert.equal((await f.call('initial_codes','foreign',{class_id:classId,count:2})).status,404);
  const r=await f.call('initial_codes','teacher',{class_id:classId,count:2,role:'admin'});
  assert.equal(r.status,200);assert.equal(r.body.codes.length,2);
  for(const code of r.body.codes){assert.equal(code.activated,false);assert.equal(f.db.pvs_identites.find(i=>i.code_public===code.code_public).role,'eleve');}
});
test('primary teacher invitations require the fully authenticated administrator',async()=>{
  const f=fixture();
  for(const who of ['pupil','teacher','admin'])assert.equal((await f.call('teacher_codes',who,{count:1})).status,403);
  const r=await f.call('teacher_codes','full',{count:2});assert.equal(r.status,200);
  assert.equal(r.body.invitations[0].public,'RANCE-PRIM-0001');
  assert.match(r.body.invitations[0].invitation,/^[a-f0-9]{48}$/);
  const sent=f.calls.find(c=>c.path==='rpc/pvs_cm2_teacher_codes').body.p_hashes;
  assert.ok(sent.every(h=>/^[a-f0-9]{64}$/.test(h)));assert.ok(!sent.includes(r.body.invitations[0].invitation));
});
test('a teacher cannot reset a college account or an account issued by another class',async()=>{
  const f=fixture();assert.equal((await f.call('reset_student','teacher',{class_id:classId,student:'PUPIL-1'})).status,403);
  const codes=await f.call('initial_codes','teacher',{class_id:classId,count:1}),student=codes.body.codes[0].code_public;
  f.db.pvs_identites.find(i=>i.code_public===student).code_secret='SECRET-TEST-0000';
  assert.equal((await f.call('reset_student','foreign',{class_id:classId,student})).status,404);
  const before=f.db.pvs_cm2_runs.length;
  assert.equal((await f.call('reset_student','teacher',{class_id:classId,student})).status,200);
  assert.equal(f.db.pvs_cm2_runs.length,before);assert.equal(f.db.pvs_identites.find(i=>i.code_public===student).code_secret,null);
});

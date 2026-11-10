import assert from 'node:assert/strict';
import {handleCM2} from './cm2_server.js';
import {VERSION} from './cm2_catalog.js';

export const origin='https://portal.example.invalid';
export const classId='11111111-1111-4111-8111-111111111111';
export const foreignId='22222222-2222-4222-8222-222222222222';
export const assignmentId='33333333-3333-4333-8333-333333333333';
export const runId='44444444-4444-4444-8444-444444444444';

export function fixture(){
  const db={
    pvs_identites:[{code_public:'PUPIL-1',role:'eleve'},{code_public:'PUPIL-2',role:'eleve'},{code_public:'TEACHER-1',role:'prof'},{code_public:'TEACHER-2',role:'prof'},{code_public:'ADMIN-1',role:'admin'}],
    pvs_cm2_classes:[{id:classId,owner:'TEACHER-1',name:'CM2 A',school_year:'2026-2027'},{id:foreignId,owner:'TEACHER-2',name:'CM2 B',school_year:'2026-2027'}],
    pvs_cm2_members:[{class_id:classId,student:'PUPIL-1',approved:true}],
    pvs_cm2_assignments:[{id:assignmentId,class_id:classId,title:'Test',activities:['calcul','ecriture'],students:['PUPIL-1'],level:1,active:true}],
    pvs_cm2_runs:[{id:runId,student:'PUPIL-1',activity:'calcul',level:2,seed:17,catalog_version:VERSION,completed:false,class_id:classId,assignment_id:assignmentId}],
    pvs_cm2_answers:[],pvs_cm2_reviews:[]
  };
  const sessions={pupil:{code_public:'PUPIL-1',portee:'legere'},other:{code_public:'PUPIL-2',portee:'legere'},teacher:{code_public:'TEACHER-1',portee:'legere'},foreign:{code_public:'TEACHER-2',portee:'legere'},admin:{code_public:'ADMIN-1',portee:'legere'},full:{code_public:'ADMIN-1',portee:'complete'}};
  const calls=[];
  const helpers={
    originAllowed:r=>r.headers.get('Origin')===origin,
    corsHeaders:(o,allowed)=>allowed?{'Access-Control-Allow-Origin':o}:{},
    sessionValide:async(_env,token)=>sessions[token]||null,
    async sb(_env,method,path,body,prefer){
      calls.push({method,path,body:structuredClone(body)});
      if(method==='DELETE'&&path.startsWith('pvs_sessions?')){
        const params=new URL(path,'https://mock.invalid/').searchParams,token=params.get('token').slice(3);
        assert.equal(sessions[token]?.code_public,params.get('code_public').slice(3));delete sessions[token];return null;
      }
      if(path==='rpc/pvs_cm2_teacher_codes'){
        assert.equal(body.p_admin,'ADMIN-1');
        return body.p_hashes.map((_hash,slot)=>{const code='RANCE-PRIM-'+String(slot+1).padStart(4,'0');db.pvs_identites.push({code_public:code,role:'prof',code_secret:null});return {code_public:code,slot};});
      }
      if(path==='rpc/pvs_cm2_reset_student'){
        const i=db.pvs_identites.find(i=>i.code_public===body.p_student);i.code_secret=null;
        const m=db.pvs_cm2_members.find(m=>m.class_id===body.p_class&&m.student===body.p_student);m.approved=false;
        for(const [token,s] of Object.entries(sessions))if(s.code_public===body.p_student)delete sessions[token];
        return true;
      }
      if(path==='rpc/pvs_cm2_initial_codes'){
        assert.equal(method,'POST');
        assert.ok(db.pvs_cm2_classes.some(c=>c.id===body.p_class&&c.owner===body.p_owner));
        for(let i=0;i<body.p_count;i++){
          const code='CM2-'+crypto.randomUUID().replace(/-/g,'').slice(0,16).toUpperCase();
          db.pvs_identites.push({code_public:code,role:'eleve',code_secret:null});
          db.pvs_cm2_members.push({class_id:body.p_class,student:code,approved:false,issued_here:true});
        }
        return db.pvs_cm2_members.filter(m=>m.class_id===body.p_class&&m.student.startsWith('CM2-')).map(m=>({code_public:m.student,activated:!!db.pvs_identites.find(i=>i.code_public===m.student)?.code_secret}));
      }
      const u=new URL(path,'https://mock.invalid/'),table=u.pathname.slice(1),params=u.searchParams;
      assert.ok(db[table],`Unknown test table: ${table}`);
      let selected=db[table].filter(row=>[...params].every(([k,v])=>{
        if(['order','limit','select','on_conflict'].includes(k))return true;
        if(v.startsWith('eq.'))return String(row[k])===v.slice(3);
        if(v.startsWith('gte.'))return String(row[k])>=v.slice(4);
        throw new Error('Unknown test filter');
      }));
      if(method==='GET'){
        const order=params.get('order');
        if(order){const [key,dir]=order.split('.');selected.sort((a,b)=>String(a[key]||'').localeCompare(String(b[key]||''))*(dir==='desc'?-1:1));}
        let rows=selected.slice(0,Number(params.get('limit')||10000));
        if(table==='pvs_cm2_runs'&&params.get('select')?.includes('pvs_cm2_answers'))rows=rows.map(r=>({...r,pvs_cm2_answers:db.pvs_cm2_answers.filter(a=>a.run_id===r.id).map(a=>({correct:a.correct,assisted:a.assisted})),pvs_cm2_reviews:db.pvs_cm2_reviews.find(x=>x.run_id===r.id)||null}));
        return structuredClone(rows);
      }
      if(method==='PATCH'){selected.forEach(r=>Object.assign(r,structuredClone(body)));return structuredClone(selected);}
      assert.equal(method,'POST');
      const row={created_at:new Date().toISOString(),...structuredClone(body)};
      if(table==='pvs_cm2_answers'&&db[table].some(r=>r.run_id===row.run_id&&r.question_index===row.question_index))throw new Error('409 duplicate');
      if(prefer?.includes('merge-duplicates')){
        const old=db[table].find(r=>r.run_id===row.run_id);
        if(old){Object.assign(old,row);return [structuredClone(old)];}
      }
      db[table].push(row);return [structuredClone(row)];
    }
  };
  async function call(action,token='pupil',body={},options={}){
    const req=new Request(origin+'/api/cm2',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...options.headers},body:options.raw||JSON.stringify({action,token,...body})});
    const response=await handleCM2(req,{SUPABASE_SERVICE:'fixture-only',...options.env},helpers);
    return {status:response.status,body:await response.json()};
  }
  return {db,calls,helpers,call,sessions};
}

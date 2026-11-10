import {activity,question,grade,VERSION} from './cm2_catalog.js';

const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const enc=encodeURIComponent;
class HttpError extends Error{constructor(status,message){super(message);this.status=status;}}
const reject=(status,message)=>{throw new HttpError(status,message);};
function uuid(value){if(!UUID.test(String(value)))reject(400,'Référence invalide.');return String(value);}
function text(value,max=64){return String(value??'').trim().slice(0,max);}
export async function digest(value){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
export async function handleCM2(request,env,helpers){
  const {sb,sessionValide,originAllowed,corsHeaders}=helpers;
  const allowed=originAllowed(request,env),cors=corsHeaders(request.headers.get('Origin')||'',allowed);
  const response=(body,status=200)=>Response.json(body,{status,headers:{...cors,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(request.method!=='POST')return response({error:'Méthode non autorisée.'},405);
  if(!allowed)return response({error:'Origine non autorisée.'},403);
  if(!env.SUPABASE_SERVICE)return response({error:'La base des classes n’est pas configurée.'},503);
  try{
    const raw=await request.text();
    if(new TextEncoder().encode(raw).length>16000)reject(413,'Demande trop volumineuse.');
    let b;try{b=JSON.parse(raw);}catch{reject(400,'Demande illisible.');}
    if(!b||typeof b!=='object'||Array.isArray(b))reject(400,'Demande invalide.');
    const me=await sessionValide(env,b.token);
    if(!me)reject(401,'Reconnecte-toi pour accéder à tes données.');
    // Recheck the current role instead of trusting a role cached in a session.
    const [identity]=await sb(env,'GET',`pvs_identites?code_public=eq.${enc(me.code_public)}&select=role`);
    if(!identity)reject(401,'Ce compte n’est plus actif. Reconnecte-toi.');
    const role=identity.role;
    if(!['eleve','prof','admin'].includes(role))reject(403,'Compte non autorisé.');
    if(b.action==='logout'){
      await sb(env,'DELETE',`pvs_sessions?token=eq.${enc(b.token)}&code_public=eq.${enc(me.code_public)}`);
      return response({ok:true});
    }
    if(role==='admin'&&me.portee!=='complete')reject(403,'Ouvrez la console administrateur avec votre mot de passe avant de gérer les classes.');
    const teacher=role==='prof'||role==='admin';
    const list=async(table,query='')=>(await sb(env,'GET',table+'?'+query))||[];
    const insert=async(table,row)=>sb(env,'POST',table,row);
    const patch=async(table,filter,row)=>sb(env,'PATCH',table+'?'+filter,row);
    async function owned(id){
      if(!teacher)reject(403,'Action réservée au professeur.');
      const [c]=await list('pvs_cm2_classes',`id=eq.${uuid(id)}&owner=eq.${enc(me.code_public)}&select=id,owner,name,school_year`);
      if(!c)reject(404,'Classe inaccessible.');return c;
    }
    async function member(id){
      const [m]=await list('pvs_cm2_members',`class_id=eq.${uuid(id)}&student=eq.${enc(me.code_public)}&approved=eq.true`);
      if(!m)reject(403,'Le professeur doit confirmer ton rattachement à cette classe.');return m;
    }
    async function ownRun(id){
      const [r]=await list('pvs_cm2_runs',`id=eq.${uuid(id)}&student=eq.${enc(me.code_public)}`);
      if(!r)reject(404,'Séance inaccessible.');return r;
    }
    async function runData(r){
      const answers=await list('pvs_cm2_answers',`run_id=eq.${r.id}&order=question_index.asc`);
      const [review]=await list('pvs_cm2_reviews',`run_id=eq.${r.id}`);
      return {...r,answers,review:review||null};
    }
    if(env.RL){
      const key='cm2:'+await digest(String(b.token))+':'+Math.floor(Date.now()/60000);
      const count=Number(await env.RL.get(key)||0);
      if(count>=90)reject(429,'Trop de demandes rapprochées. Réessaie dans une minute.');
      await env.RL.put(key,String(count+1),{expirationTtl:120});
    }
    if(b.action==='state'){
      if(teacher){
        const classes=await list('pvs_cm2_classes',`owner=eq.${enc(me.code_public)}&select=id,name,school_year,created_at&order=created_at.desc&limit=30`);
        return response({ok:true,role,public:me.code_public,classes});
      }
      const memberships=await list('pvs_cm2_members',`student=eq.${enc(me.code_public)}&limit=10`);
      const classes=[],assignments=[];
      for(const m of memberships){
        const [c]=await list('pvs_cm2_classes',`id=eq.${m.class_id}&select=id,name,school_year`);
        if(c)classes.push({...c,approved:m.approved});
        if(m.approved){
          const rows=await list('pvs_cm2_assignments',`class_id=eq.${m.class_id}&active=eq.true&order=created_at.desc&limit=50`);
          assignments.push(...rows.filter(a=>a.students.includes(me.code_public)).map(({students,...a})=>a));
        }
      }
      const runs=await list('pvs_cm2_runs',`student=eq.${enc(me.code_public)}&order=created_at.desc&limit=50`);
      return response({ok:true,role,public:me.code_public,classes,assignments,runs});
    }
    if(b.action==='teacher_codes'){
      if(role!=='admin'||me.portee!=='complete')reject(403,'Invitation réservée au responsable du portail.');
      const count=Number(b.count);
      if(!Number.isInteger(count)||count<1||count>10)reject(400,'Choisissez entre 1 et 10 invitations.');
      const invitations=Array.from({length:count},()=>[...crypto.getRandomValues(new Uint8Array(24))].map(x=>x.toString(16).padStart(2,'0')).join(''));
      const hashes=[];for(const code of invitations)hashes.push(await digest(code));
      const rows=await sb(env,'POST','rpc/pvs_cm2_teacher_codes',{p_admin:me.code_public,p_hashes:hashes});
      return response({ok:true,invitations:rows.map(r=>({public:r.code_public,invitation:invitations[r.slot]}))});
    }
    if(b.action==='create_class'){
      if(!teacher)reject(403,'Action réservée au professeur.');
      const name=text(b.name),year=String(b.school_year||'');
      if(!name||!/^20\d{2}-20\d{2}$/.test(year)||Number(year.slice(5))!==Number(year.slice(0,4))+1)reject(400,'Nom de classe ou année scolaire invalide.');
      const count=await list('pvs_cm2_classes',`owner=eq.${enc(me.code_public)}&select=id&limit=30`);
      if(count.length>=30)reject(409,'Limite de classes atteinte.');
      const bytes=crypto.getRandomValues(new Uint8Array(12));
      const join_code=[...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');
      const id=crypto.randomUUID();
      await insert('pvs_cm2_classes',{id,owner:me.code_public,name,school_year:year,join_hash:await digest(join_code)});
      return response({ok:true,id,join_code});
    }
    if(b.action==='renew_invite'){
      const c=await owned(b.class_id);
      const join_code=[...crypto.getRandomValues(new Uint8Array(12))].map(x=>x.toString(16).padStart(2,'0')).join('');
      await patch('pvs_cm2_classes',`id=eq.${c.id}&owner=eq.${enc(me.code_public)}`,{join_hash:await digest(join_code)});
      return response({ok:true,join_code});
    }
    if(b.action==='join'){
      if(teacher)reject(403,'Seuls les comptes élèves rejoignent une classe.');
      const code=String(b.code||'').trim().toLowerCase().replace(/\s/g,'');
      if(!/^[a-f0-9]{24}$/.test(code))reject(400,'Code de classe invalide.');
      const [c]=await list('pvs_cm2_classes',`join_hash=eq.${await digest(code)}&select=id`);
      if(!c)reject(404,'Code de classe inconnu.');
      const mine=await list('pvs_cm2_members',`student=eq.${enc(me.code_public)}&select=class_id&limit=10`);
      if(mine.some(m=>m.class_id===c.id))return response({ok:true});
      if(mine.length>=10)reject(409,'Trop de classes rattachées à ce compte.');
      const members=await list('pvs_cm2_members',`class_id=eq.${c.id}&select=student&limit=100`);
      if(members.length>=100)reject(409,'Classe complète.');
      try{await insert('pvs_cm2_members',{class_id:c.id,student:me.code_public,approved:false});}
      catch(e){if(!String(e).includes('409'))throw e;}
      return response({ok:true});
    }
    if(b.action==='class'){
      const c=await owned(b.class_id);
      const members=await list('pvs_cm2_members',`class_id=eq.${c.id}&order=student.asc&limit=100`);
      const assignments=await list('pvs_cm2_assignments',`class_id=eq.${c.id}&order=created_at.desc&limit=100`);
      // Bounded class history, not a global pupil directory.
      const rows=await list('pvs_cm2_runs',`class_id=eq.${c.id}&select=*,pvs_cm2_answers(correct,assisted),pvs_cm2_reviews(status)&order=created_at.desc&limit=500`);
      const runs=rows.map(({pvs_cm2_answers:answers=[],pvs_cm2_reviews:reviews,...r})=>({
        ...r,answered:answers.length,graded:answers.filter(a=>a.correct!==null).length,correct:answers.filter(a=>a.correct===true).length,
        assisted:answers.filter(a=>a.assisted).length,
        review_status:(Array.isArray(reviews)?reviews[0]:reviews)?.status||null
      }));
      const initial_codes=await sb(env,'POST','rpc/pvs_cm2_initial_codes',{p_owner:me.code_public,p_class:c.id,p_count:0});
      return response({ok:true,classe:c,members,assignments,runs,initial_codes,history_limited:runs.length===500});
    }
    if(b.action==='initial_codes'){
      const c=await owned(b.class_id),count=Number(b.count);
      if(!Number.isInteger(count)||count<1||count>35)reject(400,'Choisissez entre 1 et 35 premiers accès.');
      const members=await list('pvs_cm2_members',`class_id=eq.${c.id}&select=student&limit=100`);
      if(members.length+count>100)reject(409,'La classe est limitée à 100 comptes.');
      const codes=await sb(env,'POST','rpc/pvs_cm2_initial_codes',{p_owner:me.code_public,p_class:c.id,p_count:count});
      return response({ok:true,codes});
    }
    if(b.action==='reset_student'){
      const c=await owned(b.class_id),student=text(b.student,80);
      const [m]=await list('pvs_cm2_members',`class_id=eq.${c.id}&student=eq.${enc(student)}&issued_here=eq.true`);
      if(!m||!/^CM2-[A-F0-9]{16}$/.test(student))reject(403,'Seuls les comptes créés par cette classe peuvent être réinitialisés ici. Les comptes du collège sont préservés.');
      await sb(env,'POST','rpc/pvs_cm2_reset_student',{p_owner:me.code_public,p_class:c.id,p_student:student});
      return response({ok:true});
    }
    if(b.action==='approve'){
      const c=await owned(b.class_id);
      const student=text(b.student,80);
      if(!student)reject(400,'Compte élève manquant.');
      const rows=await patch('pvs_cm2_members',`class_id=eq.${c.id}&student=eq.${enc(student)}`,{approved:b.approved===true});
      if(!rows?.length)reject(404,'Demande de rattachement introuvable.');
      return response({ok:true});
    }
    if(b.action==='assign'){
      const c=await owned(b.class_id),title=text(b.title,100);
      const activities=Array.isArray(b.activities)?[...new Set(b.activities)]:[];
      if(!title||!activities.length||activities.length>16||activities.some(id=>!activity(id)))reject(400,'Choisissez un titre et des activités valides.');
      const level=Number(b.level);
      if(![1,2,3].includes(level))reject(400,'Niveau d’aide invalide.');
      const due=b.due||null;
      if(due){
        const parsed=typeof due==='string'?new Date(due):null;
        if(!/^20\d\d-\d\d-\d\d$/.test(String(due))||!parsed||!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==due)reject(400,'Date invalide.');
      }
      const approved=await list('pvs_cm2_members',`class_id=eq.${c.id}&approved=eq.true&select=student`);
      const students=Array.isArray(b.students)?[...new Set(b.students)]:approved.map(m=>m.student);
      if(!students.length||students.some(s=>!approved.some(m=>m.student===s)))reject(400,'Sélectionnez des élèves confirmés de votre classe.');
      const active=await list('pvs_cm2_assignments',`class_id=eq.${c.id}&active=eq.true&select=id&limit=100`);
      if(active.length>=100)reject(409,'Archivez un ancien plan de travail avant d’en créer un autre.');
      const id=crypto.randomUUID();
      await insert('pvs_cm2_assignments',{id,class_id:c.id,title,activities,students,level,due,active:true});
      return response({ok:true,id});
    }
    if(b.action==='archive'){
      const c=await owned(b.class_id);
      await patch('pvs_cm2_assignments',`id=eq.${uuid(b.assignment_id)}&class_id=eq.${c.id}`,{active:false});
      return response({ok:true});
    }
    if(b.action==='start'){
      if(teacher)reject(403,'Utilisez la découverte libre pour prévisualiser un atelier.');
      const a=activity(b.activity);
      if(!a)reject(400,'Atelier inconnu.');
      let assignment=null,level=Number(b.level||2),class_id=null;
      if(b.assignment_id){
        [assignment]=await list('pvs_cm2_assignments',`id=eq.${uuid(b.assignment_id)}&active=eq.true`);
        if(!assignment||!assignment.students.includes(me.code_public)||!assignment.activities.includes(a.id))reject(403,'Cette mission ne t’est pas attribuée.');
        await member(assignment.class_id);level=assignment.level;class_id=assignment.class_id;
      }else if(b.class_id){
        await member(b.class_id);class_id=uuid(b.class_id);
      }
      if(![1,2,3].includes(level))reject(400,'Niveau invalide.');
      const since=new Date(Date.now()-24*3600*1000).toISOString();
      const recent=await list('pvs_cm2_runs',`student=eq.${enc(me.code_public)}&created_at=gte.${since}&select=id&limit=100`);
      if(recent.length>=100)reject(429,'Limite de séances atteinte pour aujourd’hui.');
      const id=crypto.randomUUID(),seed=crypto.getRandomValues(new Uint32Array(1))[0],created_at=new Date().toISOString();
      await insert('pvs_cm2_runs',{id,student:me.code_public,assignment_id:assignment?.id||null,class_id,activity:a.id,level,seed,catalog_version:VERSION,completed:false,created_at});
      return response({ok:true,run:{id,activity:a.id,seed,level,class_id,catalog_version:VERSION,completed:false,created_at,answers:[]}});
    }
    if(b.action==='run'){
      let r;
      if(teacher){
        [r]=await list('pvs_cm2_runs',`id=eq.${uuid(b.run_id)}`);
        if(!r||!r.class_id)reject(404,'Séance inaccessible.');await owned(r.class_id);
      }else r=await ownRun(b.run_id);
      return response({ok:true,run:await runData(r)});
    }
    if(b.action==='answer'){
      const r=await ownRun(b.run_id);
      if(r.assignment_id){
        const [assignment]=await list('pvs_cm2_assignments',`id=eq.${r.assignment_id}&active=eq.true`);
        if(!assignment||!assignment.students.includes(me.code_public))reject(403,'Ce plan de travail n’est plus actif pour toi. Tu peux toujours t’entraîner en accès libre.');
        await member(r.class_id);
      }else if(r.class_id)await member(r.class_id);
      if(r.catalog_version!==VERSION)reject(409,'Cette ancienne séance reste consultable. Commence une nouvelle séance pour répondre.');
      const index=Number(b.index);
      if(!Number.isInteger(index)||index<0||index>5)reject(400,'Question invalide.');
      const answer=String(b.answer??'').trim();
      if(!answer||answer.length>2000)reject(400,'Réponse vide ou trop longue.');
      const q=question(r.activity,index,r.seed,r.level);
      let [saved]=await list('pvs_cm2_answers',`run_id=eq.${r.id}&question_index=eq.${index}`);
      if(!saved){
        const mark=grade(q,answer);
        const row={run_id:r.id,question_index:index,answer,correct:mark.correct,assisted:b.assisted===true};
        try{await insert('pvs_cm2_answers',row);saved=row;}
        catch(e){
          [saved]=await list('pvs_cm2_answers',`run_id=eq.${r.id}&question_index=eq.${index}`);
          if(!saved)throw e;
        }
      }
      const answers=await list('pvs_cm2_answers',`run_id=eq.${r.id}&order=question_index.asc`);
      if(answers.length===6)await patch('pvs_cm2_runs',`id=eq.${r.id}&student=eq.${enc(me.code_public)}`,{completed:true});
      return response({ok:true,saved,answers,expected:q.expected,explanation:q.explanation,completed:answers.length===6});
    }
    if(b.action==='review'){
      const [r]=await list('pvs_cm2_runs',`id=eq.${uuid(b.run_id)}`);
      if(!r?.class_id)reject(404,'Séance inaccessible.');await owned(r.class_id);
      if(!['relu','a_reprendre'].includes(b.status))reject(400,'Avis invalide.');
      const comment=text(b.comment,1000);
      if(!comment)reject(400,'Ajoutez un retour pour l’élève.');
      await sb(env,'POST','pvs_cm2_reviews?on_conflict=run_id',{run_id:r.id,teacher:me.code_public,status:b.status,comment,updated_at:new Date().toISOString()},'resolution=merge-duplicates,return=representation');
      return response({ok:true});
    }
    reject(400,'Action inconnue.');
  }catch(e){
    if(e instanceof HttpError)return response({error:e.message},e.status);
    const missing=/pvs_cm2_|PGRST205|42P01/.test(String(e));
    return response({error:missing?'La base privée CM2 doit être activée avec la migration sql_cm2.sql. Les ateliers libres restent disponibles.':'La sauvegarde centrale est momentanément indisponible. Réessaie sans fermer ta séance.',setup_required:missing},503);
  }
}

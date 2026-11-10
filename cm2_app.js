import {ACTIVITIES,VERSION,activity,question,grade} from './cm2_catalog.js';

const $=id=>document.getElementById(id);
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=name=>`<i data-lucide="${name}" aria-hidden="true"></i>`;
const button=(action,label,extra='',cls='')=>`<button class="${cls}" data-action="${action}" ${extra}>${label}</button>`;
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')||fallback;}catch{return fallback;}};
let session;try{session=JSON.parse(sessionStorage.getItem('liam_cm2_session')||'null');}catch{}
if(session&&new Date(session.expire_at).getTime()<Date.now())session=null;
if(!session){
  const token=localStorage.getItem('pvs_role')==='admin'?sessionStorage.getItem('pvs_admin_token'):sessionStorage.getItem('pvs_tok');
  if(token)session={token,public:'Connexion en cours',role:'eleve',expire_at:new Date(Date.now()+3600*1000).toISOString()};
}
let view=new URLSearchParams(location.search).get('espace')==='prof'?'teacher':'home',data=null,classe=null,run=null,selected=null,assisted=false,feedback=null,subject='',search='',level=2,busy=false;
let teacherFilter={student:'',activity:''};
const date=s=>s?new Date(s.includes('T')?s:s+'T12:00:00').toLocaleDateString('fr-FR'):'—';
const owner=()=>session?.public||'decouverte';
const cacheKey=()=>`liam_cm2_carnet_v1:${owner()}`;
const isTeacher=()=>session&&['prof','admin'].includes(session.role);
function storeRun(){
  if(!run)return;
  const all=read(cacheKey(),{});all[run.id]={...run,updated_at:new Date().toISOString()};
  const trimmed=Object.fromEntries(Object.entries(all).sort((a,b)=>(b[1].updated_at||'').localeCompare(a[1].updated_at||'')).slice(0,60));
  try{localStorage.setItem(cacheKey(),JSON.stringify(trimmed));}
  catch{message(run.local?'Le stockage de cet appareil est plein : cette séance ne pourra pas être retrouvée après fermeture.':'La copie de secours locale n’a pas pu être conservée. Vérifie la synchronisation avant de fermer.',true);}
}
function icons(){window.lucide?.createIcons();}
function message(text,error=false){$('status').textContent=text;$('status').className='notice'+(error?' error':'');$('status').hidden=!text;}
function nav(){
  $('account').innerHTML=session?`<span>${E(session.public)}</span>${button('logout',icon('log-out'),'title="Se déconnecter" aria-label="Se déconnecter"','icon')}`:button('login',icon('user-round')+'Connexion');
  $('teacherTab').hidden=!!session&&!isTeacher();
  document.querySelectorAll('.main-nav button').forEach(b=>{if(b.dataset.action===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  icons();
}
async function api(action,payload={}){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  let response;
  try{response=await fetch('/api/cm2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,token:session?.token,...payload}),signal:controller.signal});}
  catch(e){throw new Error(e.name==='AbortError'?'Le serveur ne répond pas pour le moment. Ta séance reste ouverte.':'Connexion indisponible. Vérifie ton accès à Internet.');}
  finally{clearTimeout(timer);}
  let result;try{result=await response.json();}catch{result={error:'L’espace partagé n’est pas encore disponible sur ce serveur.'};}
  if(!response.ok){const error=new Error(result.error||'Erreur de connexion.');error.status=response.status;throw error;}return result;
}
async function refresh(){
  if(!session)return;
  try{data=await api('state');session.role=data.role;session.public=data.public;sessionStorage.setItem('liam_cm2_session',JSON.stringify(session));message('');}
  catch(e){data=null;if(e.status===401){session=null;sessionStorage.removeItem('liam_cm2_session');}message(e.message,true);}
  nav();
}
function go(next){view=next;run=null;selected=null;feedback=null;render();window.scrollTo({top:0,behavior:'smooth'});}
function filterActivities(){return ACTIVITIES.filter(a=>(!subject||a.subject===subject)&&(!search||`${a.title} ${a.skill} ${a.chapter}`.toLocaleLowerCase('fr').includes(search.toLocaleLowerCase('fr'))));}
function illustration(id){return ['sciences','geographie','anglais','citoyennete','lecture'].includes(id)?'cm2_ruisseau_liam.webp':'cm2_atelier_liam.webp';}
function practiceTarget(){
  const classes=(data?.classes||[]).filter(c=>c.approved),choice=localStorage.getItem('liam_cm2_practice_class:'+owner());
  if(choice==='personal')return null;
  if(classes.some(c=>c.id===choice))return choice;
  const now=new Date(),y=now.getMonth()>=8?now.getFullYear():now.getFullYear()-1;
  return classes.find(c=>c.school_year===`${y}-${y+1}`)?.id||null;
}
function cards(){
  const rows=filterActivities();
  return rows.length?`<div class="activity-grid">${rows.map(a=>`<article class="activity" data-subject="${E(a.subject)}"><img class="activity-art" src="${illustration(a.id)}" alt="" width="480" height="180" loading="lazy"><span class="eyebrow">${E(a.subject)}</span><h3>${E(a.title)}</h3><p>${E(a.skill)}</p><div class="row"><span class="muted">6 étapes · ${a.minutes} min</span>${button('start',icon('play')+'Explorer',`data-id="${a.id}" aria-label="Explorer : ${E(a.title)}"`,'primary')}</div></article>`).join('')}</div>`:'<p class="empty">Aucun atelier ne correspond à cette recherche.</p>';
}
function renderHome(){
  $('app').innerHTML=`<section class="banner" aria-label="Liam, Maëlle et Rémus à l’atelier"><img class="banner-art" src="cm2_atelier_liam.webp" alt=""><div class="banner-text"><span class="eyebrow">Les chemins d’Eystie-Val</span><h1>Les ateliers de Liam</h1><p>Une question, un essai, une découverte.</p><span class="tag">CM2 · ${session?'Carnet personnel':'Découverte libre'}</span></div></section><div class="section-head"><h2>Choisir mon prochain atelier</h2><span>${ACTIVITIES.length} ateliers</span></div><div class="toolbar"><label>Matière<select id="subject"><option value="">Toutes les matières</option>${[...new Set(ACTIVITIES.map(a=>a.subject))].map(s=>`<option ${subject===s?'selected':''}>${E(s)}</option>`).join('')}</select></label><label>Rechercher<input id="search" value="${E(search)}" type="search" placeholder="Une compétence, un atelier…"></label><label>Niveau d’entraînement<select id="level"><option value="1" ${level===1?'selected':''}>Accompagné</option><option value="2" ${level===2?'selected':''}>Standard</option><option value="3" ${level===3?'selected':''}>Approfondissement</option></select></label></div><div id="activities">${cards()}</div>`;
  $('subject').onchange=e=>{subject=e.target.value;$('activities').innerHTML=cards();icons();};
  $('search').oninput=e=>{search=e.target.value;$('activities').innerHTML=cards();icons();};
  $('level').onchange=e=>{level=Number(e.target.value);};
  if(session&&!isTeacher()&&(data?.classes||[]).some(c=>c.approved)){
    const label=document.createElement('label');label.textContent='Carnet de travail';
    const select=document.createElement('select');select.id='practiceClass';
    select.add(new Option('Personnel · non partagé avec une classe','personal'));
    for(const c of data.classes.filter(c=>c.approved))select.add(new Option(`${c.name} · ${c.school_year}`,c.id));
    select.value=practiceTarget()||'personal';select.onchange=()=>localStorage.setItem('liam_cm2_practice_class:'+owner(),select.value);
    label.append(select);document.querySelector('.toolbar').append(label);
  }
}
function renderNotebook(){
  const local=Object.values(read(cacheKey(),{})),remote=data?.runs||[];
  const rows=[...remote.map(r=>({...r,pending:local.find(l=>l.id===r.id)?.pending})),...local.filter(l=>!remote.some(r=>r.id===l.id))].sort((a,b)=>(b.created_at||'').localeCompare(a.created_at||''));
  $('app').innerHTML=`<div class="section-head"><h1>Mon carnet de route</h1>${button('refresh',icon('refresh-cw'),'title="Actualiser" aria-label="Actualiser"','icon')}</div>${!session?'<p class="muted">Découverte sur cet appareil. Connecte-toi pour retrouver ton carnet personnel.</p>':''}<div class="table-wrap"><table><thead><tr><th>Atelier</th><th>Date</th><th>Parcours</th><th>Enregistrement</th><th></th></tr></thead><tbody>${rows.map(r=>`<tr><td>${E(activity(r.activity)?.title||r.activity)}</td><td>${date(r.created_at)}</td><td>${r.completed?'Terminé':'En cours'}</td><td>${r.local?'Cet appareil':r.pending?.length?'À synchroniser':'Central'}</td><td>${button('resume',r.completed?'Consulter':'Reprendre',`data-id="${E(r.id)}"`)}</td></tr>`).join('')}</tbody></table></div>${!rows.length?'<p class="empty">Le carnet attend ta première découverte.</p>':''}`;
}
function renderStudentClass(){
  if(!session){$('app').innerHTML=`<h1>Ma classe</h1><p>Connecte-toi avec ton identifiant personnel pour retrouver les missions de ton professeur.</p>${button('login',icon('log-in')+'Me connecter','','primary')}`;return;}
  if(isTeacher()){go('teacher');return;}
  $('app').innerHTML=`<h1>Ma classe et mes missions</h1><form id="joinForm" class="inline-form"><label>Code de classe fourni par mon professeur<input name="code" required maxlength="30" autocomplete="off"></label><button type="submit" class="primary">Rejoindre</button></form><p class="muted">${(data?.classes||[]).map(c=>`${E(c.name)} · ${E(c.school_year)}${c.approved?'':' · confirmation du professeur attendue'}`).join('<br>')||'Aucune classe rattachée.'}</p><section class="subsection"><h2>Mon plan de travail</h2>${(data?.assignments||[]).map(a=>`<article class="plan"><h3>${E(a.title)}</h3><span class="muted">${a.due?'Pour le '+date(a.due):'Sans date butoir'} · ${['','Accompagné','Standard','Approfondissement'][a.level]}</span><div class="row">${a.activities.map(id=>{const completed=(data.runs||[]).some(r=>r.assignment_id===a.id&&r.activity===id&&r.completed);return button('assigned',(completed?'✓ ':'')+E(activity(id)?.title||id),`data-id="${id}" data-assignment="${a.id}"`,completed?'':'primary');}).join('')}</div></article>`).join('')||'<p class="empty">Aucune mission attribuée. Les ateliers libres restent ouverts.</p>'}</section>`;
  $('joinForm').onsubmit=e=>submit(e,async f=>{await api('join',{code:f.get('code')});await refresh();render();message('Demande transmise : ton professeur confirmera le rattachement.');});
}
function filteredRuns(){
  return (classe?.runs||[]).filter(r=>(!teacherFilter.student||r.student===teacherFilter.student)&&(!teacherFilter.activity||r.activity===teacherFilter.activity));
}
function renderTeacher(){
  if(!isTeacher()){
    $('app').innerHTML='<h1>Espace professeur</h1><p>Connectez-vous avec un compte professeur activé par le responsable du portail.</p>'+button('login',icon('log-in')+'Connexion');
    return;
  }
  if(!classe){
    const now=new Date(),y=now.getMonth()>=8?now.getFullYear():now.getFullYear()-1;
    $('app').innerHTML=`
      <div class='section-head'><h1>Mes classes</h1>${session.role==='admin'?`<a href='admin.html'>Console du responsable</a>`:''}</div>
      <form id='createForm' class='inline-form'>
        <label>Nom de la classe<input name='name' required maxlength='64' placeholder='CM2 – école…'></label>
        <label>Année scolaire<input name='school_year' value='${y}-${y+1}' pattern='20[0-9]{2}-20[0-9]{2}' required></label>
        <button type='submit' class='primary'>${icon('plus')}Créer une classe</button>
      </form>
      ${session.role==='admin'?`<section class='subsection'><h2>Comptes des professeurs des écoles</h2><form id='teachersForm' class='inline-form'><label>Invitations RANCE-PRIM<input type='number' name='count' min='1' max='10' value='1' required></label><button class='primary' type='submit'>${icon('user-plus')}Préparer les invitations</button></form><div id='teacherInvitations'></div></section>`:''}
      <section class='subsection'>${(data?.classes||[]).map(c=>`<article class='plan'><div class='row'><h3>${E(c.name)}</h3><span>${E(c.school_year)}</span>${button('open_class','Ouvrir',`data-id='${c.id}'`,'secondary')}</div></article>`).join('')||`<p class='empty'>Aucune classe créée.</p>`}</section>`;
    if($('teachersForm'))$('teachersForm').onsubmit=e=>submit(e,async f=>{
      const r=await api('teacher_codes',{count:Number(f.get('count'))});
      $('teacherInvitations').innerHTML=r.invitations.map(i=>{const u=new URL('rejoindre.html',location.href);u.searchParams.set('retour','cm2');u.searchParams.set('public',i.public);u.searchParams.set('invitation',i.invitation);return `<div class='plan'><h3>${E(i.public)}</h3><a href='${E(u.href)}' target='_blank' rel='noopener'>Invitation personnelle · valable 7 jours</a> ${button('copy_link',icon('copy'),`data-url='${E(u.href)}' title='Copier cette invitation' aria-label='Copier cette invitation'`,'icon')}</div>`;}).join('');icons();
    });
    $('createForm').onsubmit=e=>submit(e,async f=>{
      const c=await api('create_class',{name:f.get('name'),school_year:f.get('school_year')});
      await refresh();render();
      const p=document.createElement('p');p.className='code';p.textContent='Code de classe à conserver et transmettre aux élèves : '+c.join_code;$('app').append(p);
    });
    return;
  }
  const c=classe.classe,approved=classe.members.filter(m=>m.approved),runs=filteredRuns();
  const done=classe.runs.filter(r=>r.completed).length;
  const students=[...new Set([...classe.members.map(m=>m.student),...classe.runs.map(r=>r.student)])].sort();
  $('app').innerHTML=`
    ${button('classes',icon('arrow-left')+'Mes classes')}
    <div class='section-head'><div><span class='eyebrow'>${E(c.school_year)}</span><h1>${E(c.name)}</h1></div>
      <div class='row'>${button('invite',icon('key-round')+'Nouveau code de classe')}${button('export',icon('download')+'Exporter le suivi')}${button('refresh',icon('refresh-cw'),`title='Actualiser la classe' aria-label='Actualiser la classe'`,'icon')}</div>
    </div>
    <div class='summary'><div><strong>${approved.length}</strong>élèves confirmés</div><div><strong>${classe.assignments.filter(a=>a.active).length}</strong>plans actifs</div><div><strong>${done}</strong>séances terminées</div></div>
    <section class='subsection'><div class='section-head'><h2>Premiers accès des élèves</h2>${button('print_initial',icon('printer'),'title="Imprimer les accès non activés" aria-label="Imprimer les accès non activés"','icon')}</div>
      <form id='initialCodesForm' class='inline-form'><label>Nouveaux accès<input name='count' type='number' min='1' max='35' value='1' required></label><button class='primary' type='submit'>${icon('user-plus')}Préparer les accès</button></form>
      <div class='table-wrap'><table><thead><tr><th>Code de première connexion</th><th>État</th><th></th></tr></thead><tbody>${(classe.initial_codes||[]).map(i=>`<tr><td>${E(i.code_public)}</td><td>${i.activated?'Activé':'À distribuer'}</td><td>${i.activated?button('reset_student',icon('key-round')+'Réinitialiser',`data-student='${E(i.code_public)}'`):''}</td></tr>`).join('')}</tbody></table></div>
    </section>
    <section class='subsection'><h2>Rattachements des élèves</h2>
      <div class='table-wrap'><table><thead><tr><th>Identifiant public</th><th>Accès à la classe</th><th></th></tr></thead><tbody>
        ${classe.members.map(m=>`<tr><td>${E(m.student)}</td><td>${m.approved?'Confirmé':'À confirmer'}</td><td>${button(m.approved?'unapprove':'approve',m.approved?'Suspendre':'Confirmer',`data-student='${E(m.student)}'`)}</td></tr>`).join('')}
      </tbody></table></div>${!classe.members.length?`<p class='empty'>Aucune demande de rattachement.</p>`:''}
    </section>
    <section class='subsection'><h2>Nouveau plan de travail</h2><form id='assignForm'>
      <div class='form-grid'><label>Intitulé<input name='title' required maxlength='100' placeholder='Les provisions du voyage'></label>
      <label>Date de retour souhaitée<input name='due' type='date'></label>
      <label>Parcours<select name='level'><option value='1'>Accompagné</option><option value='2' selected>Standard</option><option value='3'>Approfondissement</option></select></label></div>
      <h3>Activités</h3><div class='check-list'>${ACTIVITIES.map(a=>`<label><input type='checkbox' name='activities' value='${a.id}'>${E(a.title)}</label>`).join('')}</div>
      <h3>Élèves concernés</h3><div class='check-list'>${approved.map(m=>`<label><input type='checkbox' name='students' value='${E(m.student)}' checked>${E(m.student)}</label>`).join('')}</div>
      <button type='submit' class='primary' ${!approved.length?'disabled':''}>${icon('send')}Attribuer le plan</button>
    </form></section>
    <section class='subsection'><h2>Plans de travail</h2>
      ${classe.assignments.map(a=>`<article class='plan'><div class='row'><h3>${E(a.title)}</h3><span class='tag'>${a.active?'Actif':'Archivé'}</span>${a.active?button('archive',icon('archive')+'Archiver',`data-id='${a.id}'`):''}</div><p class='muted'>${a.students.length} élèves · ${a.activities.length} ateliers · ${a.due?date(a.due):'sans échéance'}</p></article>`).join('')||`<p class='empty'>Aucun plan de travail.</p>`}
    </section>
    <section class='subsection'><h2>Suivi par élève et par atelier</h2>
      <div class='toolbar'>
        <label>Élève<select id='studentFilter'><option value=''>Tous les élèves</option>${students.map(s=>`<option value='${E(s)}' ${teacherFilter.student===s?'selected':''}>${E(s)}</option>`).join('')}</select></label>
        <label>Atelier<select id='activityFilter'><option value=''>Tous les ateliers</option>${ACTIVITIES.map(a=>`<option value='${a.id}' ${teacherFilter.activity===a.id?'selected':''}>${E(a.title)}</option>`).join('')}</select></label>
      </div>
      ${classe.history_limited?`<p class='notice'>Le bilan porte sur les 500 séances les plus récentes.</p>`:''}
      <div class='table-wrap'><table><thead><tr><th>Élève</th><th>Séances terminées</th><th>Réponses correctes</th><th>Aides déclarées</th></tr></thead><tbody>
        ${students.filter(s=>!teacherFilter.student||s===teacherFilter.student).map(s=>{
          const own=runs.filter(r=>r.student===s),graded=own.reduce((n,r)=>n+(r.graded||0),0);
          return `<tr><td>${E(s)}</td><td>${own.filter(r=>r.completed).length} / ${own.length}</td><td>${graded?own.reduce((n,r)=>n+(r.correct||0),0)+' / '+graded:'—'}</td><td>${own.reduce((n,r)=>n+(r.assisted||0),0)}</td></tr>`;
        }).join('')}
      </tbody></table></div>
      <h3 class='section-head'>Réalisations et retours</h3>
      <div class='table-wrap'><table><thead><tr><th>Élève</th><th>Atelier</th><th>Date</th><th>Parcours</th><th>Premières réponses</th><th>Retour</th><th></th></tr></thead><tbody>
        ${runs.map(r=>`<tr><td>${E(r.student)}</td><td>${E(activity(r.activity)?.title||r.activity)}</td><td>${date(r.created_at)}</td><td>${r.completed?'Terminé':'En cours'}</td><td>${r.graded?r.correct+' / '+r.graded:r.answered?'Relecture humaine':'—'}${r.assisted?'<br>'+r.assisted+' aide(s)':''}</td><td>${r.review_status==='relu'?'Relu':r.review_status==='a_reprendre'?'À reprendre':'—'}</td><td>${button('teacher_run','Réponses et retour',`data-id='${r.id}'`)}</td></tr>`).join('')}
      </tbody></table></div>${!runs.length?`<p class='empty'>Aucune séance pour cette sélection.</p>`:''}
    </section>`;
  $('studentFilter').onchange=e=>{teacherFilter.student=e.target.value;render();};
  $('activityFilter').onchange=e=>{teacherFilter.activity=e.target.value;render();};
  $('initialCodesForm').onsubmit=e=>submit(e,async f=>{await api('initial_codes',{class_id:c.id,count:Number(f.get('count'))});await loadClass(c.id);message('Premiers accès préparés. Les identifiants déjà utilisés ne sont pas modifiés.');});
  $('assignForm').onsubmit=e=>submit(e,async f=>{
    await api('assign',{class_id:c.id,title:f.get('title'),due:f.get('due'),level:Number(f.get('level')),activities:f.getAll('activities'),students:f.getAll('students')});
    await loadClass(c.id);message('Plan de travail attribué.');
  });
}
function currentIndex(){return [0,1,2,3,4,5].find(i=>!run.answers.some(a=>a.question_index===i))??6;}
function currentQuestion(){return question(run.activity,currentIndex(),run.seed,run.level);}
function renderRun(){
  if(run.catalog_version!==VERSION){renderArchivedRun();return;}
  const a=activity(run.activity),index=currentIndex();
  if(index===6){renderSummary();return;}
  const q=currentQuestion(),count=run.answers.length;
  if(run.draft?.index===index){selected=run.draft.answer;assisted=run.draft.assisted;}
  $('app').innerHTML=`<div class="row">${button('home',icon('arrow-left')+'Les ateliers')}${button('print',icon('printer'),'title="Imprimer une fiche" aria-label="Imprimer une fiche"','icon')}<span class="tag">${run.local?'Sur cet appareil':'Carnet central'}</span></div><section class="scene"><img src="${illustration(run.activity)}" alt="Liam, Maëlle et Rémus préparent leurs recherches ensemble"><div><span class="eyebrow">${E(a.chapter)}</span><h1>${E(a.title)}</h1><p>${E(a.intro)}</p></div></section><div class="progress-line"><span>Étape ${index+1} sur 6</span><progress value="${count}" max="6" aria-label="Progression de la séance"></progress><span>${['','Accompagné','Standard','Approfondissement'][run.level]}</span></div><section class="exercise"><span class="eyebrow">${E(a.skill)}</span>${q.passage?`<blockquote class="passage">${E(q.passage)}</blockquote>`:''}${q.spoken?`<div class="row">${button('listen',icon('volume-2')+'Écouter','','secondary')}${button('transcript','Transcription')}</div><p id="transcript" class="passage" hidden>${E(q.spoken)}</p>`:''}<h2>${E(q.prompt)}</h2>${q.table?table(q.table):''}${q.visual?visual(q.visual):''}${q.kind==='choice'?`<div class="choices" role="group" aria-label="Choisir une réponse">${q.options.map((o,i)=>button('choose',E(o),`data-value="${i}" aria-pressed="${String(selected)===String(i)}"`,'choice'+(String(selected)===String(i)?' selected':''))).join('')}</div>`:q.kind==='writing'?'<label for="answer">Mon texte</label><textarea id="answer" maxlength="2000" placeholder="Je prépare mes idées, puis je rédige…"></textarea>':'<label for="answer">Ma réponse</label><input id="answer" inputmode="decimal" autocomplete="off" maxlength="40">'}<div id="hint" class="hint" ${assisted?'':'hidden'}>${E(q.hint)}</div><div id="feedback" aria-live="polite"></div><div class="actions">${button('hint',icon('lightbulb')+'Un coup de pouce')}${button('validate','Valider ma réponse','','primary')}</div></section>`;
  if($('answer')){$('answer').value=selected??'';$('answer').oninput=()=>{selected=$('answer').value;saveDraft();};}
}
function saveDraft(){if(!run||feedback)return;run.draft={index:currentIndex(),answer:selected??'',assisted};storeRun();}
function visual(v){
  const units=Math.ceil(v.a/v.d);
  return `${Array.from({length:units},(_,u)=>`<div class="fraction-unit"><span class="muted">Unité ${u+1}</span><div class="fraction-bars" style="--parts:${v.d}">${Array.from({length:v.d},(_,j)=>{const i=u*v.d+j;return button('part','',`data-part="${i}" aria-label="Unité ${u+1}, part ${j+1}" aria-pressed="${i<v.a}"`,'part'+(i<v.a?' filled':''));}).join('')}</div></div>`).join('')}<p class="muted" id="partCount">${v.a} parts colorées ; ${v.d} parts par unité</p><div class="line-tool"><label for="fractionLine">Je repère ${v.a}/${v.d} entre 0 et ${units}<input id="fractionLine" type="range" min="0" max="${v.d*units}" value="0" step="1" data-action="line"></label><div class="line-labels"><span>0</span><output id="lineValue">0/${v.d}</output><span>${units}</span></div></div>`;
}
function table(t){return `<div class="table-wrap"><table><thead><tr>${t.headers.map(h=>`<th>${E(h)}</th>`).join('')}</tr></thead><tbody>${t.rows.map(row=>'<tr>'+row.map(c=>`<td>${E(c)}</td>`).join('')+'</tr>').join('')}</tbody></table></div>`;}
function renderArchivedRun(){
  $('app').innerHTML=`<h1>Ancienne séance</h1><p>Les réponses de cette version restent conservées. La correction actuelle n’est pas appliquée rétroactivement.</p>${run.answers.map(a=>`<article class="answer-review"><h2>Étape ${a.question_index+1}</h2><pre>${E(a.answer)}</pre><p>${a.correct===null?'Relecture humaine':a.correct?'Réponse alors validée':'Réponse alors à reprendre'}</p></article>`).join('')}${button('home','Les ateliers','','primary')}`;
}
function renderSummary(){
  const correct=run.answers.filter(a=>a.correct===true&&!a.assisted).length,help=run.answers.filter(a=>a.assisted).length,review=run.answers.some(a=>a.correct===null);
  $('app').innerHTML=`<section class="scene"><img src="cm2_atelier_liam.webp" alt="L’atelier des voyageurs"><div><span class="eyebrow">Une étape de plus</span><h1>${E(activity(run.activity)?.title||run.activity)}</h1><p>Le parcours est terminé. Tu peux relire, recommencer ou explorer une autre piste.</p></div></section><div class="summary"><div><strong>${run.answers.length}/6</strong>étapes parcourues</div><div><strong>${correct}</strong>réussites sans aide déclarée</div><div><strong>${help}</strong>coups de pouce utilisés</div></div>${review?'<p class="hint">Ton texte est conservé pour une relecture. Il n’a pas reçu de note automatique.</p>':''}${run.review?`<div class="feedback"><h2>Le retour de mon professeur</h2><p>${E(run.review.comment)}</p><span>${run.review.status==='relu'?'Relu':'À reprendre'}</span></div>`:''}${run.pending?.length?'<p class="notice">Certaines réponses attendent une synchronisation.</p>'+button('sync',icon('refresh-cw')+'Synchroniser'):''}<section>${run.answers.map(a=>{const q=question(run.activity,a.question_index,run.seed,run.level);return `<article class="answer-review"><h3>Étape ${a.question_index+1}</h3><p>${E(q.prompt)}</p><pre>${E(q.kind==='choice'?q.options[Number(a.answer)]:a.answer)}</pre><span class="tag ${a.correct===false?'berry':'blue'}">${a.correct===null?'À relire avec un adulte':a.correct?'Réponse correcte':'À retravailler'}${a.assisted?' · avec aide':''}</span><p>${E(q.explanation)}</p></article>`;}).join('')}</section><div class="actions">${button('start','Une nouvelle séance',`data-id="${run.activity}"`,'primary')}${button('home','Choisir un autre atelier')}</div>`;
}
function renderTeacherRun(){
  if(run.catalog_version!==VERSION){renderArchivedRun();return;}
  const a=activity(run.activity);
  $('app').innerHTML=`${button('back_class',icon('arrow-left')+'La classe')}<h1>${E(a?.title||run.activity)}</h1><p>${E(run.student)} · ${date(run.created_at)}</p>${run.answers.map(answer=>{const q=question(run.activity,answer.question_index,run.seed,run.level);return `<article class="answer-review"><h3>Étape ${answer.question_index+1}</h3><p>${E(q.prompt)}</p><pre>${E(q.kind==='choice'?q.options[Number(answer.answer)]:answer.answer)}</pre><span class="tag">${answer.correct===null?'Relecture humaine':answer.correct?'Correct':'Incorrect'}${answer.assisted?' · aide déclarée':''}</span></article>`;}).join('')}<form id="reviewForm" class="subsection"><h2>Un retour pour l’élève</h2><label>Commentaire<textarea name="comment" maxlength="1000" required>${E(run.review?.comment||'')}</textarea></label><label>Suite<select name="status"><option value="relu">Relu</option><option value="a_reprendre" ${run.review?.status==='a_reprendre'?'selected':''}>À reprendre</option></select></label><button class="primary" type="submit">Enregistrer le retour</button></form>`;
  $('reviewForm').onsubmit=e=>submit(e,async f=>{await api('review',{run_id:run.id,comment:f.get('comment'),status:f.get('status')});message('Retour enregistré pour l’élève.');});
}
function render(){nav();if(view==='home')renderHome();else if(view==='notebook')renderNotebook();else if(view==='class')renderStudentClass();else if(view==='teacher')renderTeacher();else if(view==='run')renderRun();else if(view==='teacher_run')renderTeacherRun();icons();}
async function submit(e,fn){e.preventDefault();if(busy)return;busy=true;const buttons=[...e.target.querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);try{await fn(new FormData(e.target));}catch(err){message(err.message,true);}finally{busy=false;buttons.forEach(b=>b.disabled=false);}}
async function loadClass(id){if(classe?.classe.id!==id)teacherFilter={student:'',activity:''};classe=await api('class',{class_id:id});view='teacher';render();}
async function start(id,assignment){
  if(!activity(id))return;
  let central=false;
  if(session&&!isTeacher()){
    try{run=(await api('start',{activity:id,level,assignment_id:assignment||null,class_id:assignment?null:practiceTarget()})).run;central=true;}
    catch(e){if(assignment||![503,404].includes(e.status))throw e;message(e.message+' Cette séance sera conservée sur cet appareil.',true);}
  }
  if(!central)run={id:crypto.randomUUID(),activity:id,level,seed:crypto.getRandomValues(new Uint32Array(1))[0],created_at:new Date().toISOString(),answers:[],local:true,catalog_version:VERSION};
  selected=null;assisted=run.level===1;feedback=null;view='run';storeRun();render();window.scrollTo(0,0);
}
async function saveAnswer(){
  if(feedback)return;
  const index=currentIndex(),q=currentQuestion(),answer=String(selected??'').trim();
  if(!answer){message('Propose une réponse avant de valider.');return;}
  const mark=grade(q,answer),row={question_index:index,answer,correct:mark.correct,assisted};
  if(!run.local){
    try{const result=await api('answer',{run_id:run.id,index,answer,assisted});Object.assign(row,result.saved);if(row.answer!==answer)message('Une réponse était déjà enregistrée pour cette étape : elle a été conservée.');if(result.answers){run.pending=(run.pending||[]).filter(p=>!result.answers.some(a=>a.question_index===p.question_index));run.answers=[...result.answers,...run.pending];}}
    catch(e){
      if(e.status===401)throw e;
      if(e.status&&e.status<500)throw e;
      run.pending=run.pending||[];run.pending.push(row);message('Connexion interrompue. Réponse gardée sur cet appareil, à synchroniser.',true);
    }
  }
  if(!run.answers.some(a=>a.question_index===index))run.answers.push(row);
  delete run.draft;run.completed=run.answers.length===6;storeRun();feedback=true;
  document.querySelectorAll('.choices button,#answer').forEach(b=>b.disabled=true);
  $('feedback').innerHTML=`<div class="feedback ${row.correct===false?'wrong':''}"><h3>${row.correct===null?'Une proposition à relire':row.correct?'Ton raisonnement avance !':'Une piste à reprendre'}</h3><p>${E(q.explanation)}</p></div>`;
  document.querySelector('.actions').innerHTML=button('next',run.completed?'Ouvrir le bilan':'Étape suivante '+icon('arrow-right'),'','primary');icons();
}
async function syncPending(){
  if(!session||run.local)return;
  const pending=[...(run.pending||[])];
  for(const row of pending){const result=await api('answer',{run_id:run.id,index:row.question_index,answer:row.answer,assisted:row.assisted});const answer=run.answers.find(x=>x.question_index===row.question_index);if(answer)Object.assign(answer,result.saved);run.pending=run.pending.filter(x=>x.question_index!==row.question_index);storeRun();}
  run=(await api('run',{run_id:run.id})).run;storeRun();
  message('Réponses synchronisées.');render();
}
function worksheet(){
  const a=activity(run?.activity||'lecture'),seed=run?.seed||123,lv=run?.level||level;
  const qs=Array.from({length:6},(_,i)=>question(a.id,i,seed,lv));
  $('printArea').innerHTML=`<h1>${E(a.title)} · CM2</h1><p>Nom : ______________________ Date : ____________</p><p>${E(a.skill)}</p>${qs.map((q,i)=>`<article><h2>${i+1}. ${E(q.prompt)}</h2>${q.passage?'<p>'+E(q.passage)+'</p>':''}${q.spoken?'<p>'+E(q.spoken)+'</p>':''}${q.table?table(q.table):''}${q.visual?`<p>${Array.from({length:Math.ceil(q.visual.a/q.visual.d)*q.visual.d},(_,j)=>j<q.visual.a?'■':'□').join(' ')} (${q.visual.d} parts par unité)</p>`:''}${q.kind==='choice'?q.options.map(o=>'<p>□ '+E(o)+'</p>').join(''):'<div class="write-space"></div>'}</article>`).join('')}<section class="answer-key"><h1>Repères de correction</h1>${qs.map((q,i)=>`<p><strong>${i+1}.</strong> ${E(q.explanation)}</p>`).join('')}</section>`;
  window.print();
}
function printInitialCodes(){
  const codes=(classe?.initial_codes||[]).filter(i=>!i.activated),c=classe?.classe;
  if(!codes.length){message('Aucun premier accès non activé à imprimer.');return;}
  $('printArea').innerHTML=`<h1>Les ateliers de Liam · ${E(c.name)}</h1><p>${E(c.school_year)} · Premiers accès individuels</p><table><thead><tr><th>Code</th><th>Première connexion</th></tr></thead><tbody>${codes.map(i=>{const u=new URL('rejoindre.html',location.href);u.searchParams.set('retour','cm2');u.searchParams.set('public',i.code_public);return `<tr><td><strong>${E(i.code_public)}</strong></td><td>${E(u.href)}</td></tr>`;}).join('')}</tbody></table><p>Choisis ton animal et ton adjectif ; un numéro est tiré au sort. Conserve ensuite cet identifiant personnel pour retrouver ton carnet. Ne communique pas cet identifiant à tes camarades.</p>`;
  window.print();
}
function csv(){
  const safe=s=>'"'+String(s??'').replace(/^[=+@-]/,"'$&").replace(/"/g,'""')+'"';
  const lines=[['Identifiant élève','Atelier','Date','Parcours terminé','Réponses enregistrées','Réponses corrigées automatiquement','Réponses correctes','Aides déclarées','Retour professeur'],...filteredRuns().map(r=>[r.student,activity(r.activity)?.title||r.activity,r.created_at,r.completed?'Oui':'Non',r.answered,r.graded,r.correct,r.assisted,r.review_status||''])];
  const url=URL.createObjectURL(new Blob(['\ufeff'+lines.map(row=>row.map(safe).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='suivi_cm2_'+classe.classe.school_year+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
document.addEventListener('input',e=>{if(e.target.id==='fractionLine'){assisted=true;saveDraft();$('lineValue').textContent=e.target.value+'/'+currentQuestion().visual.d;}});
document.addEventListener('click',async e=>{
  const el=e.target.closest('[data-action]');if(!el||el.disabled)return;const action=el.dataset.action;
  if(busy)return;
  try{
    if(['home','notebook','class'].includes(action)){go(action);return;}
    if(action==='teacher'){classe=null;teacherFilter={student:'',activity:''};go('teacher');return;}
    if(action==='login'){$('loginError').textContent='';$('login').showModal();return;}
    if(action==='close_login'){$('login').close();$('loginForm').reset();return;}
    if(action==='logout'){
      busy=true;let confirmed=true;try{await api('logout');}catch{confirmed=false;}
      window.speechSynthesis?.cancel();session=null;data=null;classe=null;run=null;
      for(const key of ['liam_cm2_session','pvs_tok','pvs_admin_token'])sessionStorage.removeItem(key);
      go('home');message(confirmed?'Déconnexion effectuée.':'Déconnecté sur cet appareil. Le serveur n’a pas pu confirmer la fermeture de session.',!confirmed);return;
    }
    if(action==='choose'){selected=el.dataset.value;saveDraft();document.querySelectorAll('.choice').forEach(b=>{b.classList.toggle('selected',b===el);b.setAttribute('aria-pressed',b===el?'true':'false');});return;}
    if(action==='hint'){assisted=true;saveDraft();$('hint').hidden=false;return;}
    if(action==='part'){assisted=true;saveDraft();el.classList.toggle('filled');el.setAttribute('aria-pressed',el.classList.contains('filled'));$('partCount').textContent=document.querySelectorAll('.part.filled').length+' parts colorées ; '+currentQuestion().visual.d+' parts par unité';return;}
    if(action==='transcript'){assisted=true;saveDraft();$('transcript').hidden=false;return;}
    if(action==='listen'){
      if(!('speechSynthesis'in window)){message('La voix n’est pas disponible dans ce navigateur. La transcription reste accessible.');return;}
      speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(currentQuestion().spoken);u.lang='en-GB';u.rate=.85;speechSynthesis.speak(u);return;
    }
    if(action==='print'){worksheet();return;}
    if(action==='print_initial'){printInitialCodes();return;}
    if(action==='copy_link'){await navigator.clipboard.writeText(el.dataset.url);message('Invitation copiée.');return;}
    if(action==='export'){csv();return;}
    if(action==='next'){selected=null;assisted=run.level===1;feedback=null;render();return;}
    busy=true;el.disabled=true;
    if(action==='start'||action==='assigned')await start(el.dataset.id,el.dataset.assignment);
    else if(action==='validate')await saveAnswer();
    else if(action==='sync')await syncPending();
    else if(action==='refresh'){if(view==='teacher'&&classe)await loadClass(classe.classe.id);else{await refresh();render();}}
    else if(action==='classes'){classe=null;await refresh();go('teacher');}
    else if(action==='open_class'||action==='back_class')await loadClass(el.dataset.id||classe.classe.id);
    else if(action==='approve'||action==='unapprove'){await api('approve',{class_id:classe.classe.id,student:el.dataset.student,approved:action==='approve'});await loadClass(classe.classe.id);}
    else if(action==='archive'){await api('archive',{class_id:classe.classe.id,assignment_id:el.dataset.id});await loadClass(classe.classe.id);}
    else if(action==='reset_student'){if(confirm('Réinitialiser cet accès ? Les travaux restent conservés et les sessions de cet élève seront fermées.')){await api('reset_student',{class_id:classe.classe.id,student:el.dataset.student});await loadClass(classe.classe.id);message('Accès réinitialisé ; le même premier code permet de choisir un nouvel identifiant personnel.');}}
    else if(action==='invite'){if(confirm('Renouveler le code de rattachement de cette classe ? Les élèves déjà confirmés gardent leur accès.')){const r=await api('renew_invite',{class_id:classe.classe.id});message('Nouveau code de classe : '+r.join_code);}}
    else if(action==='resume'){
      const cached=read(cacheKey(),{})[el.dataset.id];
      if(cached?.local)run=cached;else{try{run=(await api('run',{run_id:el.dataset.id})).run;if(cached?.pending?.length){const pending=cached.pending.filter(a=>!run.answers.some(x=>x.question_index===a.question_index));run.answers.push(...pending);run.pending=pending;run.completed=run.answers.length===6;}}catch(err){if(!cached)throw err;run=cached;message(err.message,true);}}
      view='run';selected=null;assisted=run.level===1;feedback=null;render();
    }else if(action==='teacher_run'){run=(await api('run',{run_id:el.dataset.id})).run;view='teacher_run';render();}
  }catch(err){message(err.message,true);}
  finally{busy=false;if(el.isConnected)el.disabled=false;}
});
$('loginForm').onsubmit=async e=>{
  e.preventDefault();if(busy)return;busy=true;const form=e.target;const b=form.querySelector('button[type=submit]');b.disabled=true;
  try{
    const f=new FormData(form);const response=await fetch('/api/identite',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'connecter',secret:f.get('secret')})});
    const r=await response.json();if(!response.ok||!r.token)throw new Error(r.error||'La connexion sécurisée n’est pas disponible.');
    let token=r.token,expire_at=new Date(Date.now()+11*3600*1000).toISOString();
    if(r.role==='admin'){
      $('adminPassLabel').hidden=false;if(!f.get('adminPass'))throw new Error('Saisissez aussi le mot de passe administrateur.');
      const ar=await fetch('/api/identite',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'admin_ouvrir',secret:f.get('secret'),pass:f.get('adminPass')})});const ad=await ar.json();if(!ar.ok)throw new Error(ad.error);token=ad.token;expire_at=ad.expire_at;
    }
    session={public:r.public,role:r.role,token,expire_at};sessionStorage.setItem('liam_cm2_session',JSON.stringify(session));form.reset();$('adminPassLabel').hidden=true;$('login').close();await refresh();classe=null;go(isTeacher()?'teacher':'home');
  }catch(err){$('loginError').textContent=err.message;}finally{busy=false;b.disabled=false;}
};
render();if(session)refresh().then(render);

(function(){
  var KERN_KEY='VIRuDMeF8Wz8DcdfEkW2BBvhD51jNCfg';
  var KERN_URL='https://api.mistral.ai/v1/chat/completions';
  var KERN_MODEL='mistral-small-latest';
  var KERN_TEMP=0.95;
  var KERN_ANALYSIS_TEMP=0.1;
  var KERN_MAX_TOKENS=1000;
  var SUPABASE_URL='https://utgdfopnkplswxmiuyoi.supabase.co';
  var SUPABASE_PUBLISHABLE_KEY='sb_publishable_3JvqbxY4K2RmyJPH255Bzg_TYzpdsLr';

  var SYSTEM_PROMPT='';
  var DOCS=[];
  var INDEX_PROMISE=null;
  var CACHE={};
  var HISTORY=[];
  var OPEN=false;
  var CONCERN={mode:'idle',draft:null,submission:null,message:''};
  var SUPA=null;
  var SUPA_STATE={ready:false,lastError:'',authMode:'none'};

  var STOPWORDS=['le','la','les','de','des','du','d','un','une','et','ou','au','aux','en','dans','sur','pour','par','avec','sans','que','qui','quoi','quel','quelle','quelles','quels','comment','quand','est','sont','a','ai','as','avoir','il','elle','on','nous','vous','ils','elles','ce','cet','cette','ces','mon','ma','mes','ton','ta','tes','son','sa','ses','notre','votre','leur','leurs','je','tu','me','te','se','ne','pas','plus','moins','ca','cela','ici','la','y','ou','vers'];
  var PROMPT_FALLBACK=[
    'Tu es Kern, un compagnon narratif et pédagogique intégré à PIX pHARe.',
    'Tu parles comme Kern, l allié de Lyam à Valdurne, sans quitter un cadre éducatif sûr.',
    'Tu connais l univers de Valdurne et les repères pHARe à partir des sources locales récupérées.',
    'Ta mission : soit créer une scène fictionnelle courte pour entraîner les compétences psychosociales du joueur, soit soutenir prudemment une situation réelle sans la transformer en jeu.',
    'Tu aides à observer, protéger, documenter, mobiliser les témoins, choisir une posture juste et transmettre au bon adulte.',
    'Tu n inventes jamais un fait de protocole, de droit, d Éducation nationale ou de canon local quand il manque dans les sources.'
  ].join('\n');
  var PROMPT_APPENDIX=[
    '=== RÈGLES DE KERN ===',
    '- Appuie-toi sur le contexte local PIX pHARe / Valdurne récupéré plus bas.',
    '- En mode fiction : propose une scène courte, puis 2 ou 3 options maximum.',
    '- En mode fiction : laisse le joueur agir avant de dérouler toute la solution.',
    '- En mode fiction : termine volontiers par un mini-débrief métacognitif.',
    '- En mode situation réelle : ne roleplay pas, ne scénarise pas, sécurise et oriente.',
    '- Pour les points factuels, n utilise que le contexte local récupéré.',
    '- Si tu cites un appui factuel important, termine par une ligne : Appuis locaux : ...'
  ].join('\n');
  var REFS=[
    {id:'PIXHARE_HUB',title:'Hub PIX pHARe',file:'index_PIXHARe.html',pillar:'PIX pHARe',tags:['pixhare','hub','harcelement','phare','valdurne']},
    {id:'PIXHARE_CODE',title:'Code de l Éducation et climat scolaire',file:"Code de l'Éducation et Climat Scolaire.md",pillar:'Références éducatives',tags:['education nationale','cadre','droit','protection']},
    {id:'PIXHARE_CORPUS',title:'Corpus anti-harcèlement scolaire',file:'IA Éducative _ Corpus Anti-Harcèlement Scolaire.txt',pillar:'Références éducatives',tags:['harcelement','phare','temoins','victime','cyber']},
    {id:'PIXHARE_JEUX',title:'Jeux d animation et escape games éducatifs',file:"Jeux d'animation et escape games éducatifs.md",pillar:'Références éducatives',tags:['jeux','cooperation','education']},
    {id:'VALDURNE_HUB',title:'Hub narration Valdurne',file:'hub_narration.html',pillar:'Univers Valdurne',tags:['valdurne','lyam','kern','rena','histoire']},
    {id:'VALDURNE_PREQUEL',title:'Préquelle de Lyam',file:'liam_eystieval_prequel.html',pillar:'Univers Valdurne',tags:['lyam','kern','rena','prequelle']},
    {id:'VALDURNE_RUISSEAU',title:'Lyam au ruisseau des collines',file:'liam_ruisseau_collines.html',pillar:'Univers Valdurne',tags:['lyam','valdurne','amitie']},
    {id:'VALDURNE_REMUS',title:'Chroniques de Remus',file:'remus_chroniques.html',pillar:'Univers Valdurne',tags:['remus','valdurne']},
    {id:'VALDURNE_VOYAGE_1',title:'Voyage vers Valdurne chapitre 1',file:'valdurne_voyage_ch1.html',pillar:'Univers Valdurne',tags:['valdurne','voyage','lyam','kern','rena']},
    {id:'VALDURNE_VOYAGE_2',title:'Voyage vers Valdurne chapitre 2',file:'valdurne_voyage_ch2.html',pillar:'Univers Valdurne',tags:['valdurne','voyage','lyam','kern','rena']},
    {id:'VALDURNE_CH6_MD',title:'Nuit cachée version texte',file:'roman_ch06_nuit_cache_elevenlabs.md',pillar:'Univers Valdurne',tags:['valdurne','roman','lyam','kern','rena']},
    {id:'VALDURNE_CH7_MD',title:'Procès du couloir nord version texte',file:'roman_ch07_proces_couloir_nord_elevenlabs.md',pillar:'Univers Valdurne',tags:['valdurne','proces','kern']},
    {id:'VALDURNE_CH8_MD',title:'Joute des savoirs version texte',file:'roman_ch08_joute_savoirs_elevenlabs.md',pillar:'Univers Valdurne',tags:['valdurne','rena','arguments']},
    {id:'VALDURNE_CH9_MD',title:'Serments version texte',file:'roman_ch09_serments_elevenlabs.md',pillar:'Univers Valdurne',tags:['valdurne','lyam','kern','serments']}
  ];
  var STORY_FILES=['roman_ch01.html','roman_ch02.html','roman_ch03.html','roman_ch04.html','roman_ch05.html','roman_ch06.html','roman_ch07.html','roman_ch08.html','roman_ch09.html','roman_ch10.html'];

  function prompt(){return (SYSTEM_PROMPT&&SYSTEM_PROMPT.trim()?SYSTEM_PROMPT:PROMPT_FALLBACK).trim()+'\n\n'+PROMPT_APPENDIX;}
  async function loadPrompt(){
    try{
      var res=await fetch('agora_system.txt',{cache:'no-store'});
      if(res.ok){SYSTEM_PROMPT=await res.text();return;}
    }catch(e){}
    SYSTEM_PROMPT=PROMPT_FALLBACK;
  }
  function norm(s){return (s||'').toString().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/œ/g,'oe').replace(/æ/g,'ae').replace(/[^a-z0-9\s\-]/g,' ').replace(/\s+/g,' ').trim();}
  function toks(s){return norm(s).split(' ').filter(function(t){return t&&t.length>1&&STOPWORDS.indexOf(t)===-1;});}
  function clip(s,max){s=(s||'').replace(/\s+/g,' ').trim();return !s?'':(s.length<=max?s:s.slice(0,max-1)+'…');}
  function esc(s){return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');}
  function fmtTs(ts){try{var d=new Date(ts);return isNaN(d.getTime())?'':d.toLocaleString('fr-FR');}catch(e){return '';}}
  function humanize(path){return (path||'').replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').replace(/\s+/g,' ').replace(/\(\d+\)/g,' ').trim();}
  function stripHtml(src){return clip((src||'').replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim(),14000);}
  function stripMd(src){return clip((src||'').replace(/!\[[^\]]*\]\([^)]+\)/g,' ').replace(/\[([^\]]+)\]\(([^)]+)\)/g,'$1').replace(/^\s{0,3}#{1,6}\s*/gm,'').replace(/^\s*>\s?/gm,'').replace(/^\s*[-*+]\s+/gm,'').replace(/^\s*\d+\.\s+/gm,'').replace(/[*_`~|]/g,' ').replace(/\s+/g,' ').trim(),14000);}
  function extractText(doc,src){return /\.md$/i.test(doc.file)?stripMd(src):/\.(txt|json|sql)$/i.test(doc.file)?clip((src||'').replace(/\s+/g,' ').trim(),14000):stripHtml(src);}
  function oldKey(){return 'pixhare_agora_chat_'+(getPlayer()||'anon');}
  function newKey(){return 'pixhare_kern_chat_'+(getPlayer()||'anon');}
  function migrateHistory(){try{if(!localStorage.getItem(newKey())){var legacy=localStorage.getItem(oldKey());if(legacy)localStorage.setItem(newKey(),legacy);}}catch(e){}}
  function latest(role){for(var i=HISTORY.length-1;i>=0;i--){if(HISTORY[i]&&HISTORY[i].role===role)return HISTORY[i];}return null;}
  function state(){var player=getPlayer();var total=PILLARS.reduce(function(sum,p){return sum+p.modules.length;},0);var done=doneCount();var protocol=typeof pvDone==='function'&&pvDone();return {player:player,connected:!!player,modulesDone:done,modulesTotal:total,protocolDone:protocol,ready:!!player&&done>=total&&protocol};}

  function buildDocs(){
    var out=[],seen={};
    function push(doc){
      var key=(doc.id||'')+'::'+(doc.file||'');
      if(seen[key])return;
      seen[key]=true;
      doc.search=norm([doc.id,doc.title,doc.pillar||'',doc.text||'',(doc.tags||[]).join(' ')].join(' '));
      out.push(doc);
    }
    REFS.forEach(function(ref){push({kind:'ref',id:ref.id,title:ref.title,file:ref.file,pillar:ref.pillar,tags:ref.tags||[],text:(ref.title+' '+(ref.tags||[]).join(' ')).trim(),excerpt:ref.title});});
    STORY_FILES.forEach(function(file){push({kind:'story',id:'STORY_'+file.replace(/[^A-Za-z0-9]+/g,'_'),title:'Univers Valdurne — '+humanize(file),file:file,pillar:'Univers Valdurne',tags:['valdurne','lyam','kern','rena','roman'],text:'Univers Valdurne — '+humanize(file),excerpt:humanize(file)});});
    PILLARS.forEach(function(p){p.modules.forEach(function(m){push({kind:'module',id:'PIXHARE_'+m.id,title:m.id+' — '+m.name,file:m.file,pillar:p.title,tags:['pixhare','module',p.key,p.title].concat(m.name.split(/\s+/)),text:p.title+' — '+p.desc+' — '+m.name,excerpt:m.id+' — '+m.name});});});
    if(typeof PROTOCOLE_VALDURNE!=='undefined'){push({kind:'protocol',id:PROTOCOLE_VALDURNE.id,title:'Protocole Valdurne — '+PROTOCOLE_VALDURNE.name,file:PROTOCOLE_VALDURNE.file,pillar:'Valdurne',tags:['protocole','valdurne','kern','lyam','rena','phare','cps'],text:'Protocole Valdurne — '+PROTOCOLE_VALDURNE.name,excerpt:PROTOCOLE_VALDURNE.name});}
    return out;
  }

  async function fetchText(file){
    if(!file)return '';
    if(Object.prototype.hasOwnProperty.call(CACHE,file))return CACHE[file];
    try{
      var res=await fetch(file,{cache:'no-store'});
      if(!res.ok)throw new Error('HTTP '+res.status);
      CACHE[file]=await res.text();
    }catch(e){CACHE[file]='';}
    return CACHE[file];
  }

  async function buildIndex(){
    if(DOCS.length)return DOCS;
    if(INDEX_PROMISE)return INDEX_PROMISE;
    INDEX_PROMISE=(async function(){
      DOCS=buildDocs();
      await Promise.all(DOCS.filter(function(doc){return !!doc.file;}).map(async function(doc){
        var src=await fetchText(doc.file);
        if(!src)return;
        var extracted=extractText(doc,src);
        if(extracted){
          doc.text=((doc.text||'')+' '+extracted).trim();
          doc.excerpt=clip(extracted,1200);
          doc.search=norm([doc.id,doc.title,doc.pillar||'',doc.text||'',(doc.tags||[]).join(' ')].join(' '));
        }
      }));
      return DOCS;
    })();
    return INDEX_PROMISE;
  }

  function score(query,doc){
    var q=norm(query), words=toks(query), hay=doc.search||'', s=0;
    if(!hay)return s;
    if(q&&hay.indexOf(q)!==-1)s+=140;
    words.forEach(function(w){
      if(doc.id&&norm(doc.id).indexOf(w)!==-1)s+=36;
      if(doc.title&&norm(doc.title).indexOf(w)!==-1)s+=24;
      if(doc.pillar&&norm(doc.pillar).indexOf(w)!==-1)s+=14;
      if(hay.indexOf(w)!==-1)s+=7;
    });
    if(/kern|lyam|rena|valdur/.test(q)&&/kern|lyam|rena|valdur/.test(hay))s+=70;
    if(/harcelement|rumeur|exclusion|agression|temoin|victime|cps|metacognition/.test(q)&&/harcelement|rumeur|exclusion|agression|temoin|victime|cps|metacognition/.test(hay))s+=55;
    if(/phare|protocole|education nationale|cadre|juridique|droit/.test(q)&&/phare|protocole|education nationale|cadre|juridique|droit/.test(hay))s+=65;
    return s;
  }

  function snippet(text,query,max){
    var compact=(text||'').replace(/\s+/g,' ').trim();
    if(!compact)return '';
    if(compact.length<=max)return compact;
    var parts=(compact.match(/[^.!?\n]+[.!?]?/g)||[]).map(function(x){return x.trim();}).filter(function(x){return x.length>28;});
    var words=toks(query);
    if(!parts.length||!words.length)return clip(compact,max);
    var best=parts.map(function(part,idx){
      var hay=norm(part), s=0;
      words.forEach(function(w){if(hay.indexOf(w)!==-1)s+=Math.max(6,w.length*2);});
      return {idx:idx,score:s};
    }).sort(function(a,b){return b.score-a.score;})[0];
    if(!best||!best.score)return clip(compact,max);
    return clip([parts[best.idx-1],parts[best.idx],parts[best.idx+1]].filter(Boolean).join(' '),max);
  }

  async function contextFor(query){
    var docs=await buildIndex();
    var chosen=docs.map(function(doc){return {doc:doc,score:score(query,doc)};}).filter(function(x){return x.score>0;}).sort(function(a,b){return b.score-a.score;}).slice(0,6).map(function(x){return x.doc;});
    if(!chosen.length)chosen=docs.slice(0,4);
    var st=state(), lines=['=== CONTEXTE LOCAL PIX pHARe / VALDURNE ===','Joueur : '+(st.player||'non connecté'),'Progression modules : '+st.modulesDone+'/'+st.modulesTotal,'Protocole Valdurne terminé : '+(st.protocolDone?'oui':'non'),''];
    chosen.forEach(function(doc,idx){lines.push('['+(idx+1)+'] '+doc.title);if(doc.pillar)lines.push('Pilier : '+doc.pillar);if(doc.file)lines.push('Fichier : '+doc.file);lines.push(snippet(doc.text||doc.excerpt||'',query,900));lines.push('');});
    return {docs:chosen,context:lines.join('\n')};
  }

  function saveHistory(){try{localStorage.setItem(newKey(),JSON.stringify(HISTORY));}catch(e){}}
  function loadHistory(){migrateHistory();try{HISTORY=JSON.parse(localStorage.getItem(newKey())||'[]');if(!Array.isArray(HISTORY))HISTORY=[];}catch(e){HISTORY=[];}renderMessages();updateControls();}
  function pushMessage(role,text){HISTORY.push({role:role,content:text,ts:new Date().toISOString()});saveHistory();renderMessages();updateControls();}

  function renderMessages(){
    var body=document.getElementById('agora-messages');
    if(!body)return;
    body.innerHTML='';
    HISTORY.forEach(function(msg){
      var div=document.createElement('div');
      div.className='agora-msg '+(msg.role==='assistant'?'ai':'user');
      div.innerHTML='<span class="msg-name">'+(msg.role==='assistant'?'Kern':(getPlayer()||'Joueur'))+(msg.ts?' · '+fmtTs(msg.ts):'')+'</span>'+esc(msg.content||'');
      body.appendChild(div);
    });
    body.scrollTop=body.scrollHeight;
  }

  function updateControls(){
    var st=state();
    var toggle=document.getElementById('agora-toggle');
    var download=document.getElementById('agora-download');
    var clear=document.getElementById('agora-clear');
    var report=document.getElementById('agora-report');
    var input=document.getElementById('agora-input');
    var send=document.getElementById('agora-send');
    if(toggle){toggle.disabled=!st.ready;toggle.textContent=st.ready?(OPEN?'Fermer Kern':'Ouvrir Kern'):'Kern verrouillé';}
    if(download)download.disabled=!HISTORY.length;
    if(clear)clear.disabled=!HISTORY.length;
    if(report)report.disabled=!st.connected || !latest('user');
    if(input)input.disabled=!st.ready;
    if(send)send.disabled=!st.ready;
  }

  function renderConcern(){
    var box=document.getElementById('agora-concern-box');
    if(!box)return;
    if(CONCERN.mode==='idle'){box.classList.remove('open');box.innerHTML='';return;}
    box.classList.add('open');

    if(CONCERN.mode==='hint'){
      box.innerHTML='<div class="agora-concern-title">Situation réelle</div><div class="agora-concern-copy">'+esc(CONCERN.message||'Si tu décris une situation réelle, je peux aider à préparer un signalement structuré.')+'</div><div class="agora-concern-actions"><button class="agora-btn secondary" type="button" onclick="prepareKernConcern()">Préparer un signalement</button><button class="agora-btn secondary" type="button" onclick="dismissKernConcern()">Masquer</button></div>';
      return;
    }
    if(CONCERN.mode==='building' || CONCERN.mode==='submitting'){
      box.innerHTML='<div class="agora-concern-title">'+(CONCERN.mode==='building'?'Analyse en cours':'Envoi vers Supabase')+'</div><div class="agora-concern-copy">'+esc(CONCERN.message||'Patiente un instant…')+'</div>';
      return;
    }
    if(CONCERN.mode==='error'){
      box.innerHTML='<div class="agora-concern-title">Signalement</div><div class="agora-concern-copy">'+esc(CONCERN.message||'Impossible de préparer le signalement.')+'</div><div class="agora-concern-actions"><button class="agora-btn secondary" type="button" onclick="prepareKernConcern()">Réessayer</button><button class="agora-btn secondary" type="button" onclick="dismissKernConcern()">Masquer</button></div>';
      return;
    }
    var d=CONCERN.draft||{}, sub=CONCERN.submission;
    box.innerHTML='<div class="agora-concern-title">Signalement structuré</div><div class="agora-concern-grid"><div><span class="agora-concern-label">Personne concernée</span><div class="agora-concern-value">'+esc(d.observed_person_label||'À préciser')+'</div></div><div><span class="agora-concern-label">Canal</span><div class="agora-concern-value">'+esc(d.channel||'unknown')+'</div></div><div><span class="agora-concern-label">Répétition</span><div class="agora-concern-value">'+esc(String(d.recurrence_count||1))+'</div></div><div><span class="agora-concern-label">Résumé</span><div class="agora-concern-value">'+esc(d.summary||'')+'</div></div></div>'+(sub?'<div class="agora-concern-meta">Signalement envoyé · niveau détecté : <strong>'+esc(sub.detectedLevel||'inconnu')+'</strong> · file : <strong>'+esc(sub.detectedQueue||'inconnue')+'</strong></div>':'<div class="agora-concern-meta">Prévisualisation prête. Si l authentification anonyme Supabase est activée, tu peux l envoyer directement.</div>')+'<div class="agora-concern-actions">'+(sub?'':'<button class="agora-btn secondary" type="button" onclick="submitKernConcern()">Envoyer à Supabase</button>')+'<button class="agora-btn secondary" type="button" onclick="prepareKernConcern()">Recalculer</button><button class="agora-btn secondary" type="button" onclick="dismissKernConcern()">Masquer</button></div>';
  }

  function renderSection(){
    var st=state();
    var section=document.getElementById('agora-section');
    var badge=document.getElementById('agora-badge');
    var copy=document.getElementById('agora-lock-copy');
    var pillModules=document.getElementById('agora-pill-modules');
    var pillProtocol=document.getElementById('agora-pill-protocol');
    var pillPlayer=document.getElementById('agora-pill-player');
    var panel=document.getElementById('agora-panel');
    if(!section||!badge||!copy||!pillModules||!pillProtocol||!pillPlayer||!panel)return;
    section.classList.toggle('ready',st.ready);
    section.classList.toggle('locked',!st.ready);
    badge.textContent=st.ready?'✅ Accès ouvert':'🔒 Accès verrouillé';
    copy.textContent=!st.connected?'Connecte d abord un joueur depuis le Portail Vie Scolaire. Kern s ouvrira ensuite quand les 30 modules PIX pHARe et le Protocole Valdurne seront validés.':(st.ready?'Kern est disponible. Tu peux lui demander une scène interactive, un entraînement à choix, ou un appui prudent sur une situation réelle.':'Kern se débloque quand ce joueur a validé les 30 modules PIX pHARe ainsi que le Protocole Valdurne.');
    pillModules.textContent='Modules : '+st.modulesDone+'/'+st.modulesTotal;
    pillModules.className='agora-pill '+(st.modulesDone>=st.modulesTotal?'ok':'warn');
    pillProtocol.textContent='Protocole : '+(st.protocolDone?'terminé':'à terminer');
    pillProtocol.className='agora-pill '+(st.protocolDone?'ok':'warn');
    pillPlayer.textContent='Joueur : '+(st.player||'non connecté');
    pillPlayer.className='agora-pill '+(st.connected?'ok':'warn');
    if(st.ready&&OPEN){
      if(!HISTORY.length){
        HISTORY.push({role:'assistant',content:'Je suis Kern. Je peux te proposer une scène à Valdurne pour t entraîner, ou t aider à réfléchir à une situation réelle sans la transformer en jeu. Commence par me demander une scène, un choix difficile, ou un débrief sur ta posture.',ts:new Date().toISOString()});
        saveHistory();
      }
      panel.classList.add('open');
      renderMessages();
    }else{
      panel.classList.remove('open');
    }
    updateControls();
    renderConcern();
  }

  function typing(on,text){
    var body=document.getElementById('agora-messages'), existing=document.getElementById('agora-typing');
    if(existing)existing.remove();
    if(!on||!body)return;
    var div=document.createElement('div');
    div.id='agora-typing';
    div.className='agora-typing';
    div.textContent=text||'Kern consulte les archives de Valdurne…';
    body.appendChild(div);
    body.scrollTop=body.scrollHeight;
  }

  function exportText(){
    var st=state(), lines=['Conversation PIX pHARe — Kern','Joueur : '+(st.player||'non connecté'),'Exporté le : '+new Date().toLocaleString('fr-FR'),''];
    HISTORY.forEach(function(msg,idx){lines.push('['+(idx+1)+'] '+(msg.role==='assistant'?'Kern':(st.player||'Joueur'))+(msg.ts?' — '+fmtTs(msg.ts):''));lines.push(msg.content||'');lines.push('');});
    return lines.join('\r\n').trim();
  }

  function looksReal(text){
    var s=norm(text), direct=['dans ma classe','dans mon college','dans mon école','dans mon ecole','dans la vraie vie','dans mon etablissement','dans notre college','dans notre classe','ca m arrive','ca nous arrive','un eleve de','une eleve de','au college','au foyer','au self','dans la cour'];
    for(var i=0;i<direct.length;i++){if(s.indexOf(direct[i])!==-1)return true;}
    return /(harcelement|rumeur|menace|agression|humiliation|mise a l ecart|cyber|violence|racket|suicide|detresse)/.test(s) && /(college|classe|eleve|prof|aed|cpe|vie scolaire|surveillant|etablissement|internat)/.test(s);
  }

  function runtimeRules(mode){
    var lines=['=== GARDE-FOUS KERN ===','- Réponds uniquement à la dernière demande utilisateur.','- Les éléments factuels sur pHARe, le harcèlement, les CPS, le protocole, l Éducation nationale et le canon de Valdurne doivent venir du contexte local récupéré.','- Reste concis, concret et utile.'];
    if(mode==='support'){
      lines.push('- Le joueur semble décrire une situation réelle : ne roleplay pas et ne transforme pas cela en aventure.');
      lines.push('- Commence par la sécurité et le niveau d urgence.');
      lines.push('- Distingue faits observés, hypothèses et besoins immédiats.');
      lines.push('- Propose des appuis adultes et une chaîne d action prudente.');
      lines.push('- Si tu détectes un risque grave, immédiat, suicidaire, sexuel ou violent, dis clairement de prévenir immédiatement un adulte ou un service d urgence adapté.');
      lines.push('- Format recommandé : Ce qui me préoccupe / Ce que tu peux faire maintenant / Ce qu il faut noter.');
    }else{
      lines.push('- Tu es Kern dans un cadre narratif éducatif.');
      lines.push('- Propose une scène courte, puis 2 ou 3 options maximum.');
      lines.push('- Ne donne pas toute la solution immédiatement : fais choisir, puis débriefe brièvement.');
      lines.push('- Format recommandé : Scène / Tes options / Repère Kern.');
    }
    return lines.join('\n');
  }

  async function complete(messages,temp,maxTokens){
    var res=await fetch(KERN_URL,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+KERN_KEY},body:JSON.stringify({model:KERN_MODEL,messages:messages,temperature:typeof temp==='number'?temp:KERN_TEMP,max_tokens:maxTokens||KERN_MAX_TOKENS})});
    var data=await res.json().catch(function(){return {};});
    if(res.ok&&data.choices&&data.choices[0]&&data.choices[0].message)return data.choices[0].message.content||'';
    if(data&&data.error&&data.error.message)throw new Error(data.error.message);
    if(data&&data.message)throw new Error(data.message);
    throw new Error('Réponse API indisponible.');
  }

  function extractJson(text){
    var clean=(text||'').trim().replace(/^```json\s*/i,'').replace(/^```\s*/,'').replace(/\s*```$/,'').trim();
    try{return JSON.parse(clean);}catch(e){}
    var a=clean.indexOf('{'), b=clean.lastIndexOf('}');
    if(a!==-1&&b!==-1&&b>a)return JSON.parse(clean.slice(a,b+1));
    throw new Error('JSON introuvable dans la réponse.');
  }

  function toInt(v,fb,min,max){var n=parseInt(v,10);if(isNaN(n))n=fb;if(typeof min==='number'&&n<min)n=min;if(typeof max==='number'&&n>max)n=max;return n;}
  function toBool(v){if(typeof v==='boolean')return v;if(typeof v==='string'){var s=norm(v);return s==='true'||s==='oui'||s==='1';}return !!v;}
  function slug(v){var s=norm(v).replace(/\s+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');return s||('situation-'+Date.now());}

  function buildDraft(raw){
    raw=raw&&typeof raw==='object'?raw:{};
    var user=latest('user'), ai=latest('assistant');
    var allowedType=['student','group','class','staff','family','unknown'], allowedChannel=['in_person','online','mixed','unknown'];
    var label=clip(String(raw.observed_person_label||raw.observed_person_key||'Situation à préciser'),120);
    return {
      realm:'real',
      subject_type:allowedType.indexOf(raw.subject_type)!==-1?raw.subject_type:'student',
      observed_person_key:slug(raw.observed_person_key||label),
      observed_person_label:label,
      reporter_player_code:getPlayer()||null,
      reporter_label:getPlayer()||null,
      reporter_role:'player',
      source:'chatbot',
      source_ref:'kern_pixhare',
      location_label:clip(String(raw.location_label||''),120),
      channel:allowedChannel.indexOf(raw.channel)!==-1?raw.channel:'unknown',
      summary:clip(String(raw.summary||user&&user.content||'Signalement à préciser'),420),
      facts:{origin:'kern',userMessage:user?user.content:'',assistantContext:ai?clip(ai.content,700):'',extractedFacts:raw.facts&&typeof raw.facts==='object'?raw.facts:{}},
      recurrence_count:toInt(raw.recurrence_count,1,1,99),
      witness_count:toInt(raw.witness_count,0,0,99),
      aggressor_count:toInt(raw.aggressor_count,1,1,99),
      target_count:toInt(raw.target_count,1,1,99),
      repeated:toBool(raw.repeated),
      power_imbalance:toBool(raw.power_imbalance),
      public_humiliation:toBool(raw.public_humiliation),
      social_exclusion:toBool(raw.social_exclusion),
      rumor:toBool(raw.rumor),
      cyber:toBool(raw.cyber),
      discrimination:toBool(raw.discrimination),
      threat:toBool(raw.threat),
      physical_aggression:toBool(raw.physical_aggression),
      sexual_violence:toBool(raw.sexual_violence),
      coercion_or_extortion:toBool(raw.coercion_or_extortion),
      property_damage:toBool(raw.property_damage),
      self_harm_mention:toBool(raw.self_harm_mention),
      suicide_mention:toBool(raw.suicide_mention),
      adult_involved:toBool(raw.adult_involved),
      urgent_protection_needed:toBool(raw.urgent_protection_needed),
      evidence_available:toBool(raw.evidence_available)
    };
  }

  async function ensureSupa(){
    if(SUPA_STATE.ready&&SUPA)return true;
    if(!window.supabase||!window.supabase.createClient){SUPA_STATE.lastError='Librairie Supabase absente dans la page.';return false;}
    try{
      if(!SUPA)SUPA=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
      var sessionRes=await SUPA.auth.getSession(), session=sessionRes&&sessionRes.data&&sessionRes.data.session;
      if(!session){
        var signInRes=await SUPA.auth.signInAnonymously();
        if(signInRes.error)throw signInRes.error;
        session=signInRes.data&&signInRes.data.session;
        SUPA_STATE.authMode='anonymous';
      }else{
        SUPA_STATE.authMode='session';
      }
      SUPA_STATE.ready=!!session;
      SUPA_STATE.lastError=session?'':'Authentification Supabase indisponible.';
      return SUPA_STATE.ready;
    }catch(e){
      SUPA_STATE.ready=false;
      SUPA_STATE.lastError=(e&&e.message)||'Connexion Supabase impossible.';
      return false;
    }
  }

  window.toggleKern=function(){
    var st=state();
    if(!st.ready){toast('Kern se débloque après les 30 modules PIX pHARe et le Protocole Valdurne.');return;}
    OPEN=!OPEN;
    renderSection();
    if(OPEN){
      var input=document.getElementById('agora-input');
      if(input)setTimeout(function(){input.focus();},80);
    }
  };

  window.downloadKernHistory=function(){
    if(!HISTORY.length)return;
    var blob=new Blob([exportText()],{type:'text/plain;charset=utf-8'});
    var url=URL.createObjectURL(blob);
    var link=document.createElement('a');
    link.href=url;
    link.download='kern-'+(getPlayer()||'anon')+'-'+new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')+'.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function(){URL.revokeObjectURL(url);},500);
  };

  window.clearKernHistory=function(){
    if(!HISTORY.length)return;
    if(!confirm('Effacer la conversation de Kern enregistrée pour '+(getPlayer()||'ce joueur')+' ?'))return;
    HISTORY=[];
    try{localStorage.removeItem(newKey());localStorage.removeItem(oldKey());}catch(e){}
    renderMessages();
    updateControls();
  };

  window.dismissKernConcern=function(){CONCERN={mode:'idle',draft:null,submission:null,message:''};renderConcern();};

  window.prepareKernConcern=async function(){
    var user=latest('user');
    if(!user){toast('Aucun message joueur récent à analyser.');return;}
    CONCERN={mode:'building',draft:null,submission:null,message:'Kern structure les faits en signalement…'};
    renderConcern();
    try{
      var ai=latest('assistant');
      var guide=[
        'Tu extrais un signalement structuré à partir d un message utilisateur décrivant une situation réelle préoccupante en milieu scolaire.',
        'Réponds uniquement en JSON valide, sans markdown, sans commentaire.',
        'Sois prudent : si un élément n est pas établi, mets une valeur conservatrice ou laisse la chaîne vide.',
        'Champs attendus : realm, subject_type, observed_person_key, observed_person_label, location_label, channel, summary, recurrence_count, witness_count, aggressor_count, target_count, repeated, power_imbalance, public_humiliation, social_exclusion, rumor, cyber, discrimination, threat, physical_aggression, sexual_violence, coercion_or_extortion, property_damage, self_harm_mention, suicide_mention, adult_involved, urgent_protection_needed, evidence_available, facts.',
        'realm doit valoir real.',
        'subject_type doit être un de : student, group, class, staff, family, unknown.',
        'channel doit être un de : in_person, online, mixed, unknown.'
      ].join('\n');
      var raw=await complete([{role:'system',content:guide},{role:'user',content:'Message du joueur :\n'+(user.content||'')+'\n\nContexte de la dernière réponse de Kern :\n'+(ai?ai.content:'')}],KERN_ANALYSIS_TEMP,650);
      CONCERN={mode:'ready',draft:buildDraft(extractJson(raw)),submission:null,message:'Prévisualisation prête.'};
      renderConcern();
    }catch(e){
      CONCERN={mode:'error',draft:null,submission:null,message:'Impossible de préparer le signalement : '+((e&&e.message)||'erreur inconnue')};
      renderConcern();
    }
  };

  window.submitKernConcern=async function(){
    if(!CONCERN.draft){toast('Aucun signalement préparé.');return;}
    CONCERN.mode='submitting';
    CONCERN.message='Connexion à Supabase puis envoi du signalement…';
    renderConcern();
    try{
      var ok=await ensureSupa();
      if(!ok)throw new Error(SUPA_STATE.lastError||'Authentification Supabase non disponible. Active idéalement Anonymous Sign-Ins dans Supabase Auth.');
      var rpcRes=await SUPA.rpc('aed_submit_concern_report',{p_report:CONCERN.draft});
      if(rpcRes.error)throw rpcRes.error;
      CONCERN.mode='submitted';
      CONCERN.submission=rpcRes.data||null;
      CONCERN.message='Signalement envoyé.';
      renderConcern();
      toast('Signalement envoyé à Supabase.');
    }catch(e){
      CONCERN.mode='error';
      CONCERN.message='Envoi impossible : '+((e&&e.message)||'erreur inconnue');
      renderConcern();
    }
  };

  window.sendKern=async function(){
    var st=state(), input=document.getElementById('agora-input'), send=document.getElementById('agora-send');
    var text=(input&&input.value||'').trim(), mode=looksReal(text)?'support':'fiction';
    if(!st.ready){toast('Kern est encore verrouillé pour ce joueur.');return;}
    if(!text)return;
    input.value='';
    if(send)send.disabled=true;
    pushMessage('user',text);
    typing(true,mode==='support'?'Kern relit les repères de protection et de protocole…':'Kern consulte les archives PIX pHARe et les chroniques de Valdurne…');
    try{
      var ctx=await contextFor(text);
      var sys=prompt()+'\n\n'+runtimeRules(mode)+'\n\n'+ctx.context;
      var prior=HISTORY.slice(Math.max(HISTORY.length-7,0),Math.max(HISTORY.length-1,0)).map(function(msg){return {role:msg.role==='assistant'?'assistant':'user',content:msg.content};});
      var reply=await complete([{role:'system',content:sys}].concat(prior).concat([{role:'user',content:text}]),KERN_TEMP,KERN_MAX_TOKENS);
      typing(false);
      pushMessage('assistant',reply||'Je n ai pas réussi à formuler de réponse. Réessaie avec une consigne plus précise.');
      if(mode==='support'&&CONCERN.mode==='idle'){CONCERN={mode:'hint',draft:null,submission:null,message:'Si tu décris une situation réelle, je peux aussi préparer un signalement structuré à partir de ce que tu viens d écrire.'};}
      renderConcern();
    }catch(e){
      typing(false);
      pushMessage('assistant','Je n arrive pas à joindre Mistral ou à relire les sources locales de PIX pHARe. Vérifie que les fichiers sont bien publiés dans ce dossier, puis réessaie.');
    }
    if(send)send.disabled=false;
    updateControls();
    if(input)input.focus();
  };

  function appendProtocolAdminControls(){
    if(!adminUnlocked)return;
    var list=document.getElementById('admin-mod-list');
    if(!list||list.querySelector('[data-kern-admin="protocol"]'))return;
    var sep=document.createElement('div');
    sep.className='psep';
    sep.textContent='⚖️ Protocole Valdurne';
    sep.setAttribute('data-kern-admin','protocol');
    list.appendChild(sep);
    var protocolDone=typeof pvDone==='function'&&pvDone();
    var pWrap=document.createElement('label');
    pWrap.className='mc';
    var pChk=document.createElement('input');
    pChk.type='checkbox';
    pChk.value=PROTOCOLE_VALDURNE.certKey;
    pChk.checked=protocolDone;
    var pLbl=document.createElement('span');
    pLbl.className='mc-lbl';
    pLbl.innerHTML='⚖️ '+PROTOCOLE_VALDURNE.name+(protocolDone?'<span class="mc-done">✓ validé</span>':'');
    pWrap.appendChild(pChk);
    pWrap.appendChild(pLbl);
    list.appendChild(pWrap);
    var metaDone=typeof pvMetacogDone==='function'&&pvMetacogDone();
    var mWrap=document.createElement('label');
    mWrap.className='mc';
    var mChk=document.createElement('input');
    mChk.type='checkbox';
    mChk.value=PROTOCOLE_VALDURNE.metacogCert;
    mChk.checked=metaDone;
    var mLbl=document.createElement('span');
    mLbl.className='mc-lbl';
    mLbl.innerHTML='🧠 Réflexion — '+PROTOCOLE_VALDURNE.name+(metaDone?'<span class="mc-done">✓ validé</span>':'');
    mWrap.appendChild(mChk);
    mWrap.appendChild(mLbl);
    list.appendChild(mWrap);
  }

  var originalRender=typeof render==='function'?render:null;
  if(originalRender){render=function(){originalRender();renderSection();};}
  var originalRenderValdurne=typeof renderValdurne==='function'?renderValdurne:null;
  if(originalRenderValdurne){renderValdurne=function(){originalRenderValdurne();renderSection();};}
  var originalBuildAdminList=typeof buildAdminList==='function'?buildAdminList:null;
  if(originalBuildAdminList){buildAdminList=function(){originalBuildAdminList();appendProtocolAdminControls();};}

  adminValidateSelected=function(){
    if(!adminUnlocked)return;
    var boxes=document.querySelectorAll('#admin-mod-list input[type=checkbox]'), count=0;
    boxes.forEach(function(chk){
      var val=chk.value;
      if(!chk.checked)return;
      if(val===PROTOCOLE_VALDURNE.certKey){if(!pvDone()){localStorage.setItem(val,JSON.stringify({v:1,d:new Date().toISOString(),m:val,f:true,admin:true,bestFin:4,xp:PROTOCOLE_VALDURNE.xp||150}));count++;}return;}
      if(val===PROTOCOLE_VALDURNE.metacogCert){if(!pvMetacogDone()){localStorage.setItem(val,JSON.stringify({v:1,d:new Date().toISOString(),m:val,f:true,admin:true}));count++;}return;}
      if(val.startsWith('CERT_JDR_')&&!jdrIsDone(val)){localStorage.setItem(val,JSON.stringify({v:1,d:new Date().toISOString(),m:val,f:true,admin:true}));count++;return;}
      if(val.startsWith('CERT_METACOG_')&&!jdrIsMetacogDone(val)){localStorage.setItem(val,JSON.stringify({v:1,d:new Date().toISOString(),m:val,f:true,admin:true}));count++;return;}
      if(!val.startsWith('CERT_JDR_')&&!val.startsWith('CERT_METACOG_')&&!isDone(val)){validateModule(val,true);count++;}
    });
    var fb=document.getElementById('admin-fb');
    if(count>0){fb.className='aok';fb.textContent='✅ '+count+' élément(s) validé(s)';buildAdminList();render();renderValdurne();}else{fb.className='aerr';fb.textContent='Aucun nouvel élément à valider';}
  };

  adminResetAll=function(){
    if(!adminUnlocked)return;
    if(!confirm('Supprimer TOUTE la progression PIXHARe du joueur actuel ?'))return;
    PILLARS.forEach(function(p){p.modules.forEach(function(m){localStorage.removeItem(ckey(m.id));});});
    JDR_PILLARS.forEach(function(jp){jp.jdrs.forEach(function(jdr){localStorage.removeItem(jdr.certKey);if(jdr.metacogCert)localStorage.removeItem(jdr.metacogCert);localStorage.removeItem('VALDURNE_LEGACY_'+jp.key+'_A1');});});
    localStorage.removeItem(PROTOCOLE_VALDURNE.certKey);
    localStorage.removeItem(PROTOCOLE_VALDURNE.metacogCert);
    localStorage.removeItem('pvs_phare_pending');
    localStorage.removeItem('pvs_jdr_pending');
    localStorage.removeItem('pvs_metacog_pending');
    var fb=document.getElementById('admin-fb');
    fb.className='aok';
    fb.textContent='🗑 Progression supprimée';
    buildAdminList();
    render();
    renderValdurne();
  };

  window.addEventListener('storage',function(e){
    if(!e.key||e.key.indexOf('CERT_')===0||e.key==='pvs_current_player'||e.key==='pvs_phare_player'){loadHistory();renderSection();}
  });

  if(typeof PROTOCOLE_VALDURNE!=='undefined'){PROTOCOLE_VALDURNE.file='PROTOCOLE_VALDURNE_01 (1).html';}

  window.toggleAgora=window.toggleKern;
  window.downloadAgoraHistory=window.downloadKernHistory;
  window.clearAgoraHistory=window.clearKernHistory;
  window.sendAgora=window.sendKern;

  loadPrompt().then(function(){return buildIndex();}).catch(function(){return null;}).finally(function(){loadHistory();if(typeof render==='function')render();if(typeof renderValdurne==='function')renderValdurne();});

})();

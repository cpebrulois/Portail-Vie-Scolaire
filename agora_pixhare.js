(function(){
  var AGORA_MISTRAL_KEY='VIRuDMeF8Wz8DcdfEkW2BBvhD51jNCfg';
  var AGORA_MISTRAL_URL='https://api.mistral.ai/v1/chat/completions';
  var AGORA_MODEL='mistral-small-latest';
  var AGORA_TEMPERATURE=3;
  var AGORA_MAX_TOKENS=1100;

  var AGORA_SYSTEM_PROMPT='';
  var AGORA_DOCS=[];
  var AGORA_INDEX_PROMISE=null;
  var AGORA_FILE_CACHE={};
  var AGORA_HISTORY=[];
  var AGORA_OPEN=false;

  var AGORA_STOPWORDS=['le','la','les','de','des','du','d','un','une','et','ou','au','aux','en','dans','sur','pour','par','avec','sans','que','qui','quoi','quel','quelle','quelles','quels','comment','quand','est','sont','a','ai','as','avoir','il','elle','on','nous','vous','ils','elles','ce','cet','cette','ces','mon','ma','mes','ton','ta','tes','son','sa','ses','notre','votre','leur','leurs','je','tu','me','te','se','ne','pas','plus','moins','ca','cela','ici','la','y','ou','dans','vers','ainsi','donc'];

  var AGORA_SYSTEM_PROMPT_FALLBACK=[
    'Tu es Agora, un assistant narratif et pédagogique intégré à PIX pHARe.',
    'Tu prends la voix de Kern, le compagnon de Lyam, sans quitter ton rôle d outil éducatif.',
    'Tu connais l univers de Valdurne, l histoire de Lyam, Kern, Réna et les repères pHARe à partir du contexte local récupéré dans ce projet.',
    'Ta mission : créer des histoires interactives courtes, crédibles et exigeantes, pour aider le joueur qui incarne Lyam à agir face à des situations d agression, d exclusion, de rumeur ou de harcèlement.',
    'Tu aides le joueur à observer, nommer, protéger, documenter, chercher de l aide, mobiliser les témoins et réfléchir à sa posture.',
    'Tu ne présentes jamais une invention comme un fait local. Si une information sur pHARe, le droit ou l Éducation nationale manque dans le contexte local, tu le dis clairement.',
    'Tu peux inventer des micro-situations, dialogues et embranchements uniquement s ils restent cohérents avec le contexte local récupéré et l univers de Valdurne.',
    'Tu ne glorifies jamais la violence, la vengeance, la mise à l écart ni l humiliation. Tu privilégies la sécurité, le soutien, l alerte juste, la réparation et la métacognition.'
  ].join('\n');

  var AGORA_APPENDIX=[
    '=== REGLES DE JEU AGORA ===',
    '- Réponds à partir du contexte local PIX pHARe / Valdurne récupéré ci-dessous.',
    '- Quand le joueur demande une aventure, propose une scène courte, vivante, puis 2 ou 3 options ou une question d action.',
    '- Quand le joueur choisit, fais avancer l histoire puis ajoute un bref débrief métacognitif : émotions, posture, sécurité, témoins, protocole, cadre.',
    '- Pour les points factuels sur pHARe, l Éducation nationale, les droits, les procédures ou le harcèlement, ne t appuie que sur le contexte local récupéré.',
    '- Si tu avances un point factuel important, termine par une ligne : Appuis locaux : ...',
    '- Réponse attendue : immersive mais concise, concrète, utile au joueur.'
  ].join('\n');

  var AGORA_REFERENCE_FILES=[
    {id:'PIXHARE_HUB',title:'Hub PIX pHARe',file:'index_PIXHARe.html',pillar:'PIX pHARe',tags:['pixhare','hub','modules','valdurne','harcelement','phare']},
    {id:'PIXHARE_CODE',title:'Code de l Éducation et climat scolaire',file:"Code de l'Éducation et Climat Scolaire.md",pillar:'Références éducatives',tags:['education nationale','code de l education','climat scolaire','droit','cadre','protection']},
    {id:'PIXHARE_CORPUS',title:'Corpus anti-harcèlement scolaire',file:'IA Éducative _ Corpus Anti-Harcèlement Scolaire.txt',pillar:'Références éducatives',tags:['harcelement','phare','cyberharcelement','temoins','victime','auteur']},
    {id:'VALDURNE_HUB',title:'Hub narration Valdurne',file:'hub_narration.html',pillar:'Univers Valdurne',tags:['valdurne','lyam','kern','rena','histoire']},
    {id:'VALDURNE_PREQUEL',title:'Préquelle de Lyam',file:'liam_eystieval_prequel.html',pillar:'Univers Valdurne',tags:['lyam','kern','rena','prequelle','histoire']},
    {id:'VALDURNE_RUISSEAU',title:'Lyam au ruisseau des collines',file:'liam_ruisseau_collines.html',pillar:'Univers Valdurne',tags:['lyam','valdurne','histoire','amitie']},
    {id:'VALDURNE_REMUS',title:'Chroniques de Remus',file:'remus_chroniques.html',pillar:'Univers Valdurne',tags:['remus','valdurne','histoire']},
    {id:'VALDURNE_VOYAGE_1',title:'Voyage vers Valdurne — chapitre 1',file:'valdurne_voyage_ch1.html',pillar:'Univers Valdurne',tags:['valdurne','voyage','lyam','kern','rena']},
    {id:'VALDURNE_VOYAGE_2',title:'Voyage vers Valdurne — chapitre 2',file:'valdurne_voyage_ch2.html',pillar:'Univers Valdurne',tags:['valdurne','voyage','lyam','kern','rena']},
    {id:'VALDURNE_CH6_MD',title:'Nuit cachée — version texte',file:'roman_ch06_nuit_cache_elevenlabs.md',pillar:'Univers Valdurne',tags:['valdurne','roman','lyam','kern','rena']},
    {id:'VALDURNE_CH7_MD',title:'Procès du couloir nord — version texte',file:'roman_ch07_proces_couloir_nord_elevenlabs.md',pillar:'Univers Valdurne',tags:['valdurne','proces','kern','juridique','couloir nord']},
    {id:'VALDURNE_CH8_MD',title:'Joute des savoirs — version texte',file:'roman_ch08_joute_savoirs_elevenlabs.md',pillar:'Univers Valdurne',tags:['valdurne','rena','neuro','arguments']},
    {id:'VALDURNE_CH9_MD',title:'Serments — version texte',file:'roman_ch09_serments_elevenlabs.md',pillar:'Univers Valdurne',tags:['valdurne','lyam','kern','serments']}
  ];

  var AGORA_STORY_FILES=['roman_ch01.html','roman_ch02.html','roman_ch03.html','roman_ch04.html','roman_ch05.html','roman_ch06.html','roman_ch07.html','roman_ch08.html','roman_ch09.html','roman_ch10.html'];

  function getEffectiveAgoraSystemPrompt(){
    var base=(AGORA_SYSTEM_PROMPT&&AGORA_SYSTEM_PROMPT.trim()?AGORA_SYSTEM_PROMPT:AGORA_SYSTEM_PROMPT_FALLBACK).trim();
    return base+'\n\n'+AGORA_APPENDIX;
  }

  async function loadAgoraSystemPrompt(){
    try{
      var res=await fetch('agora_system.txt',{cache:'no-store'});
      if(res.ok){
        AGORA_SYSTEM_PROMPT=await res.text();
        return;
      }
    }catch(e){}
    AGORA_SYSTEM_PROMPT=AGORA_SYSTEM_PROMPT_FALLBACK;
  }

  function normalizeAgoraText(s){
    return (s||'')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .toLowerCase()
      .replace(/œ/g,'oe')
      .replace(/æ/g,'ae')
      .replace(/[^a-z0-9\s\-]/g,' ')
      .replace(/\s+/g,' ')
      .trim();
  }

  function agoraTokens(s){
    return normalizeAgoraText(s).split(' ').filter(function(tok){
      return tok && tok.length>1 && AGORA_STOPWORDS.indexOf(tok)===-1;
    });
  }

  function clipAgoraText(s,maxLen){
    s=(s||'').replace(/\s+/g,' ').trim();
    if(!s)return '';
    return s.length<=maxLen?s:(s.slice(0,maxLen-1)+'…');
  }

  function humanizeAgoraPath(path){
    return (path||'')
      .replace(/\.[^.]+$/,'')
      .replace(/[_-]+/g,' ')
      .replace(/\s+/g,' ')
      .replace(/\(\d+\)/g,' ')
      .trim();
  }

  function decodeAgoraEscapes(s){
    return (s||'')
      .replace(/^["']|["']$/g,'')
      .replace(/\\u([0-9a-fA-F]{4})/g,function(_,h){return String.fromCharCode(parseInt(h,16));})
      .replace(/\\n/g,' ')
      .replace(/\\r/g,' ')
      .replace(/\\t/g,' ')
      .replace(/\\"/g,'"')
      .replace(/\\'/g,"'")
      .replace(/\\\\/g,'\\')
      .replace(/\s+/g,' ')
      .trim();
  }

  function sanitizeAgoraText(src){
    return (src||'')
      .replace(/\r/g,'\n')
      .replace(/https?:\/\/\S+/g,' ')
      .replace(/\n{3,}/g,'\n\n')
      .trim();
  }

  function extractAgoraTextFromMarkdown(src){
    return clipAgoraText(
      sanitizeAgoraText(src)
        .replace(/!\[[^\]]*\]\([^)]+\)/g,' ')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g,'$1')
        .replace(/^\s{0,3}#{1,6}\s*/gm,'')
        .replace(/^\s*>\s?/gm,'')
        .replace(/^\s*[-*+]\s+/gm,'')
        .replace(/^\s*\d+\.\s+/gm,'')
        .replace(/[*_`~|]/g,' ')
        .replace(/\s+\n/g,'\n')
        .replace(/\n{3,}/g,'\n\n')
        .trim(),
      14000
    );
  }

  function extractAgoraTextFromSource(src){
    var bits=[];
    var m;
    var clean=sanitizeAgoraText(src);
    var titleMatch=clean.match(/<title>([\s\S]*?)<\/title>/i);
    if(titleMatch&&titleMatch[1])bits.push(titleMatch[1].replace(/<[^>]+>/g,' ').trim());

    var fieldRe=/(?:ctx|q|label|text|fb|quote|subtitle|desc|intro|outro|title|name)\s*:\s*("([^"\\]|\\.)*"|'([^'\\]|\\.)*')/g;
    while((m=fieldRe.exec(clean))){
      var value=decodeAgoraEscapes(m[1]);
      if(value&&value.length>10)bits.push(value);
    }

    var paraRe=/<(?:p|li|h1|h2|h3|h4)[^>]*>([\s\S]*?)<\/(?:p|li|h1|h2|h3|h4)>/gi;
    while((m=paraRe.exec(clean))){
      var block=m[1].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
      if(block&&block.length>18)bits.push(block);
    }

    var uniq=[];
    var seen={};
    bits.forEach(function(item){
      var key=normalizeAgoraText(item).slice(0,220);
      if(!key||seen[key])return;
      seen[key]=true;
      uniq.push(item);
    });
    return clipAgoraText(uniq.join(' '),14000);
  }

  function extractAgoraTextForDoc(doc,src){
    if(doc&&doc.file&&/\.md$/i.test(doc.file))return extractAgoraTextFromMarkdown(src);
    if(doc&&doc.file&&/\.(txt|sql|json)$/i.test(doc.file)){
      return clipAgoraText(sanitizeAgoraText(src).replace(/[ \t]+/g,' '),14000);
    }
    return extractAgoraTextFromSource(src);
  }

  function splitAgoraPassages(text){
    var compact=(text||'').replace(/\r/g,'\n').replace(/\s+/g,' ').trim();
    if(!compact)return [];
    return (compact.match(/[^.!?\n]+[.!?]?/g)||[])
      .map(function(part){return part.trim();})
      .filter(function(part){return part.length>28;});
  }

  function extractRelevantAgoraSnippet(text,query,maxLen){
    var compact=(text||'').replace(/\s+/g,' ').trim();
    if(!compact)return '';
    if(compact.length<=maxLen)return compact;
    var parts=splitAgoraPassages(compact);
    var toks=agoraTokens(query);
    if(!parts.length||!toks.length)return clipAgoraText(compact,maxLen);
    var qNorm=normalizeAgoraText(query);
    var scored=parts.map(function(part,idx){
      var hay=normalizeAgoraText(part);
      var score=qNorm&&hay.indexOf(qNorm)!==-1?90:0;
      toks.forEach(function(tok){
        if(hay.indexOf(tok)!==-1)score+=Math.max(6,tok.length*2);
      });
      return {idx:idx,score:score};
    }).filter(function(item){return item.score>0;}).sort(function(a,b){return b.score-a.score;});
    if(!scored.length)return clipAgoraText(compact,maxLen);
    var center=scored[0].idx;
    var candidate=[center,center-1,center+1,center-2,center+2]
      .filter(function(idx,pos,self){return idx>=0&&idx<parts.length&&self.indexOf(idx)===pos;})
      .sort(function(a,b){return a-b;})
      .map(function(idx){return parts[idx];})
      .join(' ');
    return clipAgoraText(candidate||compact,maxLen);
  }

  function getAgoraStorageKey(){
    return 'pixhare_agora_chat_'+(getPlayer()||'anon');
  }

  function getAgoraUnlockState(){
    var player=getPlayer();
    var modulesTotal=PILLARS.reduce(function(sum,p){return sum+p.modules.length;},0);
    var modulesDone=doneCount();
    var protocolDone=typeof pvDone==='function'&&pvDone();
    return {
      player:player,
      connected:!!player,
      modulesDone:modulesDone,
      modulesTotal:modulesTotal,
      protocolDone:protocolDone,
      ready:!!player && modulesDone>=modulesTotal && protocolDone
    };
  }

  function buildAgoraStaticDocs(){
    var docs=[];
    var seen={};

    function pushDoc(doc){
      var key=(doc.id||'')+'::'+(doc.file||'');
      if(seen[key])return;
      seen[key]=true;
      doc.searchText=normalizeAgoraText([doc.id,doc.title,doc.pillar||'',doc.text||'',(doc.tags||[]).join(' ')].join(' '));
      docs.push(doc);
    }

    AGORA_REFERENCE_FILES.forEach(function(ref){
      pushDoc({
        kind:'reference',
        id:ref.id,
        title:ref.title,
        file:ref.file,
        pillar:ref.pillar,
        tags:ref.tags||[],
        text:(ref.title+' — '+(ref.tags||[]).join(' • ')).trim(),
        excerpt:ref.title
      });
    });

    AGORA_STORY_FILES.forEach(function(file){
      pushDoc({
        kind:'narrative',
        id:'STORY_'+file.replace(/[^A-Za-z0-9]+/g,'_'),
        title:'Univers Valdurne — '+humanizeAgoraPath(file),
        file:file,
        pillar:'Univers Valdurne',
        tags:['valdurne','lyam','kern','rena','roman','histoire'].concat(humanizeAgoraPath(file).split(/\s+/)),
        text:'Univers Valdurne — '+humanizeAgoraPath(file),
        excerpt:humanizeAgoraPath(file)
      });
    });

    PILLARS.forEach(function(pillar){
      pillar.modules.forEach(function(mod){
        pushDoc({
          kind:'module',
          id:'PIXHARE_'+mod.id,
          title:mod.id+' — '+mod.name,
          file:mod.file,
          pillar:pillar.title,
          tags:['pixhare','module',pillar.key,pillar.title].concat(mod.name.split(/\s+/)),
          text:pillar.title+' — '+pillar.desc+' — '+mod.name,
          excerpt:mod.id+' — '+mod.name
        });
      });
    });

    JDR_PILLARS.forEach(function(pillar){
      pillar.jdrs.forEach(function(jdr){
        if(!jdr.available)return;
        pushDoc({
          kind:'jdr',
          id:jdr.certKey,
          title:'JdR — '+jdr.title,
          file:jdr.file||'',
          pillar:pillar.name,
          tags:['valdurne','jdr',pillar.key,'lyam','kern','rena',jdr.title],
          text:pillar.name+' — '+jdr.title+' — '+(jdr.desc||''),
          excerpt:jdr.title+' — '+(jdr.desc||'')
        });
      });
    });

    if(typeof PROTOCOLE_VALDURNE!=='undefined'){
      pushDoc({
        kind:'protocol',
        id:PROTOCOLE_VALDURNE.id,
        title:'Protocole Valdurne — '+PROTOCOLE_VALDURNE.name,
        file:PROTOCOLE_VALDURNE.file,
        pillar:'Valdurne',
        tags:['protocole','valdurne','kern','lyam','rena','phare','cps'],
        text:'Protocole Valdurne — '+PROTOCOLE_VALDURNE.name,
        excerpt:PROTOCOLE_VALDURNE.name
      });
    }

    return docs;
  }

  async function fetchAgoraFile(file){
    if(!file)return '';
    if(Object.prototype.hasOwnProperty.call(AGORA_FILE_CACHE,file))return AGORA_FILE_CACHE[file];
    try{
      var res=await fetch(file,{cache:'no-store'});
      if(!res.ok)throw new Error('HTTP '+res.status);
      var txt=await res.text();
      AGORA_FILE_CACHE[file]=txt;
      return txt;
    }catch(e){
      AGORA_FILE_CACHE[file]='';
      return '';
    }
  }

  async function buildAgoraIndex(){
    if(AGORA_DOCS.length)return AGORA_DOCS;
    if(AGORA_INDEX_PROMISE)return AGORA_INDEX_PROMISE;
    AGORA_INDEX_PROMISE=(async function(){
      AGORA_DOCS=buildAgoraStaticDocs();
      await Promise.all(AGORA_DOCS.filter(function(doc){return !!doc.file;}).map(async function(doc){
        var src=await fetchAgoraFile(doc.file);
        if(!src)return;
        var extracted=extractAgoraTextForDoc(doc,src);
        if(extracted){
          doc.text=((doc.text||'')+' '+extracted).trim();
          doc.excerpt=clipAgoraText(extracted,1200);
          doc.searchText=normalizeAgoraText([doc.id,doc.title,doc.pillar||'',doc.text||'',(doc.tags||[]).join(' ')].join(' '));
        }
      }));
      return AGORA_DOCS;
    })();
    return AGORA_INDEX_PROMISE;
  }

  function scoreAgoraDoc(query,doc){
    var qNorm=normalizeAgoraText(query);
    var toks=agoraTokens(query);
    var hay=doc.searchText||'';
    var score=0;
    if(!hay)return score;
    if(qNorm&&hay.indexOf(qNorm)!==-1)score+=150;
    toks.forEach(function(tok){
      if(doc.id&&normalizeAgoraText(doc.id).indexOf(tok)!==-1)score+=38;
      if(doc.title&&normalizeAgoraText(doc.title).indexOf(tok)!==-1)score+=24;
      if(doc.pillar&&normalizeAgoraText(doc.pillar).indexOf(tok)!==-1)score+=14;
      if(hay.indexOf(tok)!==-1)score+=7;
    });
    if(/kern|lyam|rena|valdur/.test(qNorm)&&/kern|lyam|rena|valdur/.test(hay))score+=80;
    if(/harcelement|rumeur|exclusion|agression|temoin|victime|cps|metacognition/.test(qNorm)&&/harcelement|rumeur|exclusion|agression|temoin|victime|cps|metacognition/.test(hay))score+=60;
    if(/phare|protocole|education nationale|cadre|juridique|droit/.test(qNorm)&&/phare|protocole|education nationale|cadre|juridique|droit/.test(hay))score+=70;
    return score;
  }

  function buildAgoraContextBlock(query,docs){
    var state=getAgoraUnlockState();
    var lines=['=== CONTEXTE LOCAL PIX pHARe / VALDURNE ==='];
    lines.push('Joueur : '+(state.player||'non connecté'));
    lines.push('Progression modules : '+state.modulesDone+'/'+state.modulesTotal);
    lines.push('Protocole Valdurne terminé : '+(state.protocolDone?'oui':'non'));
    lines.push('');
    docs.forEach(function(doc,idx){
      lines.push('['+(idx+1)+'] '+doc.title);
      if(doc.pillar)lines.push('Pilier : '+doc.pillar);
      if(doc.file)lines.push('Fichier : '+doc.file);
      lines.push(extractRelevantAgoraSnippet(doc.text||doc.excerpt||'',query,900));
      lines.push('');
    });
    return lines.join('\n');
  }

  async function retrieveAgoraContext(query){
    var docs=await buildAgoraIndex();
    var scored=docs.map(function(doc){return {doc:doc,score:scoreAgoraDoc(query,doc)};})
      .filter(function(item){return item.score>0;})
      .sort(function(a,b){return b.score-a.score;});
    var chosen=scored.slice(0,6).map(function(item){return item.doc;});
    if(!chosen.length)chosen=docs.slice(0,4);
    return {
      docs:chosen,
      context:buildAgoraContextBlock(query,chosen),
      refs:chosen.map(function(doc){return doc.title;})
    };
  }

  function escapeAgoraHtml(text){
    return (text||'')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/\n/g,'<br>');
  }

  function formatAgoraTimestamp(ts){
    if(!ts)return '';
    try{
      var d=new Date(ts);
      if(isNaN(d.getTime()))return '';
      return d.toLocaleString('fr-FR');
    }catch(e){
      return '';
    }
  }

  function saveAgoraHistory(){
    try{
      localStorage.setItem(getAgoraStorageKey(),JSON.stringify(AGORA_HISTORY));
    }catch(e){}
  }

  function renderAgoraMessages(){
    var body=document.getElementById('agora-messages');
    if(!body)return;
    body.innerHTML='';
    AGORA_HISTORY.forEach(function(msg){
      var div=document.createElement('div');
      div.className='agora-msg '+(msg.role==='assistant'?'ai':'user');
      var name=msg.role==='assistant'?'Agora / Kern':(getPlayer()||'Joueur');
      var stamp=formatAgoraTimestamp(msg.ts);
      div.innerHTML='<span class="msg-name">'+name+(stamp?' · '+stamp:'')+'</span>'+escapeAgoraHtml(msg.content||'');
      body.appendChild(div);
    });
    body.scrollTop=body.scrollHeight;
  }

  function updateAgoraControls(){
    var state=getAgoraUnlockState();
    var toggle=document.getElementById('agora-toggle');
    var download=document.getElementById('agora-download');
    var clear=document.getElementById('agora-clear');
    var input=document.getElementById('agora-input');
    var send=document.getElementById('agora-send');
    if(toggle){
      toggle.disabled=!state.ready;
      toggle.textContent=state.ready?(AGORA_OPEN?'Fermer Agora':'Ouvrir Agora'):'Agora verrouillée';
    }
    if(download)download.disabled=!AGORA_HISTORY.length;
    if(clear)clear.disabled=!AGORA_HISTORY.length;
    if(input)input.disabled=!state.ready;
    if(send)send.disabled=!state.ready;
  }

  function ensureAgoraWelcome(){
    if(AGORA_HISTORY.length)return;
    AGORA_HISTORY.push({
      role:'assistant',
      content:'Je suis Agora. Je parle avec la voix de Kern, le compagnon de Lyam. Si tu veux, je peux te lancer une scène à Valdurne, te mettre face à une rumeur, une intimidation ou un conflit qui bascule vers le harcèlement, puis t aider à réfléchir à ta posture, à la sécurité et au protocole pHARe.',
      ts:new Date().toISOString()
    });
    saveAgoraHistory();
  }

  function loadAgoraHistory(){
    try{
      AGORA_HISTORY=JSON.parse(localStorage.getItem(getAgoraStorageKey())||'[]');
      if(!Array.isArray(AGORA_HISTORY))AGORA_HISTORY=[];
    }catch(e){
      AGORA_HISTORY=[];
    }
    renderAgoraMessages();
    updateAgoraControls();
  }

  function renderAgoraSection(){
    var state=getAgoraUnlockState();
    var section=document.getElementById('agora-section');
    var badge=document.getElementById('agora-badge');
    var copy=document.getElementById('agora-lock-copy');
    var pillModules=document.getElementById('agora-pill-modules');
    var pillProtocol=document.getElementById('agora-pill-protocol');
    var pillPlayer=document.getElementById('agora-pill-player');
    var panel=document.getElementById('agora-panel');
    if(!section||!badge||!copy||!pillModules||!pillProtocol||!pillPlayer||!panel)return;

    section.classList.toggle('ready',state.ready);
    section.classList.toggle('locked',!state.ready);

    badge.textContent=state.ready?'✅ Accès ouvert':'🔒 Accès verrouillé';
    copy.textContent=!state.connected
      ? 'Connecte d abord un joueur depuis le Portail Vie Scolaire. Agora s ouvrira ensuite quand les 30 modules PIX pHARe et le Protocole Valdurne seront validés.'
      : (state.ready
        ? 'Agora est éveillée. Tu peux demander une scène interactive, un entraînement à choix, ou un débrief métacognitif dans l univers de Valdurne.'
        : 'Agora se débloque quand ce joueur a validé les 30 modules PIX pHARe ainsi que le Protocole Valdurne.');

    pillModules.textContent='Modules : '+state.modulesDone+'/'+state.modulesTotal;
    pillModules.className='agora-pill '+(state.modulesDone>=state.modulesTotal?'ok':'warn');
    pillProtocol.textContent='Protocole : '+(state.protocolDone?'terminé':'à terminer');
    pillProtocol.className='agora-pill '+(state.protocolDone?'ok':'warn');
    pillPlayer.textContent='Joueur : '+(state.player||'non connecté');
    pillPlayer.className='agora-pill '+(state.connected?'ok':'warn');

    if(state.ready&&AGORA_OPEN){
      ensureAgoraWelcome();
      panel.classList.add('open');
      renderAgoraMessages();
    }else{
      panel.classList.remove('open');
    }
    updateAgoraControls();
  }

  window.toggleAgora=function(){
    var state=getAgoraUnlockState();
    if(!state.ready){
      toast('Agora se débloque après les 30 modules PIX pHARe et le Protocole Valdurne.');
      return;
    }
    AGORA_OPEN=!AGORA_OPEN;
    renderAgoraSection();
    if(AGORA_OPEN){
      var input=document.getElementById('agora-input');
      if(input)setTimeout(function(){input.focus();},80);
    }
  };

  function appendAgoraMessage(role,text){
    AGORA_HISTORY.push({role:role,content:text,ts:new Date().toISOString()});
    saveAgoraHistory();
    renderAgoraMessages();
    updateAgoraControls();
  }

  function setAgoraTyping(on,text){
    var body=document.getElementById('agora-messages');
    if(!body)return;
    var existing=document.getElementById('agora-typing');
    if(existing)existing.remove();
    if(!on)return;
    var div=document.createElement('div');
    div.id='agora-typing';
    div.className='agora-typing';
    div.textContent=text||'Agora consulte les archives de Valdurne…';
    body.appendChild(div);
    body.scrollTop=body.scrollHeight;
  }

  function formatAgoraExportText(){
    var state=getAgoraUnlockState();
    var lines=[
      'Conversation PIX pHARe — Agora',
      'Joueur : '+(state.player||'non connecté'),
      'Exporté le : '+new Date().toLocaleString('fr-FR'),
      ''
    ];
    AGORA_HISTORY.forEach(function(msg,idx){
      lines.push('['+(idx+1)+'] '+(msg.role==='assistant'?'Agora / Kern':(state.player||'Joueur'))+(msg.ts?' — '+formatAgoraTimestamp(msg.ts):''));
      lines.push(msg.content||'');
      lines.push('');
    });
    return lines.join('\r\n').trim();
  }

  window.downloadAgoraHistory=function(){
    if(!AGORA_HISTORY.length)return;
    var blob=new Blob([formatAgoraExportText()],{type:'text/plain;charset=utf-8'});
    var url=URL.createObjectURL(blob);
    var link=document.createElement('a');
    link.href=url;
    link.download='agora-'+(getPlayer()||'anon')+'-'+new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')+'.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function(){URL.revokeObjectURL(url);},500);
  };

  window.clearAgoraHistory=function(){
    if(!AGORA_HISTORY.length)return;
    if(!confirm('Effacer la conversation Agora enregistrée pour '+(getPlayer()||'ce joueur')+' ?'))return;
    AGORA_HISTORY=[];
    try{localStorage.removeItem(getAgoraStorageKey());}catch(e){}
    renderAgoraMessages();
    updateAgoraControls();
  };

  async function requestAgoraCompletion(messages){
    var attempts=[AGORA_TEMPERATURE];
    if(AGORA_TEMPERATURE>1.5)attempts.push(1.2);
    var lastError=null;

    for(var i=0;i<attempts.length;i++){
      var temp=attempts[i];
      var res=await fetch(AGORA_MISTRAL_URL,{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+AGORA_MISTRAL_KEY},
        body:JSON.stringify({
          model:AGORA_MODEL,
          messages:messages,
          temperature:temp,
          max_tokens:AGORA_MAX_TOKENS
        })
      });
      var data=await res.json().catch(function(){return {};});
      if(res.ok && data.choices && data.choices[0] && data.choices[0].message){
        if(temp!==AGORA_TEMPERATURE)toast('Mistral a refusé température 3 : repli automatique à 1.2.');
        return data.choices[0].message.content||'';
      }
      lastError=data;
      var errText=JSON.stringify(data||{}).toLowerCase();
      if(!(temp!==attempts[attempts.length-1] && /temperature/.test(errText)))break;
    }

    if(lastError&&lastError.error&&lastError.error.message)return 'Erreur API : '+lastError.error.message;
    if(lastError&&lastError.message)return 'Erreur API : '+lastError.message;
    return 'Erreur API : réponse indisponible.';
  }

  window.sendAgora=async function(){
    var state=getAgoraUnlockState();
    var input=document.getElementById('agora-input');
    var send=document.getElementById('agora-send');
    var text=(input&&input.value||'').trim();

    if(!state.ready){
      toast('Agora est encore verrouillée pour ce joueur.');
      return;
    }
    if(!text)return;

    input.value='';
    if(send)send.disabled=true;
    appendAgoraMessage('user',text);
    setAgoraTyping(true,'Agora consulte les archives PIX pHARe et les chroniques de Valdurne…');

    try{
      var ctx=await retrieveAgoraContext(text);
      var runtimeRules=[
        '=== GARDE-FOUS AGORA ===',
        '- Tu incarnes Kern dans un cadre narratif éducatif.',
        '- Tu réponds uniquement à la dernière demande utilisateur ; l historique récent sert de contexte.',
        '- Les éléments factuels sur pHARe, le harcèlement, les CPS, le protocole, l Éducation nationale et le canon de Valdurne doivent venir du contexte local récupéré.',
        '- Tu peux inventer une scène ou un dialogue seulement si cela reste cohérent avec ce contexte local.',
        '- Ton objectif pédagogique : faire réfléchir le joueur sur sa posture, la sécurité, les témoins, la réparation et la bonne chaîne d action.',
        '- Tu ne donnes pas toute la solution immédiatement : tu guides, tu questionnes, tu fais choisir, puis tu débriefes brièvement.'
      ].join('\n');

      var recentContext=AGORA_HISTORY
        .slice(Math.max(AGORA_HISTORY.length-7,0),Math.max(AGORA_HISTORY.length-1,0))
        .map(function(msg){
          return (msg.role==='assistant'?'Agora':'Joueur')+' : '+msg.content;
        })
        .join('\n');

      var systemContent=getEffectiveAgoraSystemPrompt()+'\n\n'+runtimeRules+'\n\n'+ctx.context;
      if(recentContext)systemContent+='\n\nHISTORIQUE RECENT (CONTEXTE UNIQUEMENT)\n'+recentContext;

      var reply=await requestAgoraCompletion([
        {role:'system',content:systemContent},
        {role:'user',content:text}
      ]);

      setAgoraTyping(false);
      appendAgoraMessage('assistant',reply||'Je n ai pas réussi à formuler de réponse. Réessaie avec une consigne plus précise.');
    }catch(e){
      setAgoraTyping(false);
      appendAgoraMessage('assistant','Je n arrive pas à joindre Mistral ou à relire les sources locales de PIX pHARe. Vérifie que les fichiers sont bien publiés dans ce dossier, puis réessaie.');
    }

    if(send)send.disabled=false;
    updateAgoraControls();
    if(input)input.focus();
  };

  function appendProtocolAdminControls(){
    if(!adminUnlocked)return;
    var list=document.getElementById('admin-mod-list');
    if(!list||list.querySelector('[data-agora-admin="protocol"]'))return;

    var sep=document.createElement('div');
    sep.className='psep';
    sep.textContent='⚖️ Protocole Valdurne';
    sep.setAttribute('data-agora-admin','protocol');
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

  var originalRender=render;
  render=function(){
    originalRender();
    renderAgoraSection();
  };

  var originalRenderValdurne=renderValdurne;
  renderValdurne=function(){
    originalRenderValdurne();
    renderAgoraSection();
  };

  var originalBuildAdminList=buildAdminList;
  buildAdminList=function(){
    originalBuildAdminList();
    appendProtocolAdminControls();
  };

  adminValidateSelected=function(){
    if(!adminUnlocked)return;
    var boxes=document.querySelectorAll('#admin-mod-list input[type=checkbox]');
    var count=0;

    boxes.forEach(function(chk){
      var val=chk.value;
      if(!chk.checked)return;

      if(val===PROTOCOLE_VALDURNE.certKey){
        if(!pvDone()){
          localStorage.setItem(val,JSON.stringify({v:1,d:new Date().toISOString(),m:val,f:true,admin:true,bestFin:4,xp:PROTOCOLE_VALDURNE.xp||150}));
          count++;
        }
        return;
      }

      if(val===PROTOCOLE_VALDURNE.metacogCert){
        if(!pvMetacogDone()){
          localStorage.setItem(val,JSON.stringify({v:1,d:new Date().toISOString(),m:val,f:true,admin:true}));
          count++;
        }
        return;
      }

      if(val.startsWith('CERT_JDR_') && !jdrIsDone(val)){
        localStorage.setItem(val,JSON.stringify({v:1,d:new Date().toISOString(),m:val,f:true,admin:true}));
        count++;
        return;
      }

      if(val.startsWith('CERT_METACOG_') && !jdrIsMetacogDone(val)){
        localStorage.setItem(val,JSON.stringify({v:1,d:new Date().toISOString(),m:val,f:true,admin:true}));
        count++;
        return;
      }

      if(!val.startsWith('CERT_JDR_') && !val.startsWith('CERT_METACOG_') && !isDone(val)){
        validateModule(val,true);
        count++;
      }
    });

    var fb=document.getElementById('admin-fb');
    if(count>0){
      fb.className='aok';
      fb.textContent='✅ '+count+' élément(s) validé(s)';
      buildAdminList();
      render();
      renderValdurne();
    }else{
      fb.className='aerr';
      fb.textContent='Aucun nouvel élément à valider';
    }
  };

  adminResetAll=function(){
    if(!adminUnlocked)return;
    if(!confirm('Supprimer TOUTE la progression PIXHARe du joueur actuel ?'))return;

    PILLARS.forEach(function(p){
      p.modules.forEach(function(m){localStorage.removeItem(ckey(m.id));});
    });

    JDR_PILLARS.forEach(function(jp){
      jp.jdrs.forEach(function(jdr){
        localStorage.removeItem(jdr.certKey);
        if(jdr.metacogCert)localStorage.removeItem(jdr.metacogCert);
        localStorage.removeItem('VALDURNE_LEGACY_'+jp.key+'_A1');
      });
    });

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
    if(!e.key || e.key.indexOf('CERT_')===0 || e.key==='pvs_current_player' || e.key==='pvs_phare_player'){
      loadAgoraHistory();
      renderAgoraSection();
    }
  });

  if(typeof PROTOCOLE_VALDURNE!=='undefined'){
    PROTOCOLE_VALDURNE.file='PROTOCOLE_VALDURNE_01 (1).html';
  }

  loadAgoraSystemPrompt()
    .then(function(){return buildAgoraIndex();})
    .catch(function(){return null;})
    .finally(function(){
      loadAgoraHistory();
      render();
      renderValdurne();
    });
})();

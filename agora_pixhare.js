(function(){
  var KERN_KEY='VIRuDMeF8Wz8DcdfEkW2BBvhD51jNCfg';
  var KERN_URL='https://api.mistral.ai/v1/chat/completions';
  var KERN_MODEL='mistral-small-latest';
  var KERN_TEMP=0.72;
  var KERN_SUPPORT_TEMP=0.28;
  var KERN_REFERENCE_TEMP=0.18;
  var KERN_ANALYSIS_TEMP=0.08;
  var KERN_PILLAR_HELP_TEMP=0.12;
  var KERN_PILLAR_SUMMARY_TEMP=0.08;
  var KERN_MAX_TOKENS=1100;
  var KERN_SUPPORT_MAX_TOKENS=950;
  var KERN_REFERENCE_MAX_TOKENS=900;
  var SUPABASE_URL='https://utgdfopnkplswxmiuyoi.supabase.co';
  var SUPABASE_PUBLISHABLE_KEY='sb_publishable_3JvqbxY4K2RmyJPH255Bzg_TYzpdsLr';
  var KERN_MANIFEST_FILE='kern_manifest.json';
  var KERN_SCENARIO_FILE='kern_scenarios.json';
  var PROMPT_FILES=['kern_system.txt','agora_system.txt'];
  var GITHUB_AUTO_INDEX_ENABLED=true;
  var GITHUB_MAX_AUTO_DOCS=180;

  var SYSTEM_PROMPT='';
  var DOCS=[];
  var INDEX_PROMISE=null;
  var SCENARIOS=[];
  var SCENARIO_PROMISE=null;
  var CACHE={};
  var HISTORY=[];
  var SCENARIO_STATE={history:[],counts:{},active:null};
  var PILLAR_FOCUS={key:'',mode:'coach'};
  var OPEN=false;
  var CONCERN={mode:'idle',draft:null,submission:null,message:''};
  var SUPA=null;
  var SUPA_STATE={ready:false,lastError:'',authMode:'none'};

  var STOPWORDS=['le','la','les','de','des','du','d','un','une','et','ou','au','aux','en','dans','sur','pour','par','avec','sans','que','qui','quoi','quel','quelle','quelles','quels','comment','quand','est','sont','a','ai','as','avoir','il','elle','on','nous','vous','ils','elles','ce','cet','cette','ces','mon','ma','mes','ton','ta','tes','son','sa','ses','notre','votre','leur','leurs','je','tu','me','te','se','ne','pas','plus','moins','ca','cela','ici','la','y','ou','vers'];
  var PROMPT_FALLBACK=[
    'Tu es Kern, compagnon narratif, civique et pédagogique de la plateforme Vie scolaire.',
    'Tu parles comme Kern, l allié de Lyam à Valdurne, mais tu restes rigoureusement compatible avec les attentes éducatives, institutionnelles et déontologiques des contenus locaux.',
    'Tu peux aider sur PIX pHARe, l histoire de Valdurne, la liberté, l égalité, la fraternité, l orientation, la sécurité routière, la citoyenneté, les délégués et d autres thématiques réellement présentes dans les fichiers du projet.',
    'Ta mission comporte quatre modes : répondre factuellement à partir des sources locales, animer des simulations fictionnelles sûres et formatrices, soutenir prudemment une situation réelle sans la transformer en jeu, ou aider sobrement à comprendre un pilier précis.',
    'Tu aides à observer, protéger, documenter, faire réfléchir, choisir une posture juste, mobiliser les bons relais et transmettre au bon adulte.',
    'Tu n inventes jamais un fait de protocole, de droit, d Éducation nationale, de santé mentale, de sécurité ou de canon local quand il manque dans les sources.',
    'Tu préfères la justesse institutionnelle, la clarté et la prudence à l effet dramatique.'
  ].join('\n');
  var PROMPT_APPENDIX=[
    '=== RÈGLES DE KERN ===',
    '- Appuie-toi sur le contexte local récupéré plus bas, issu de l ensemble de la plateforme Vie scolaire publiée.',
    '- Distingue quatre modes : référence, coach de pilier, fiction pédagogique, situation réelle.',
    '- En mode référence : réponds sobrement, au plus près des documents, avec une réserve institutionnelle claire.',
    '- En mode coach de pilier : reste à basse température, centré sur le pilier ciblé, avec résumés fiables, définitions nettes et mini vérifications.',
    '- En mode fiction : propose une scène courte, 2 ou 3 options maximum, puis un mini-débrief métacognitif et professionnel.',
    '- En mode fiction : ne pousse jamais vers la vengeance, la violence, l humiliation, la manipulation ou le secret face aux adultes.',
    '- En mode situation réelle : ne roleplay pas, ne scénarise pas, sécurise, qualifie l urgence et oriente.',
    '- Pour les points factuels, n utilise que le contexte local récupéré.',
    '- Si une information n est pas établie par les sources locales, dis-le franchement.',
    '- Si tu cites un appui factuel important, termine par une ligne : Appuis locaux : ...'
  ].join('\n');
  var REFS=[
    {id:'VIESCO_HOME',title:'Plateforme Vie scolaire',file:'index.html',pillar:'Plateforme Vie scolaire',tags:['vie scolaire','plateforme','hub','parcours','institution']},
    {id:'PIXHARE_HUB',title:'Hub PIX pHARe',file:'index_PIXHARe.html',pillar:'PIX pHARe',tags:['pixhare','hub','harcelement','phare','valdurne','cps']},
    {id:'LIBERTE_HUB',title:'Hub Liberté',file:'index_PIX_LIBERTE.html',pillar:'Liberté',tags:['liberte','citoyennete','droits','expression','laicite']},
    {id:'EGALITE_HUB',title:'Hub Égalité',file:'index_PIX_Egalite.html',pillar:'Égalité',tags:['egalite','filles garcons','stereotypes','discrimination']},
    {id:'FRATERNITE_HUB',title:'Hub Fraternité',file:'index_PIX_FRATERNITE.html',pillar:'Fraternité',tags:['fraternite','solidarite','entraide','vivre ensemble']},
    {id:'DELEGUES_HUB',title:'Hub Délégués',file:'index_PIX_DELEGUES.html',pillar:'Citoyenneté',tags:['delegues','cvc','cvl','representation','parole eleve']},
    {id:'PSC1_HUB',title:'Hub PSC1 et sécurité',file:'index_PSC1.html',pillar:'Secours & sécurité',tags:['psc1','secours','securite routiere','protection']},
    {id:'VALDURNE_HUB',title:'Hub narration Valdurne',file:'hub_narration.html',pillar:'Univers Valdurne',tags:['valdurne','lyam','kern','rena','histoire']},
    {id:'VIDEOS_HUB',title:'Hub vidéos et ressources',file:'hub_videos.html',pillar:'Ressources',tags:['videos','ressources','plateforme']},
    {id:'FONTAINEBLEAU_HUB',title:'Hub Fontainebleau',file:'hub_fontainebleau.html',pillar:'Univers narratif',tags:['fontainebleau','recits','valeurs']},
    {id:'CHEVALIERS_JUSTICE',title:'Chevaliers de Justice',file:'Chevaliers_Justice.html',pillar:'Univers narratif',tags:['justice','citoyennete','engagement','fraternite']}
  ];
  var STORY_FILES=['roman_ch01.html','roman_ch02.html','roman_ch03.html','roman_ch04.html','roman_ch05.html','roman_ch06.html','roman_ch07.html','roman_ch08.html','roman_ch09.html','roman_ch10.html'];

  function prompt(){return (SYSTEM_PROMPT&&SYSTEM_PROMPT.trim()?SYSTEM_PROMPT:PROMPT_FALLBACK).trim()+'\n\n'+PROMPT_APPENDIX;}
  async function loadPrompt(){
    for(var i=0;i<PROMPT_FILES.length;i++){
      try{
        var res=await fetch(PROMPT_FILES[i],{cache:'no-store'});
        if(res.ok){SYSTEM_PROMPT=await res.text();return;}
      }catch(e){}
    }
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
  function uniq(arr){var out=[],seen={};(arr||[]).forEach(function(item){var key=norm(item);if(!item||seen[key])return;seen[key]=true;out.push(item);});return out;}
  function docKey(doc){return ((doc&&doc.file)||'')+'::'+((doc&&doc.id)||'');}
  function refreshDoc(doc){doc.search=norm([doc.id,doc.title,doc.pillar||'',doc.text||'',(doc.tags||[]).join(' ')].join(' '));return doc;}
  function registerDoc(out,seen,doc){
    var key=docKey(doc);
    if(!doc||seen[key])return;
    seen[key]=true;
    refreshDoc(doc);
    out.push(doc);
  }
  function shouldExcludeProjectPath(file){
    var rel=(file||'').replace(/\\/g,'/');
    return /(^|\/)(__pycache__|vendor|adciv|game|MAJ VieSco|Nouveau dossier|Projet PIX_Like pHARe|Projet PIX_Like PSC1)(\/|$)/i.test(rel)||/(^|\/)(index\.old\.html|index \(5\)\.html|agora_system\.txt|kern_system\.txt|agora_pixhare\.js|students\.csv|adults\.csv|parents\.csv|temoins_adultes_80_lignes\.csv|grilles codes élèves\.csv)$/i.test(rel);
  }
  function isDiscoverableTextFile(file){
    return !!file&&!shouldExcludeProjectPath(file)&&/\.(html?|md|txt|json)$/i.test(file);
  }
  function inferProjectTags(file){
    var src=norm((file||'')+' '+humanize(file)), tags=[];
    function add(){tags=tags.concat([].slice.call(arguments));}
    if(/pix phare|pix ph are|phare|harcelement|groupe|neuro|numerique|juridique|cps|temoin|victime/.test(src))add('pixhare','phare','harcelement','cps');
    if(/vea|vivre ensemble|bien etre|emotion|emotions|assertivite|cohesion|prosocial|empathie/.test(src))add('vea','vivre ensemble','bien etre','cps');
    if(/valdur|lyam|kern|rena|remus|roman|narration|agora|chronique/.test(src))add('valdurne','lyam','kern','rena','narration');
    if(/liberte|lib /.test(src))add('liberte','droits','citoyennete');
    if(/egalite|egalite|discrimination|stereotype|filles garcons/.test(src))add('egalite','discrimination','respect');
    if(/fraternite|fra /.test(src))add('fraternite','solidarite','entraide','vivre ensemble');
    if(/delegu|cvc|cvl|parole eleve|justice/.test(src))add('delegues','citoyennete','parole');
    if(/psc1|secours|securite routiere|route|velo|accident|premiers secours/.test(src))add('psc1','secours','securite routiere','protection');
    if(/orientation|avenir|metier|parcours/.test(src))add('orientation','parcours');
    if(/fontainebleau/.test(src))add('fontainebleau','recit');
    return uniq(tags);
  }
  function inferProjectPillar(file,tags){
    var src=norm((file||'')+' '+(tags||[]).join(' '));
    if(/pixhare|phare|harcelement/.test(src))return 'PIX pHARe';
    if(/liberte/.test(src))return 'Liberté';
    if(/egalite/.test(src))return 'Égalité';
    if(/fraternite/.test(src))return 'Fraternité';
    if(/psc1|secours|securite routiere/.test(src))return 'Secours & sécurité';
    if(/orientation|parcours/.test(src))return 'Orientation';
    if(/delegues|citoyennete|justice|parole/.test(src))return 'Citoyenneté';
    if(/valdurne|lyam|kern|rena|fontainebleau|narration/.test(src))return 'Univers Valdurne';
    return 'Plateforme Vie scolaire';
  }
  async function fetchManifestFiles(){
    try{
      var res=await fetch(KERN_MANIFEST_FILE,{cache:'no-store'});
      if(!res.ok)throw new Error('HTTP '+res.status);
      var data=await res.json();
      return Array.isArray(data)?data.filter(isDiscoverableTextFile):[];
    }catch(e){
      return [];
    }
  }
  async function buildProjectDocs(existingDocs){
    var existing={}, out=[], seen={};
    (existingDocs||[]).forEach(function(doc){if(doc&&doc.file)existing[norm(doc.file)]=true;});
    var manifestFiles=await fetchManifestFiles();
    manifestFiles.slice(0,GITHUB_MAX_AUTO_DOCS).forEach(function(file){
      if(existing[norm(file)])return;
      var title=humanize(file), tags=inferProjectTags(file);
      registerDoc(out,seen,{kind:'project',id:'DOC_'+file.replace(/[^A-Za-z0-9]+/g,'_'),title:title,file:file,pillar:inferProjectPillar(file,tags),tags:tags,text:title+' '+tags.join(' '),excerpt:title});
    });
    return out;
  }
  function normalizeScenario(raw){
    raw=raw&&typeof raw==='object'?raw:{};
    return {
      id:String(raw.id||('scenario_'+Date.now())).replace(/[^A-Za-z0-9_-]+/g,'_'),
      title:clip(String(raw.title||'Scénario Kern'),140),
      category:clip(String(raw.category||'Simulation CPS'),120),
      complexity:toInt(raw.complexity,1,1,5),
      tags:Array.isArray(raw.tags)?uniq(raw.tags.map(String)):[],
      summary:clip(String(raw.summary||''),320),
      cast:Array.isArray(raw.cast)?raw.cast.map(String).slice(0,8):[],
      opening:clip(String(raw.opening||''),700),
      mustNotice:Array.isArray(raw.mustNotice)?raw.mustNotice.map(String).slice(0,8):[],
      cpsTargets:Array.isArray(raw.cpsTargets)?raw.cpsTargets.map(String).slice(0,8):[],
      goodMoves:Array.isArray(raw.goodMoves)?raw.goodMoves.map(String).slice(0,8):[],
      badMoves:Array.isArray(raw.badMoves)?raw.badMoves.map(String).slice(0,8):[],
      adultRelay:clip(String(raw.adultRelay||''),220),
      options:Array.isArray(raw.options)?raw.options.map(String).slice(0,4):[],
      debrief:Array.isArray(raw.debrief)?raw.debrief.map(String).slice(0,8):[],
      sourceHints:Array.isArray(raw.sourceHints)?uniq(raw.sourceHints.map(String)).slice(0,10):[]
    };
  }
  async function loadScenarioLibrary(){
    if(SCENARIOS.length)return SCENARIOS;
    if(SCENARIO_PROMISE)return SCENARIO_PROMISE;
    SCENARIO_PROMISE=(async function(){
      try{
        var res=await fetch(KERN_SCENARIO_FILE,{cache:'no-store'});
        if(!res.ok)throw new Error('HTTP '+res.status);
        var data=await res.json();
        SCENARIOS=Array.isArray(data)?data.map(normalizeScenario).filter(function(sc){return !!sc.id;}):[];
      }catch(e){
        SCENARIOS=[];
      }
      return SCENARIOS;
    })();
    return SCENARIO_PROMISE;
  }
  function scenarioById(id){
    if(!id)return null;
    for(var i=0;i<SCENARIOS.length;i++){if(SCENARIOS[i]&&SCENARIOS[i].id===id)return SCENARIOS[i];}
    return null;
  }
  function scenarioHistoryCount(){
    return Array.isArray(SCENARIO_STATE.history)?SCENARIO_STATE.history.length:0;
  }
  function scenarioDepthTarget(text){
    var s=norm(text), played=scenarioHistoryCount(), depth=1;
    if(played>=1)depth=2;
    if(played>=4)depth=3;
    if(played>=9)depth=4;
    if(played>=15)depth=5;
    if(/debut|début|simple|facile|doucement|initiation/.test(s))depth=1;
    if(/intermediaire|intermédiaire|nuance|un peu plus/.test(s))depth=Math.max(depth,3);
    if(/complexe|avance|avancé|difficile|ambigu|melange|mélange|cascade/.test(s))depth=Math.max(depth,4);
    return Math.max(1,Math.min(5,depth));
  }
  function recentScenarioIds(limit){
    var history=Array.isArray(SCENARIO_STATE.history)?SCENARIO_STATE.history:[];
    return history.slice(Math.max(history.length-(limit||3),0)).map(function(item){return item&&item.id;}).filter(Boolean);
  }
  function scenarioQueryTags(text){
    var s=norm(text), tags=[];
    function add(){tags=tags.concat([].slice.call(arguments));}
    if(/harcelement|rumeur|exclusion|cyber|temoin|victime|detresse|angoisse|mal etre|mal etre/.test(s))add('harcelement','cps','protection');
    if(/vea|vivre ensemble|bien etre|emotion|emotions|empathie|assertivite|cohesion|prosocial/.test(s))add('vea','vivre ensemble','cps');
    if(/liberte|laicite|expression/.test(s))add('liberte','citoyennete');
    if(/egalite|discrimination|sexisme|stereotype/.test(s))add('egalite','respect');
    if(/fraternite|solidarite|entraide|nouveau/.test(s))add('fraternite','entraide');
    if(/delegue|conseil|parole|cvc|cvl/.test(s))add('delegues','parole');
    if(/orientation|avenir|metier|stage/.test(s))add('orientation','parcours');
    if(/securite routiere|route|velo|trottinette|casque/.test(s))add('securite routiere','protection');
    if(/psc1|secours|malaise|saigne|blessure|accident/.test(s))add('psc1','secours');
    if(/valdur|lyam|kern|rena|remus/.test(s))add('valdurne','lyam','kern');
    return uniq(tags.concat(toks(text)));
  }
  function scenarioScore(text,scenario){
    var q=norm([text,scenario.title,scenario.category].join(' '));
    var bag=norm([
      scenario.title,
      scenario.category,
      scenario.summary,
      scenario.opening,
      (scenario.tags||[]).join(' '),
      (scenario.mustNotice||[]).join(' '),
      (scenario.cpsTargets||[]).join(' '),
      (scenario.sourceHints||[]).join(' ')
    ].join(' '));
    var score=0, desired=scenarioDepthTarget(text), used=(SCENARIO_STATE.counts&&SCENARIO_STATE.counts[scenario.id])||0;
    scenarioQueryTags(text).forEach(function(tag){if(tag&&bag.indexOf(norm(tag))!==-1)score+=14;});
    if(q&&bag.indexOf(q)!==-1)score+=50;
    score+=Math.max(0,28-(Math.abs((scenario.complexity||1)-desired)*9));
    score+=Math.max(0,20-(used*5));
    if(recentScenarioIds(3).indexOf(scenario.id)!==-1)score-=24;
    if(/nouveau|autre|surprends|change/.test(norm(text))&&used===0)score+=20;
    if(/complexe|avance|avancé|ambigu|melange|mélange/.test(norm(text))&&(scenario.complexity||1)>=4)score+=16;
    if(/simple|facile|doucement|initiation/.test(norm(text))&&(scenario.complexity||1)<=2)score+=16;
    return score;
  }
  function wantsFreshScenario(text){
    var s=norm(text);
    return looksFictionRequest(text)||/nouveau scenario|autre scenario|change de scenario|changeons de scenario|encore un scenario|lance un scenario|joue un scenario|fais moi jouer/.test(s);
  }
  function looksScenarioContinuation(text){
    if(!SCENARIO_STATE.active)return false;
    var s=norm(text);
    if(looksReal(text))return false;
    if(/^(je veux|je voudrais|j aimerais|j'aimerais|explique|explique moi|explique-moi|dis moi|dis-moi|peux tu|peux-tu|c est quoi|qu est ce que|quest ce que)/.test(s))return false;
    if(looksFictionRequest(text))return true;
    if(/^(1|2|3|option 1|option 2|option 3)$/.test(s))return true;
    if(/^(je|j|alors|ensuite|d abord|d'abord|ok|oui|non|je choisis|je parle|je vais|j appelle|j'appelle|je demande|je dis|je note|je reste|je propose|je respire|je regarde|je m approche|je m'approche)/.test(s))return true;
    return false;
  }
  function rememberScenario(scenario){
    if(!scenario||!scenario.id)return;
    if(!SCENARIO_STATE.counts||typeof SCENARIO_STATE.counts!=='object')SCENARIO_STATE.counts={};
    if(!Array.isArray(SCENARIO_STATE.history))SCENARIO_STATE.history=[];
    SCENARIO_STATE.counts[scenario.id]=(SCENARIO_STATE.counts[scenario.id]||0)+1;
    SCENARIO_STATE.history.push({id:scenario.id,ts:new Date().toISOString(),complexity:scenario.complexity||1,title:scenario.title});
    SCENARIO_STATE.active={id:scenario.id,ts:new Date().toISOString(),title:scenario.title,complexity:scenario.complexity||1};
    saveScenarioState();
  }
  function clearActiveScenario(){SCENARIO_STATE.active=null;saveScenarioState();}
  function pickScenario(text){
    if(!SCENARIOS.length)return null;
    var active=scenarioById(SCENARIO_STATE.active&&SCENARIO_STATE.active.id);
    if(active&&!wantsFreshScenario(text)&&looksScenarioContinuation(text))return {scenario:active,isNew:false};
    var desired=scenarioDepthTarget(text);
    var ranked=SCENARIOS.slice().sort(function(a,b){return scenarioScore(text,b)-scenarioScore(text,a);});
    var chosen=ranked.find(function(sc){return sc.complexity<=Math.min(5,desired+1);})||ranked[0]||null;
    if(!chosen)return null;
    rememberScenario(chosen);
    return {scenario:chosen,isNew:true};
  }
  function scenarioPromptBlock(bundle){
    if(!bundle||!bundle.scenario)return '';
    var sc=bundle.scenario, lines=['=== DOSSIER DE SCÉNARIO KERN ===','Scénario : '+sc.title,'Catégorie : '+sc.category,'Complexité : '+String(sc.complexity||1)+'/5'];
    if(sc.summary)lines.push('Résumé : '+sc.summary);
    if(sc.cast&&sc.cast.length)lines.push('Personnages : '+sc.cast.join(', '));
    if(sc.mustNotice&&sc.mustNotice.length)lines.push('Points à faire repérer : '+sc.mustNotice.join(' ; '));
    if(sc.cpsTargets&&sc.cpsTargets.length)lines.push('Compétences psychosociales visées : '+sc.cpsTargets.join(' ; '));
    if(sc.goodMoves&&sc.goodMoves.length)lines.push('Bons mouvements attendus : '+sc.goodMoves.join(' ; '));
    if(sc.badMoves&&sc.badMoves.length)lines.push('Mauvais rails à éviter : '+sc.badMoves.join(' ; '));
    if(sc.adultRelay)lines.push('Relais adulte ou cadre à rappeler si nécessaire : '+sc.adultRelay);
    if(sc.sourceHints&&sc.sourceHints.length)lines.push('Appuis documentaires prioritaires : '+sc.sourceHints.join(' ; '));
    lines.push(bundle.isNew?'- Démarre ce scénario maintenant, sans dévoiler tout le rail caché au joueur.':'- Continue ce scénario sans en changer brutalement.');
    if(bundle.isNew&&sc.opening)lines.push('Ouverture suggérée : '+sc.opening);
    if(bundle.isNew&&sc.options&&sc.options.length)lines.push('Premières options possibles : '+sc.options.slice(0,3).join(' | '));
    if(sc.debrief&&sc.debrief.length)lines.push('Axes de débrief : '+sc.debrief.join(' ; '));
    return lines.join('\n');
  }
  function oldKey(){return 'pixhare_agora_chat_'+(getPlayer()||'anon');}
  function newKey(){return 'pixhare_kern_chat_'+(getPlayer()||'anon');}
  function scenarioKey(){return 'pixhare_kern_scenarios_'+(getPlayer()||'anon');}
  function migrateHistory(){try{if(!localStorage.getItem(newKey())){var legacy=localStorage.getItem(oldKey());if(legacy)localStorage.setItem(newKey(),legacy);}}catch(e){}}
  function latest(role){for(var i=HISTORY.length-1;i>=0;i--){if(HISTORY[i]&&HISTORY[i].role===role)return HISTORY[i];}return null;}
  function state(){var player=getPlayer();var total=PILLARS.reduce(function(sum,p){return sum+p.modules.length;},0);var done=doneCount();var protocol=typeof pvDone==='function'&&pvDone();return {player:player,connected:!!player,modulesDone:done,modulesTotal:total,protocolDone:protocol,ready:!!player&&done>=total&&protocol};}
  function pillarByKey(key){
    var target=norm(key||'');
    for(var i=0;i<PILLARS.length;i++){
      if(PILLARS[i]&&(norm(PILLARS[i].key)===target||norm(PILLARS[i].title)===target))return PILLARS[i];
    }
    return null;
  }
  function activePillarFocus(){
    if(!PILLAR_FOCUS||!PILLAR_FOCUS.key||!getPlayer())return null;
    var pillar=pillarByKey(PILLAR_FOCUS.key);
    if(!pillar)return null;
    return {
      key:pillar.key,
      title:pillar.title,
      desc:pillar.desc,
      mode:PILLAR_FOCUS.mode==='summary'?'summary':'coach',
      pillar:pillar,
      moduleIds:pillar.modules.map(function(mod){return mod.id;}),
      moduleNames:pillar.modules.map(function(mod){return mod.name;})
    };
  }
  function setPillarFocus(key,mode){
    var pillar=pillarByKey(key);
    if(!pillar)return null;
    PILLAR_FOCUS={key:pillar.key,mode:mode==='summary'?'summary':'coach'};
    return activePillarFocus();
  }
  function clearPillarFocus(){PILLAR_FOCUS={key:'',mode:'coach'};}
  function canUseKern(){var st=state();return st.ready||!!activePillarFocus();}
  function buildPillarPromptBlock(focus){
    if(!focus)return '';
    var lines=[
      '=== DOSSIER PILIER KERN ===',
      'Pilier : '+focus.title,
      'Description : '+focus.desc,
      'Modules : '+focus.moduleIds.map(function(id,idx){return id+' — '+focus.moduleNames[idx];}).join(' | ')
    ];
    if(focus.mode==='summary'){
      lines.push('- But : produire un résumé de révision très fidèle, net et utile de ce pilier.');
    }else{
      lines.push('- But : agir comme un coach de compréhension à basse température sur ce pilier uniquement.');
    }
    lines.push('- Priorité absolue à ce pilier. Les autres contenus ne servent qu à éclairer directement ce bloc.');
    lines.push('- Si le joueur veut revenir au mode général, invite-le à écrire "mode normal".');
    return lines.join('\n');
  }
  function isPillarFocusExitRequest(text){
    return /\b(mode normal|retour mode normal|quitte le pilier|sort du pilier|mode general|mode generaliste)\b/.test(norm(text||''));
  }
  function addPillarFocusIntro(focus){
    if(!focus)return;
    var intro='Mode aide Kern activé sur "'+focus.title+'". Ici je reste volontairement sobre et centré sur ce pilier pour t aider à comprendre, reformuler et mémoriser les repères essentiels. Si tu veux revenir au mode général, écris "mode normal".';
    var last=latest('assistant');
    if(last&&last.content===intro)return;
    pushMessage('assistant',intro);
  }
  function blankScenarioState(){return {history:[],counts:{},active:null};}
  function saveScenarioState(){try{localStorage.setItem(scenarioKey(),JSON.stringify(SCENARIO_STATE));}catch(e){}}
  function loadScenarioState(){
    try{
      var parsed=JSON.parse(localStorage.getItem(scenarioKey())||'null');
      if(!parsed||typeof parsed!=='object')parsed=blankScenarioState();
      if(!Array.isArray(parsed.history))parsed.history=[];
      if(!parsed.counts||typeof parsed.counts!=='object')parsed.counts={};
      if(parsed.active&&typeof parsed.active!=='object')parsed.active=null;
      SCENARIO_STATE=parsed;
    }catch(e){
      SCENARIO_STATE=blankScenarioState();
    }
  }

  function buildDocs(){
    var out=[],seen={};
    REFS.forEach(function(ref){registerDoc(out,seen,{kind:'ref',id:ref.id,title:ref.title,file:ref.file,pillar:ref.pillar,tags:ref.tags||[],text:(ref.title+' '+(ref.tags||[]).join(' ')).trim(),excerpt:ref.title});});
    STORY_FILES.forEach(function(file){registerDoc(out,seen,{kind:'story',id:'STORY_'+file.replace(/[^A-Za-z0-9]+/g,'_'),title:'Univers Valdurne — '+humanize(file),file:file,pillar:'Univers Valdurne',tags:['valdurne','lyam','kern','rena','roman'],text:'Univers Valdurne — '+humanize(file),excerpt:humanize(file)});});
    PILLARS.forEach(function(p){p.modules.forEach(function(m){registerDoc(out,seen,{kind:'module',id:'PIXHARE_'+m.id,title:m.id+' — '+m.name,file:m.file,pillar:p.title,tags:['pixhare','module',p.key,p.title].concat(m.name.split(/\s+/)),text:p.title+' — '+p.desc+' — '+m.name,excerpt:m.id+' — '+m.name});});});
    if(typeof PROTOCOLE_VALDURNE!=='undefined'){registerDoc(out,seen,{kind:'protocol',id:PROTOCOLE_VALDURNE.id,title:'Protocole Valdurne — '+PROTOCOLE_VALDURNE.name,file:PROTOCOLE_VALDURNE.file,pillar:'Valdurne',tags:['protocole','valdurne','kern','lyam','rena','phare','cps'],text:'Protocole Valdurne — '+PROTOCOLE_VALDURNE.name,excerpt:PROTOCOLE_VALDURNE.name});}
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
      var projectDocs=await buildProjectDocs(DOCS);
      if(projectDocs.length)DOCS=DOCS.concat(projectDocs);
      await Promise.all(DOCS.filter(function(doc){return !!doc.file;}).map(async function(doc){
        var src=await fetchText(doc.file);
        if(!src)return;
        var extracted=extractText(doc,src);
        if(extracted){
          doc.text=((doc.text||'')+' '+extracted).trim();
          doc.excerpt=clip(extracted,1200);
          refreshDoc(doc);
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
    if(/harcelement|rumeur|exclusion|agression|temoin|victime|cps|metacognition|mal etre|angoisse|anxiete|depression/.test(q)&&/harcelement|rumeur|exclusion|agression|temoin|victime|cps|metacognition|mal etre|angoisse|anxiete|depression/.test(hay))s+=55;
    if(/vea|vivre ensemble|bien etre|emotion|empathie|assertivite|cohesion|prosocial/.test(q)&&/vea|vivre ensemble|bien etre|emotion|empathie|assertivite|cohesion|prosocial/.test(hay))s+=60;
    if(/phare|protocole|education nationale|cadre|juridique|droit/.test(q)&&/phare|protocole|education nationale|cadre|juridique|droit/.test(hay))s+=65;
    if(/liberte|egalite|fraternite|laicite|citoyennete|delegue|cvc|cvl|respect|discrimination/.test(q)&&/liberte|egalite|fraternite|laicite|citoyennete|delegue|cvc|cvl|respect|discrimination/.test(hay))s+=68;
    if(/orientation|parcours|metier|avenir/.test(q)&&/orientation|parcours|metier|avenir/.test(hay))s+=60;
    if(/psc1|secours|securite routiere|route|velo|accident|premiers secours/.test(q)&&/psc1|secours|securite routiere|route|velo|accident|premiers secours/.test(hay))s+=64;
    if(/fontainebleau|chevalier|justice/.test(q)&&/fontainebleau|chevalier|justice/.test(hay))s+=52;
    if(doc.kind==='protocol'&&/protocole|valdurne|phare/.test(q))s+=24;
    if(doc.kind==='module'&&/module|pilier|competence|compétence|cps/.test(q))s+=15;
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
    var chosen=docs.map(function(doc){return {doc:doc,score:score(query,doc)};}).filter(function(x){return x.score>0;}).sort(function(a,b){return b.score-a.score;}).slice(0,7).map(function(x){return x.doc;});
    if(!chosen.length)chosen=docs.slice(0,4);
    var st=state(), lines=['=== CONTEXTE LOCAL PLATEFORME VIE SCOLAIRE / PIX pHARe / VALDURNE ===','Joueur : '+(st.player||'non connecté'),'Progression modules PIX pHARe : '+st.modulesDone+'/'+st.modulesTotal,'Protocole Valdurne terminé : '+(st.protocolDone?'oui':'non'),''];
    chosen.forEach(function(doc,idx){lines.push('['+(idx+1)+'] '+doc.title);if(doc.pillar)lines.push('Pilier : '+doc.pillar);if(doc.file)lines.push('Fichier : '+doc.file);lines.push(snippet(doc.text||doc.excerpt||'',query,900));lines.push('');});
    return {docs:chosen,context:lines.join('\n')};
  }

  function saveHistory(){try{localStorage.setItem(newKey(),JSON.stringify(HISTORY));}catch(e){}}
  function loadHistory(){migrateHistory();loadScenarioState();try{HISTORY=JSON.parse(localStorage.getItem(newKey())||'[]');if(!Array.isArray(HISTORY))HISTORY=[];}catch(e){HISTORY=[];}renderMessages();updateControls();}
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
    var focus=activePillarFocus();
    var usable=canUseKern();
    var toggle=document.getElementById('agora-toggle');
    var download=document.getElementById('agora-download');
    var clear=document.getElementById('agora-clear');
    var report=document.getElementById('agora-report');
    var input=document.getElementById('agora-input');
    var send=document.getElementById('agora-send');
    if(toggle){
      toggle.disabled=!usable;
      toggle.textContent=focus&&!st.ready?(OPEN?'Fermer le coach':'Ouvrir le coach'):(usable?(OPEN?'Fermer Kern':'Ouvrir Kern'):'Kern verrouillé');
    }
    if(download)download.disabled=!HISTORY.length;
    if(clear)clear.disabled=!HISTORY.length;
    if(report)report.disabled=!st.connected || !latest('user');
    if(input)input.disabled=!usable;
    if(send)send.disabled=!usable;
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
    var focus=activePillarFocus();
    var usable=canUseKern();
    var section=document.getElementById('agora-section');
    var badge=document.getElementById('agora-badge');
    var copy=document.getElementById('agora-lock-copy');
    var pillModules=document.getElementById('agora-pill-modules');
    var pillProtocol=document.getElementById('agora-pill-protocol');
    var pillPlayer=document.getElementById('agora-pill-player');
    var panel=document.getElementById('agora-panel');
    if(!section||!badge||!copy||!pillModules||!pillProtocol||!pillPlayer||!panel)return;
    section.classList.toggle('ready',usable);
    section.classList.toggle('locked',!usable);
    badge.textContent=focus&&!st.ready?'📘 Coach de pilier actif':(st.ready?'✅ Accès ouvert':'🔒 Accès verrouillé');
    copy.textContent=!st.connected?'Connecte d abord un joueur depuis le Portail Vie Scolaire. Kern s ouvrira ensuite quand les '+st.modulesTotal+' modules PIX pHARe et le Protocole Valdurne seront validés.':(focus&&!st.ready?'Le mode coach de pilier est actif sur "'+focus.title+'". Ici, Kern reste très cadré, factuel et centré sur la compréhension du contenu enseigné dans ce pilier.':(st.ready?'Kern est disponible. Tu peux lui demander une scène interactive, un entraînement à choix, ou un appui prudent sur une situation réelle.':'Kern se débloque quand ce joueur a validé les '+st.modulesTotal+' modules PIX pHARe ainsi que le Protocole Valdurne. Entre-temps, les boutons sous chaque pilier ouvrent un coach Kern ciblé et plus sobre.'));
    pillModules.textContent='Modules : '+st.modulesDone+'/'+st.modulesTotal;
    pillModules.className='agora-pill '+(st.modulesDone>=st.modulesTotal?'ok':'warn');
    pillProtocol.textContent='Protocole : '+(st.protocolDone?'terminé':'à terminer');
    pillProtocol.className='agora-pill '+(st.protocolDone?'ok':'warn');
    pillPlayer.textContent='Joueur : '+(st.player||'non connecté');
    pillPlayer.className='agora-pill '+(st.connected?'ok':'warn');
    if(usable&&OPEN){
      if(!HISTORY.length){
        HISTORY.push({role:'assistant',content:focus?'Mode aide Kern activé sur "'+focus.title+'". Ici je reste volontairement sobre et centré sur ce pilier pour t aider à comprendre, reformuler et mémoriser les repères essentiels. Si tu veux revenir au mode général, écris "mode normal".':'Je suis Kern. Je peux te proposer une scène à Valdurne pour t entraîner, ou t aider à réfléchir à une situation réelle sans la transformer en jeu. Commence par me demander une scène, un choix difficile, ou un débrief sur ta posture.',ts:new Date().toISOString()});
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
    return /(harcelement|rumeur|menace|agression|humiliation|mise a l ecart|cyber|violence|racket|suicide|detresse|mal etre|angoisse|anxiete|depression|scarification|automutilation|idee noire|idees noires)/.test(s) && /(college|classe|eleve|prof|aed|cpe|vie scolaire|surveillant|etablissement|internat)/.test(s);
  }
  function looksFictionRequest(text){
    var s=norm(text), direct=['joue un scenario','joue moi un scenario','lance un scenario','fais moi jouer','fais moi une scene','cree une scene','crée une scène','on joue','jeu de role','jeu de rôle','roleplay','incarne','simule','dans valdurne','avec lyam','avec kern','avec rena'];
    for(var i=0;i<direct.length;i++){if(s.indexOf(norm(direct[i]))!==-1)return true;}
    return /(scenario|scene|simulation|jeu de role|roleplay|incarne|valdur|lyam|kern|rena|remus)/.test(s);
  }

  function runtimeRules(mode,focus){
    var lines=['=== GARDE-FOUS KERN ===','- Réponds uniquement à la dernière demande utilisateur.','- Les éléments factuels sur pHARe, le harcèlement, les CPS, le protocole, l Éducation nationale, la citoyenneté, la liberté, l égalité, la fraternité, l orientation, la sécurité routière, les secours et le canon de Valdurne doivent venir du contexte local récupéré.','- Reste concis, concret et utile.'];
    if(mode==='pillar-help'){
      lines.push('- MODE COACH DE PILIER : reste centré sur le pilier ciblé et ne pars pas en jeu de rôle complet.');
      if(focus)lines.push('- Pilier prioritaire : '+focus.title+'.');
      if(focus&&focus.mode==='summary'){
        lines.push('- Produis un résumé très fiable au format : Essentiel / Réflexes à retenir / Pièges à éviter / Vérifie-toi.');
      }else{
        lines.push('- Réponds comme un coach de compréhension à basse température : définitions nettes, reformulation, exemple bref, puis question de vérification si utile.');
      }
      lines.push('- Si le joueur veut sortir du mode ciblé, invite-le à écrire "mode normal".');
    }else if(mode==='support'){
      lines.push('- Le joueur semble décrire une situation réelle : ne roleplay pas et ne transforme pas cela en aventure.');
      lines.push('- Commence par la sécurité et le niveau d urgence.');
      lines.push('- Distingue faits observés, hypothèses et besoins immédiats.');
      lines.push('- Propose des appuis adultes et une chaîne d action prudente.');
      lines.push('- Si tu détectes un risque grave, immédiat, suicidaire, sexuel ou violent, dis clairement de prévenir immédiatement un adulte ou un service d urgence adapté.');
      lines.push('- Format recommandé : Ce qui me préoccupe / Ce que tu peux faire maintenant / Ce qu il faut noter.');
    }else if(mode==='fiction'){
      lines.push('- Tu es Kern dans un cadre narratif éducatif.');
      lines.push('- Si un dossier de scénario est fourni plus bas, respecte-le comme rail pédagogique prioritaire.');
      lines.push('- Propose une scène courte, puis 2 ou 3 options maximum.');
      lines.push('- Ne donne pas toute la solution immédiatement : fais choisir, puis débriefe brièvement.');
      lines.push('- Les scènes doivent entraîner des choix attendus institutionnellement : protection, parole, témoins, régulation, appel à l adulte, cadre.');
      lines.push('- Pas de contenu dangereux, humiliant, sexuel explicite ou de techniques de malveillance.');
      lines.push('- Format recommandé : Scène / Tes options / Repère Kern.');
    }else{
      lines.push('- Le joueur cherche surtout un repère ou une réponse factuelle : reste sobre et proche des documents.');
      lines.push('- Priorise les formulations institutionnellement sûres et les explications structurées.');
      lines.push('- Format recommandé : Réponse noyau / Point de vigilance / Appuis locaux.');
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
    if(!canUseKern()){toast('Kern se débloque après les '+st.modulesTotal+' modules PIX pHARe et le Protocole Valdurne. En attendant, utilise les boutons d aide sous chaque pilier.');return;}
    OPEN=!OPEN;
    renderSection();
    if(OPEN){
      var input=document.getElementById('agora-input');
      if(input)setTimeout(function(){input.focus();},80);
    }
  };
  window.replayPixharePillar=function(key){
    var pillar=pillarByKey(key);
    if(!pillar||!pillar.modules.length){toast('Pilier introuvable.');return;}
    openModule(pillar.modules[0].file,pillar.modules[0].id);
  };
  window.startKernPillarCoach=function(key){
    if(!getPlayer()){toast('Connecte d abord un joueur depuis le Portail Vie Scolaire.');return;}
    var focus=setPillarFocus(key,'coach');
    if(!focus){toast('Pilier introuvable.');return;}
    clearActiveScenario();
    CONCERN={mode:'idle',draft:null,submission:null,message:''};
    OPEN=true;
    renderSection();
    addPillarFocusIntro(focus);
    var input=document.getElementById('agora-input');
    if(input){
      input.placeholder='Pose une question sur le pilier '+focus.title+'...';
      setTimeout(function(){input.focus();},80);
    }
  };
  window.requestKernPillarSummary=function(key){
    if(!getPlayer()){toast('Connecte d abord un joueur depuis le Portail Vie Scolaire.');return;}
    var focus=setPillarFocus(key,'summary');
    if(!focus){toast('Pilier introuvable.');return;}
    clearActiveScenario();
    CONCERN={mode:'idle',draft:null,submission:null,message:''};
    OPEN=true;
    renderSection();
    var input=document.getElementById('agora-input');
    if(!input){toast('Zone de chat indisponible.');return;}
    input.value='Genere un resume du cours pour le pilier "'+focus.title+'" : idees essentielles, repères a retenir, erreurs a eviter et 3 questions pour me tester.';
    window.sendKern();
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
    var text=(input&&input.value||'').trim();
    var focus=activePillarFocus();
    if(focus&&isPillarFocusExitRequest(text)){
      if(input)input.value='';
      pushMessage('user',text);
      clearPillarFocus();
      pushMessage('assistant','Mode aide Kern désactivé. Je reviens au mode général.');
      renderSection();
      if(input)input.focus();
      return;
    }
    var mode=focus?'pillar-help':(looksReal(text)?'support':((looksFictionRequest(text)||looksScenarioContinuation(text))?'fiction':'reference'));
    var temp=mode==='pillar-help'?(focus&&focus.mode==='summary'?KERN_PILLAR_SUMMARY_TEMP:KERN_PILLAR_HELP_TEMP):(mode==='support'?KERN_SUPPORT_TEMP:(mode==='reference'?KERN_REFERENCE_TEMP:KERN_TEMP));
    var maxTokens=mode==='pillar-help'?960:(mode==='support'?KERN_SUPPORT_MAX_TOKENS:(mode==='reference'?KERN_REFERENCE_MAX_TOKENS:KERN_MAX_TOKENS));
    if(!canUseKern()){toast('Kern est encore verrouillé pour ce joueur.');return;}
    if(!text)return;
    input.value='';
    if(send)send.disabled=true;
    pushMessage('user',text);
    typing(true,mode==='pillar-help'?(focus&&focus.mode==='summary'?'Kern synthétise ce pilier à basse température…':'Kern reste centré sur ce pilier pour t aider à le comprendre…'):(mode==='support'?'Kern relit les repères de protection, de posture et de protocole…':(mode==='reference'?'Kern consulte les repères institutionnels de la plateforme Vie scolaire…':'Kern ouvre une scène à Valdurne tout en relisant les repères éducatifs…')));
    try{
      if(mode==='fiction')await loadScenarioLibrary();
      if(mode!=='fiction'&&SCENARIO_STATE.active&&/pause|stop scenario|stop scénario|on sort du scenario|on sort du scénario|question reelle|question réelle|explique moi|explique-moi/.test(norm(text)))clearActiveScenario();
      if(mode==='pillar-help'&&SCENARIO_STATE.active)clearActiveScenario();
      var scenarioBundle=mode==='fiction'?pickScenario(text):null;
      var scenarioQuery=scenarioBundle&&scenarioBundle.scenario?(text+' '+scenarioBundle.scenario.title+' '+(scenarioBundle.scenario.tags||[]).join(' ')+' '+(scenarioBundle.scenario.sourceHints||[]).join(' ')):text;
      if(focus){
        scenarioQuery+=' '+focus.title+' '+focus.desc+' '+focus.moduleIds.join(' ')+' '+focus.moduleNames.join(' ');
      }
      var ctx=await contextFor(scenarioQuery);
      var sys=prompt()+'\n\n'+runtimeRules(mode,focus)+(focus?'\n\n'+buildPillarPromptBlock(focus):'')+(scenarioBundle?'\n\n'+scenarioPromptBlock(scenarioBundle):'')+'\n\n'+ctx.context;
      var prior=HISTORY.slice(Math.max(HISTORY.length-7,0),Math.max(HISTORY.length-1,0)).map(function(msg){return {role:msg.role==='assistant'?'assistant':'user',content:msg.content};});
      var reply=await complete([{role:'system',content:sys}].concat(prior).concat([{role:'user',content:text}]),temp,maxTokens);
      typing(false);
      pushMessage('assistant',reply||'Je n ai pas réussi à formuler de réponse. Réessaie avec une consigne plus précise.');
      if(mode==='support'&&CONCERN.mode==='idle'){CONCERN={mode:'hint',draft:null,submission:null,message:'Si tu décris une situation réelle, je peux aussi préparer un signalement structuré à partir de ce que tu viens d écrire.'};}
      if(mode==='pillar-help'&&focus&&focus.mode==='summary'){setPillarFocus(focus.key,'coach');renderSection();}
      renderConcern();
    }catch(e){
      typing(false);
      pushMessage('assistant','Je n arrive pas à joindre Mistral ou à relire les sources locales de PIX pHARe. Vérifie que les fichiers sont bien publiés dans ce dossier, puis réessaie.');
      if(mode==='pillar-help'&&focus&&focus.mode==='summary'){setPillarFocus(focus.key,'coach');renderSection();}
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
    if(!e.key||e.key.indexOf('CERT_')===0||e.key==='pvs_current_player'||e.key==='pvs_phare_player'||e.key===scenarioKey()){loadHistory();renderSection();}
  });

  if(typeof PROTOCOLE_VALDURNE!=='undefined'){PROTOCOLE_VALDURNE.file='PROTOCOLE_VALDURNE_01 (1).html';}

  window.toggleAgora=window.toggleKern;
  window.downloadAgoraHistory=window.downloadKernHistory;
  window.clearAgoraHistory=window.clearKernHistory;
  window.sendAgora=window.sendKern;

  Promise.all([loadPrompt(),loadScenarioLibrary()]).then(function(){return buildIndex();}).catch(function(){return null;}).finally(function(){loadHistory();if(typeof render==='function')render();if(typeof renderValdurne==='function')renderValdurne();});

})();

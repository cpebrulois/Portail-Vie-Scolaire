(function(){
  // La clé n'est plus dans le navigateur : l'appel passe par le proxy Cloudflare
  // (functions/api/agora.js), qui injecte MISTRAL_API_KEY côté serveur.
  var API_URL='/api/agora';
  var API_MODEL='mistral-small-latest';
  var DEFAULTS={
    personaId:'agora-viesco',
    assistantName:'Agora',
    assistantTitle:'Agora',
    launcherLabel:'Parler a Agora',
    panelSubtitle:'Guide de la plateforme',
    promptFiles:['agora_portail_system.txt'],
    manifestFile:'viesco_manifest.json',
    temperature:0.18,
    maxTokens:1200,
    historyLimit:8,
    suggestions:[],
    welcome:'',
    focusFiles:[],
    focusTags:[],
    githubDiscovery:true,
    currentFile:'',
    pageLabel:'',
    pageMode:'reference'
  };
  var CFG=Object.assign({},DEFAULTS,window.VIESCO_AI_CONFIG||{});
  if(!CFG||CFG.disabled)return;

  var promptText='';
  var promptPromise=null;
  var fileListPromise=null;
  var docCache={};
  var askInFlight=false;
  var actorKey=getActorKey();
  var store=loadStore();
  var domDoc=null;

  function text(v){return String(v==null?'':v);}
  function norm(str){
    return text(str)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .toLowerCase()
      .replace(/[^a-z0-9\s/_-]+/g,' ')
      .replace(/\s+/g,' ')
      .trim();
  }
  function tokens(str){
    var stop={
      le:1,la:1,les:1,de:1,des:1,du:1,un:1,une:1,et:1,ou:1,au:1,aux:1,en:1,dans:1,
      sur:1,pour:1,par:1,avec:1,sans:1,que:1,qui:1,quoi:1,comment:1,quand:1,est:1,
      sont:1,etre:1,avoir:1,il:1,elle:1,nous:1,vous:1,ils:1,elles:1,ce:1,cette:1,
      ces:1,mon:1,ma:1,mes:1,ton:1,ta:1,tes:1,son:1,sa:1,ses:1,notre:1,votre:1,
      leur:1,leurs:1,je:1,tu:1,me:1,te:1,se:1,ne:1,pas:1,plus:1,moins:1,ici:1,
      cela:1,ca:1,y:1,ou:1,vers:1,hub:1,module:1,page:1
    };
    return norm(str).split(' ').filter(function(tok){
      return tok && tok.length>1 && !stop[tok];
    });
  }
  function uniq(arr){
    var out=[],seen={};
    (arr||[]).forEach(function(item){
      var key=norm(item);
      if(!item||seen[key])return;
      seen[key]=true;
      out.push(item);
    });
    return out;
  }
  function toLines(str,max){
    var clean=text(str).replace(/\r/g,'').trim();
    if(!clean)return '';
    return clean.length<=max?clean:(clean.slice(0,max-1)+'…');
  }
  function escapeHtml(str){
    return text(str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/\n/g,'<br>');
  }
  function pathHref(file){
    return text(file).split('/').map(function(part){return encodeURIComponent(part);}).join('/');
  }
  function currentFileName(){
    if(CFG.currentFile)return CFG.currentFile;
    var raw=decodeURIComponent(location.pathname.split('/').pop()||'');
    return raw||'index.html';
  }
  function currentDirPrefix(){
    var parts=decodeURIComponent(location.pathname).split('/').filter(Boolean);
    if(parts.length<=2)return '';
    return parts.slice(1,-1).join('/')+'/';
  }
  function getActorKey(){
    var qp=new URLSearchParams(location.search).get('player');
    var raw=qp||localStorage.getItem('pvs_current_player')||localStorage.getItem('pvs_phare_player')||'VISITEUR';
    return text(raw).trim().toUpperCase()||'VISITEUR';
  }
  function storeKey(){
    return 'pvs_ai_'+CFG.personaId+'::'+actorKey;
  }
  function loadStore(){
    try{
      var raw=JSON.parse(localStorage.getItem(storeKey())||'{}');
      return {
        messages:Array.isArray(raw.messages)?raw.messages.slice(-20):[],
        opened:Boolean(raw.opened)
      };
    }catch(e){
      return {messages:[],opened:false};
    }
  }
  function saveStore(){
    try{
      localStorage.setItem(storeKey(),JSON.stringify({messages:store.messages.slice(-20),opened:store.opened}));
    }catch(e){}
  }
  function pushMessage(role,content){
    store.messages.push({role:role,content:text(content),ts:new Date().toISOString()});
    if(store.messages.length>20)store.messages=store.messages.slice(-20);
    saveStore();
    if(role==='assistant'&&typeof window.PVS_VITS_SPEAK==='function')window.PVS_VITS_SPEAK(text(content));
  }
  function resetConversation(){
    store.messages=[];
    saveStore();
    renderMessages();
    setStatus('Conversation effacee.');
  }
  function ensureWelcome(){
    if(store.messages.length)return;
    var welcome=text(CFG.welcome||'').trim();
    if(!welcome)return;
    pushMessage('assistant',welcome);
  }
  function setStatus(msg){
    var el=document.getElementById('viescoAiStatus');
    if(el)el.textContent=text(msg||'');
  }
  function looksTextPath(file){
    return /\.(html?|md|txt|json)$/i.test(file||'');
  }
  function shouldExclude(file){
    var src=text(file).replace(/\\/g,'/');
    return !looksTextPath(src) ||
      /(^|\/)(__pycache__)(\/|$)/i.test(src) ||
      /(^|\/)(agora_viesco\.js|agora_pixhare\.js|agora_system\.txt|kern_system\.txt|agora_portail_system\.txt|helene_system\.txt|viesco_manifest\.json)(\/|$)/i.test(src);
  }
  function humanize(file){
    return text(file)
      .split('/')
      .pop()
      .replace(/\.[^.]+$/,'')
      .replace(/[_-]+/g,' ')
      .replace(/\(\d+\)/g,' ')
      .replace(/\s+/g,' ')
      .trim();
  }
  function inferTags(file){
    var src=norm(file+' '+humanize(file));
    var tags=[];
    function add(){
      tags=tags.concat([].slice.call(arguments));
    }
    if(/orientation|avenir|parcours|metier|formation|lycee|mfr|cfa|psyen|onisep/.test(src))add('orientation','parcours','formation');
    if(/phare|harcelement|groupe|neuro|numerique|juridique|valdurne|lyam|kern|rena|roman/.test(src))add('pixhare','harcelement','valdurne');
    if(/liberte|egalite|fraternite|delegue|citoyen|justice/.test(src))add('citoyennete','republique');
    if(/psc1|secours|securite|velo|route|assr|edpm/.test(src))add('securite','secours');
    if(/appui|observer|exprimer|comprendre|organiser|ajuster/.test(src))add('appuis','apprentissage');
    if(/video|nouveaute/.test(src))add('ressources');
    return uniq(tags);
  }
  function inferPillar(file,tags){
    var src=norm(file+' '+(tags||[]).join(' '));
    if(/orientation|parcours|formation/.test(src))return 'Orientation';
    if(/phare|valdurne|harcelement/.test(src))return 'PIX pHARe';
    if(/liberte/.test(src))return 'Liberte';
    if(/egalite/.test(src))return 'Egalite';
    if(/fraternite/.test(src))return 'Fraternite';
    if(/securite|secours|psc1/.test(src))return 'Securite';
    if(/appuis/.test(src))return 'Appuis';
    return 'Portail Vie scolaire';
  }
  function blockify(textValue){
    var clean=text(textValue).replace(/\r/g,'').trim();
    if(!clean)return [];
    var rawBlocks=clean.split(/\n{2,}/).map(function(part){return part.trim();}).filter(Boolean);
    if(rawBlocks.length<4){
      rawBlocks=[];
      for(var i=0;i<clean.length;i+=720)rawBlocks.push(clean.slice(i,i+720).trim());
    }
    var out=[];
    rawBlocks.forEach(function(block){
      if(!block)return;
      if(block.length<=760){
        out.push({text:block,search:norm(block)});
        return;
      }
      for(var i=0;i<block.length;i+=700){
        var chunk=block.slice(i,i+760).trim();
        if(chunk)out.push({text:chunk,search:norm(chunk)});
      }
    });
    return out.slice(0,420);
  }
  function cleanHtml(src){
    return text(src)
      .replace(/<script[\s\S]*?<\/script>/gi,' ')
      .replace(/<style[\s\S]*?<\/style>/gi,' ')
      .replace(/<\/(p|div|section|article|li|h1|h2|h3|h4|h5|h6|tr|table|blockquote)>/gi,'\n')
      .replace(/<br\s*\/?>/gi,'\n')
      .replace(/<[^>]+>/g,' ')
      .replace(/[ \t]+/g,' ')
      .replace(/\n{3,}/g,'\n\n')
      .trim();
  }
  function cleanMarkdown(src){
    return text(src)
      .replace(/!\[[^\]]*\]\([^)]+\)/g,' ')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g,'$1')
      .replace(/^\s{0,3}#{1,6}\s*/gm,'')
      .replace(/^\s*>\s?/gm,'')
      .replace(/^\s*[-*+]\s+/gm,'')
      .replace(/^\s*\d+\.\s+/gm,'')
      .replace(/[`*_~|]/g,' ')
      .replace(/[ \t]+/g,' ')
      .replace(/\n{3,}/g,'\n\n')
      .trim();
  }
  function cleanPlain(src){
    return text(src)
      .replace(/[ \t]+/g,' ')
      .replace(/\n{3,}/g,'\n\n')
      .trim();
  }
  function currentDomText(){
    if(domDoc)return domDoc;
    var scope=document.querySelector('.wrap')||document.body;
    var raw=scope?scope.innerText:'';
    domDoc={
      id:'__current__',
      file:currentFileName(),
      title:document.title||humanize(currentFileName()),
      pillar:CFG.pageLabel||'Page courante',
      tags:uniq((CFG.focusTags||[]).concat(inferTags(currentFileName()))),
      text:cleanPlain(raw).slice(0,50000),
      search:'',
      blocks:[]
    };
    domDoc.search=norm([domDoc.title,domDoc.file,domDoc.pillar,(domDoc.tags||[]).join(' '),domDoc.text].join(' '));
    domDoc.blocks=blockify(domDoc.text);
    return domDoc;
  }
  function githubContext(){
    if(!CFG.githubDiscovery||!/\.github\.io$/i.test(location.hostname))return null;
    var owner=location.hostname.replace(/\.github\.io$/i,'');
    var parts=decodeURIComponent(location.pathname).split('/').filter(Boolean);
    if(!parts.length)return null;
    var repo=parts[0];
    var dir=parts.length>1?parts.slice(1,-1).join('/'):'';
    return {owner:owner,repo:repo,dir:dir};
  }
  async function discoverGithubFiles(){
    var ctx=githubContext();
    if(!ctx)return [];
    var cacheKey='pvs_ai_gh::'+ctx.owner+'::'+ctx.repo+'::'+ctx.dir;
    try{
      var cached=sessionStorage.getItem(cacheKey);
      if(cached)return JSON.parse(cached)||[];
    }catch(e){}
    try{
      var repoRes=await fetch('https://api.github.com/repos/'+encodeURIComponent(ctx.owner)+'/'+encodeURIComponent(ctx.repo),{cache:'no-store'});
      if(!repoRes.ok)throw new Error('repo '+repoRes.status);
      var repoData=await repoRes.json();
      var branch=repoData.default_branch||'main';
      var treeRes=await fetch('https://api.github.com/repos/'+encodeURIComponent(ctx.owner)+'/'+encodeURIComponent(ctx.repo)+'/git/trees/'+encodeURIComponent(branch)+'?recursive=1',{cache:'no-store'});
      if(!treeRes.ok)throw new Error('tree '+treeRes.status);
      var treeData=await treeRes.json();
      var prefix=ctx.dir?ctx.dir+'/':'';
      var files=(Array.isArray(treeData.tree)?treeData.tree:[])
        .filter(function(node){return node&&node.type==='blob'&&text(node.path).indexOf(prefix)===0;})
        .map(function(node){return text(node.path).slice(prefix.length);})
        .filter(function(file){return file && !shouldExclude(file);});
      files=uniq(files);
      try{sessionStorage.setItem(cacheKey,JSON.stringify(files));}catch(e){}
      return files;
    }catch(e){
      return [];
    }
  }
  async function loadPrompt(){
    if(promptPromise)return promptPromise;
    promptPromise=(async function(){
      var files=Array.isArray(CFG.promptFiles)?CFG.promptFiles:[CFG.promptFiles];
      for(var i=0;i<files.length;i++){
        try{
          var res=await fetch(pathHref(files[i]),{cache:'no-store'});
          if(res.ok){
            promptText=await res.text();
            return promptText;
          }
        }catch(e){}
      }
      promptText='Tu es '+CFG.assistantName+', assistant local ancre dans les fichiers publies de cette plateforme. Tu t appuies seulement sur les contenus locaux et tu dis clairement quand une information manque.';
      return promptText;
    })();
    return promptPromise;
  }
  async var siteIndex={};
  function loadFileList(){
    if(fileListPromise)return fileListPromise;
    fileListPromise=(async function(){
      var files=[];
      try{
        var res=await fetch(pathHref(CFG.manifestFile),{cache:'no-store'});
        if(res.ok){
          var data=await res.json();
          if(Array.isArray(data))files=files.concat(data.map(function(item){return text(item);})); 
        }
      }catch(e){}
      try{ var ixRes=await fetch(pathHref('viesco_index.json'),{cache:'no-store'}); if(ixRes.ok){ siteIndex=(await ixRes.json())||{}; files=files.concat(Object.keys(siteIndex)); } }catch(e){}
      files=files.concat(await discoverGithubFiles());
      files=uniq(files.filter(function(file){return file&&!shouldExclude(file);}));
      if(files.indexOf(currentFileName())===-1)files.unshift(currentFileName());
      if(CFG.focusFiles&&CFG.focusFiles.length){
        CFG.focusFiles.slice().reverse().forEach(function(file){
          if(files.indexOf(file)===-1)files.unshift(file);
        });
      }
      return files;
    })();
    return fileListPromise;
  }
  function fileMeta(file){
    var tags=inferTags(file);
    return {
      id:file,
      file:file,
      title:(siteIndex[file]&&siteIndex[file].t)||humanize(file),
      pillar:inferPillar(file,tags),
      tags:tags,
      search:norm([file,(siteIndex[file]&&siteIndex[file].t)||humanize(file),(siteIndex[file]&&siteIndex[file].s)||'',inferPillar(file,tags),tags.join(' ')].join(' ')),
      text:'',
      blocks:[]
    };
  }
  async function ensureDoc(meta){
    if(meta.id==='__current__')return meta;
    if(docCache[meta.file])return docCache[meta.file];
    var loaded=Object.assign({},meta);
    try{
      var res=await fetch(pathHref(meta.file),{cache:'force-cache'});
      if(!res.ok)throw new Error('HTTP '+res.status);
      var raw=await res.text();
      if(/\.md$/i.test(meta.file))loaded.text=cleanMarkdown(raw);
      else if(/\.(txt|json)$/i.test(meta.file))loaded.text=cleanPlain(raw);
      else loaded.text=cleanHtml(raw);
    }catch(e){
      loaded.text='';
    }
    loaded.search=norm([loaded.search,loaded.text].join(' '));
    loaded.blocks=blockify(loaded.text);
    docCache[meta.file]=loaded;
    return loaded;
  }
  function overlapScore(haystack,tokenList,weight){
    var score=0;
    tokenList.forEach(function(tok){
      if(haystack.indexOf(tok)!==-1)score+=weight;
    });
    return score;
  }
  function baseScore(meta,queryTokens){
    var score=0;
    var bag=meta.search||'';
    score+=overlapScore(bag,queryTokens,8);
    if(meta.file===currentFileName())score+=20;
    if((CFG.focusFiles||[]).indexOf(meta.file)!==-1)score+=22;
    (CFG.focusTags||[]).forEach(function(tag){
      if((meta.tags||[]).indexOf(tag)!==-1)score+=12;
      else if(bag.indexOf(norm(tag))!==-1)score+=8;
    });
    if((meta.pillar||'')===(CFG.pageLabel||''))score+=6;
    return score;
  }
  function blockScore(block,queryTokens){
    var score=0;
    queryTokens.forEach(function(tok){
      if(block.search.indexOf(tok)!==-1)score+=10;
    });
    return score;
  }
  function bestBlocks(doc,queryTokens,limit){
    var scored=(doc.blocks||[]).map(function(block){
      return {text:block.text,score:blockScore(block,queryTokens)};
    }).sort(function(a,b){return b.score-a.score;});
    var picked=scored.filter(function(item){return item.score>0;}).slice(0,limit||2).map(function(item){return toLines(item.text,650);});
    if(!picked.length&&doc.text)picked=[toLines(doc.text,650)];
    return picked;
  }
  async function gatherContext(query){
    var queryTokens=tokens(query);
    var files=await loadFileList();
    var candidates=[currentDomText()].concat(files.map(fileMeta));
    candidates.sort(function(a,b){return baseScore(b,queryTokens)-baseScore(a,queryTokens);});
    var shortlist=candidates.slice(0,12);
    var loaded=await Promise.all(shortlist.map(ensureDoc));
    var scored=loaded.map(function(doc){
      var score=baseScore(doc,queryTokens);
      score+=overlapScore(doc.search||'',queryTokens,5);
      return {doc:doc,score:score};
    }).sort(function(a,b){return b.score-a.score;});
    var docs=scored.filter(function(item){return item.score>0 && item.doc && item.doc.text;}).slice(0,6).map(function(item,idx){
      return {
        title:item.doc.title,
        file:item.doc.file,
        pillar:item.doc.pillar,
        tags:item.doc.tags||[],
        snippets:(idx===0 && item.doc.text ? [toLines(item.doc.text,7000)] : bestBlocks(item.doc,queryTokens,2))
      };
    });
    return docs;
  }
  function buildUserEnvelope(userText,docs){
    var lines=[];
    lines.push('Page courante : '+(CFG.pageLabel||document.title||'Page du portail'));
    lines.push('Mode attendu : '+(CFG.pageMode||'reference'));
    if(actorKey)lines.push('Code joueur courant : '+actorKey);
    lines.push('Reponds uniquement a la derniere demande de l utilisateur.');
    if(docs&&docs.length){
      lines.push('Contexte local selectionne :');
      docs.forEach(function(doc,idx){
        lines.push('['+(idx+1)+'] '+doc.title+' | '+doc.file+' | '+doc.pillar);
        doc.snippets.forEach(function(snippet){lines.push(snippet);});
      });
    }else{
      lines.push('Aucun extrait local pertinent n a ete charge. Si une info manque, dis-le clairement.');
    }
    lines.push('Demande utilisateur : '+text(userText).trim());
    return lines.join('\n\n');
  }
  async function askAssistant(userText){
    var docs=await gatherContext(userText);
    var system=(await loadPrompt()).trim();
    var history=store.messages.filter(function(msg){return msg.role==='user'||msg.role==='assistant';}).slice(-CFG.historyLimit);
    var convo=history.slice(0,Math.max(history.length-1,0)).map(function(msg){
      return {role:msg.role,content:msg.content};
    });
    var messages=[{role:'system',content:system}].concat(convo).concat([{role:'user',content:buildUserEnvelope(userText,docs)}]);
    var res=await fetch(API_URL,{
      method:'POST',
      headers:{
        'Content-Type':'application/json'
      },
      body:JSON.stringify({
        model:API_MODEL,
        messages:messages,
        temperature:Number(CFG.temperature||0.2),
        max_tokens:Number(CFG.maxTokens||900)
      })
    });
    if(!res.ok)throw new Error('Mistral '+res.status);
    var data=await res.json();
    var answer=
      data&&data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content
        ? data.choices[0].message.content
        : '';
    if(!answer)throw new Error('Reponse vide');
    return {answer:answer,docs:docs};
  }
  function styleText(){
    return [
      '#viescoAiPanel{position:fixed;right:18px;bottom:18px;z-index:2100;width:min(420px,calc(100vw - 28px));max-height:min(78vh,720px);display:none;flex-direction:column;background:linear-gradient(145deg,#081528,#132746);border:1px solid rgba(255,255,255,.18);border-radius:18px;box-shadow:0 24px 56px rgba(0,0,0,.42);overflow:hidden;font-family:inherit;color:#eef5ff}',
      '#viescoAiPanel.open{display:flex}',
      '#viescoAiHead{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;padding:14px 14px 10px;border-bottom:1px solid rgba(255,255,255,.12);background:linear-gradient(135deg,rgba(93,234,212,.12),rgba(255,214,107,.08))}',
      '#viescoAiTitle{font-weight:800;font-size:1rem;letter-spacing:.02em}',
      '#viescoAiSub{font-size:.82rem;color:#c9daf5;line-height:1.35;margin-top:3px}',
      '#viescoAiClose{border:none;background:rgba(255,255,255,.1);color:#fff;border-radius:10px;padding:8px 10px;font-weight:700;cursor:pointer}',
      '#viescoAiBody{padding:12px;overflow:auto;display:grid;gap:10px;background:linear-gradient(180deg,rgba(255,255,255,.02),rgba(0,0,0,.08))}',
      '.viescoAiBubble{padding:11px 12px;border-radius:14px;line-height:1.5;font-size:.94rem;white-space:normal}',
      '.viescoAiBubble.user{background:rgba(93,234,212,.14);border:1px solid rgba(93,234,212,.24);color:#effffc;margin-left:26px}',
      '.viescoAiBubble.assistant{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);color:#eef5ff;margin-right:26px}',
      '#viescoAiTools{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:0 12px 10px}',
      '#viescoAiStatus{font-size:.78rem;color:#c9daf5;min-height:18px}',
      '#viescoAiClear{border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.07);color:#fff;border-radius:999px;padding:6px 10px;font-size:.78rem;cursor:pointer}',
      '#viescoAiSuggest{display:flex;flex-wrap:wrap;gap:8px;padding:0 12px 10px}',
      '.viescoAiChip{border:none;border-radius:999px;padding:7px 10px;background:rgba(255,255,255,.1);color:#dff5ff;font-size:.78rem;font-weight:700;cursor:pointer}',
      '#viescoAiFoot{padding:12px;border-top:1px solid rgba(255,255,255,.1);display:grid;gap:8px;background:rgba(0,0,0,.14)}',
      '#viescoAiInput{width:100%;min-height:86px;resize:vertical;padding:11px 12px;border-radius:14px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.08);color:#fff;font:inherit}',
      '#viescoAiActions{display:flex;justify-content:space-between;gap:10px;align-items:center}',
      '#viescoAiHint{font-size:.78rem;color:#bdd0ea}',
      '#viescoAiSend{border:none;border-radius:12px;padding:10px 14px;background:linear-gradient(135deg,#5debd4,#ffd66b);color:#07263a;font-weight:800;cursor:pointer}',
      '#viescoAiSend[disabled]{opacity:.6;cursor:not-allowed}',
      '@media (max-width:640px){#viescoAiPanel{right:12px;left:12px;bottom:12px;width:auto;max-height:82vh}}'
    ].join('');
  }
  function ensureUi(){
    if(document.getElementById('viescoAiPanel'))return;
    var style=document.createElement('style');
    style.id='viescoAiStyle';
    style.textContent=styleText();
    document.head.appendChild(style);

    var panel=document.createElement('section');
    panel.id='viescoAiPanel';
    panel.setAttribute('aria-live','polite');
    panel.innerHTML=
      '<div id=\"viescoAiHead\">'+
        '<div><div id=\"viescoAiTitle\"></div><div id=\"viescoAiSub\"></div></div>'+
        '<button id=\"viescoAiClose\" type=\"button\">Fermer</button>'+
      '</div>'+
      '<div id=\"viescoAiBody\"></div>'+
      '<div id=\"viescoAiTools\"><div id=\"viescoAiStatus\"></div><button id=\"viescoAiClear\" type=\"button\">Effacer</button></div>'+
      '<div id=\"viescoAiSuggest\"></div>'+
      '<div id=\"viescoAiFoot\">'+
        '<textarea id=\"viescoAiInput\" placeholder=\"Ecris ta question...\"></textarea>'+
        '<div id=\"viescoAiActions\"><div id=\"viescoAiHint\"></div><button id=\"viescoAiSend\" type=\"button\">Envoyer</button></div>'+
      '</div>';
    document.body.appendChild(panel);

    document.getElementById('viescoAiTitle').textContent=CFG.assistantTitle||CFG.assistantName;
    document.getElementById('viescoAiSub').textContent=CFG.panelSubtitle||'Assistant local';
    document.getElementById('viescoAiHint').textContent='Sources locales uniquement';

    document.getElementById('viescoAiClose').addEventListener('click',function(){window.toggleViescoAI(false);});
    document.getElementById('viescoAiClear').addEventListener('click',resetConversation);
    document.getElementById('viescoAiSend').addEventListener('click',sendCurrent);
    document.getElementById('viescoAiInput').addEventListener('keydown',function(evt){
      if(evt.key==='Enter'&&!evt.shiftKey){
        evt.preventDefault();
        sendCurrent();
      }
    });
    document.addEventListener('keydown',function(evt){
      if(evt.key==='Escape')window.toggleViescoAI(false);
    });
    renderSuggestions();
    renderMessages();
  }
  function renderSuggestions(){
    var root=document.getElementById('viescoAiSuggest');
    if(!root)return;
    root.innerHTML='';
    (CFG.suggestions||[]).forEach(function(label){
      var button=document.createElement('button');
      button.type='button';
      button.className='viescoAiChip';
      button.textContent=label;
      button.onclick=function(){
        var input=document.getElementById('viescoAiInput');
        if(!input)return;
        input.value=label;
        input.focus();
      };
      root.appendChild(button);
    });
  }
  function renderMessages(){
    var root=document.getElementById('viescoAiBody');
    if(!root)return;
    root.innerHTML='';
    ensureWelcome();
    store.messages.forEach(function(msg){
      if(msg.role!=='assistant'&&msg.role!=='user')return;
      var bubble=document.createElement('article');
      bubble.className='viescoAiBubble '+msg.role;
      bubble.innerHTML=escapeHtml(msg.content);
      root.appendChild(bubble);
    });
    root.scrollTop=root.scrollHeight;
  }
  function renderPanel(){
    ensureUi();
    var panel=document.getElementById('viescoAiPanel');
    if(!panel)return;
    if(store.opened)panel.classList.add('open');
    else panel.classList.remove('open');
    renderMessages();
  }
  async function sendCurrent(){
    if(askInFlight)return;
    var input=document.getElementById('viescoAiInput');
    if(!input)return;
    var value=text(input.value).trim();
    if(!value)return;
    input.value='';
    pushMessage('user',value);
    renderMessages();
    setStatus('Je prepare la reponse a partir des fichiers locaux...');
    askInFlight=true;
    var sendButton=document.getElementById('viescoAiSend');
    if(sendButton)sendButton.disabled=true;
    try{
      var reply=await askAssistant(value);
      pushMessage('assistant',reply.answer.trim());
      renderMessages();
      setStatus(reply.docs.length?('Appuis charges : '+reply.docs.map(function(doc){return doc.title;}).join(' | ')):'Pas d appui local cible.');
    }catch(e){
      pushMessage('assistant','Je n ai pas pu repondre correctement pour le moment. Verifie la connexion ou reessaie avec une question plus precise.');
      renderMessages();
      setStatus('Erreur : '+text(e&&e.message||'indeterminee'));
    }finally{
      askInFlight=false;
      if(sendButton)sendButton.disabled=false;
    }
  }

  window.toggleViescoAI=function(forceOpen){
    store.opened=typeof forceOpen==='boolean'?forceOpen:!store.opened;
    saveStore();
    renderPanel();
    if(store.opened){
      var input=document.getElementById('viescoAiInput');
      if(input)setTimeout(function(){input.focus();},60);
    }
  };
  window.sendViescoAI=sendCurrent;
  window.clearViescoAIConversation=resetConversation;

  function boot(){
    ensureWelcome();
    currentDomText();
    ensureUi();
    renderPanel();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();

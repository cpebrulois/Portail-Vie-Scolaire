(function(){
  if(window.PVS_TTS_READY)return;
  window.PVS_TTS_READY=true;

  var STORAGE_KEY='pvs_tts_settings_v1';
  var rootId='pvsTtsRoot';
  var styleId='pvsTtsStyle';
  var state={
    chunks:[],
    index:0,
    currentUtterance:null,
    speaking:false,
    paused:false,
    voices:[],
    settings:loadSettings()
  };

  function loadSettings(){
    try{
      var raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
      return{
        rate:clamp(Number(raw.rate||1),0.7,1.3),
        voice:typeof raw.voice==='string'?raw.voice:''
      };
    }catch(e){
      return{rate:1,voice:''};
    }
  }

  function saveSettings(){
    localStorage.setItem(STORAGE_KEY,JSON.stringify({
      rate:state.settings.rate,
      voice:state.settings.voice
    }));
  }

  function clamp(v,min,max){
    return Math.max(min,Math.min(max,v));
  }

  function injectStyle(){
    if(document.getElementById(styleId))return;
    var style=document.createElement('style');
    style.id=styleId;
    style.textContent=
      '#'+rootId+'{position:fixed;top:12px;left:12px;z-index:2147482000;font-family:Arial,sans-serif;color:#f4f7ff}' +
      '#'+rootId+' *{box-sizing:border-box}' +
      '#'+rootId+' [data-pvs-tts-ui]{all:unset;box-sizing:border-box}' +
      '#'+rootId+' .pvs-tts-shell{display:flex;flex-direction:column;gap:8px;align-items:flex-start}' +
      '#'+rootId+' .pvs-tts-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:40px;padding:0 12px;border-radius:999px;border:1px solid rgba(255,212,106,.38);background:linear-gradient(135deg,rgba(8,20,38,.96),rgba(19,43,75,.96));color:#ffffff;cursor:pointer;box-shadow:0 10px 24px rgba(0,0,0,.28);font-size:15px;font-weight:700}' +
      '#'+rootId+' .pvs-tts-btn:hover{background:rgba(14,31,58,.98)}' +
      '#'+rootId+' .pvs-tts-btn-label{font-size:13px;letter-spacing:.25px}' +
      '#'+rootId+' .pvs-tts-panel{display:none;width:min(320px,calc(100vw - 24px));padding:12px;border-radius:16px;border:1px solid rgba(255,255,255,.18);background:linear-gradient(145deg,rgba(10,21,39,.97),rgba(19,36,64,.97));box-shadow:0 18px 40px rgba(0,0,0,.35);backdrop-filter:blur(8px)}' +
      '#'+rootId+' .pvs-tts-panel.on{display:block}' +
      '#'+rootId+' .pvs-tts-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}' +
      '#'+rootId+' .pvs-tts-title{font-weight:700;font-size:13px;letter-spacing:.3px;color:#ffd46a;margin-bottom:8px}' +
      '#'+rootId+' .pvs-tts-chip{display:inline-flex;align-items:center;justify-content:center;min-height:32px;padding:0 10px;border-radius:10px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#eef4ff;cursor:pointer;font-size:13px}' +
      '#'+rootId+' .pvs-tts-chip[disabled]{opacity:.5;cursor:not-allowed}' +
      '#'+rootId+' .pvs-tts-label{font-size:12px;color:#c8d7ee;margin-top:8px;margin-bottom:4px}' +
      '#'+rootId+' .pvs-tts-select,#'+rootId+' .pvs-tts-range{width:100%;border-radius:10px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.07);color:#ffffff;padding:8px}' +
      '#'+rootId+' .pvs-tts-range{padding:6px}' +
      '#'+rootId+' .pvs-tts-status{margin-top:8px;font-size:12px;line-height:1.35;color:#b5caea;min-height:32px}' +
      '@media (max-width:640px){#'+rootId+'{top:auto;bottom:12px;left:12px}}';
    document.head.appendChild(style);
  }

  function buildUi(){
    if(document.getElementById(rootId))return;
    injectStyle();
    var root=document.createElement('div');
    root.id=rootId;
    root.setAttribute('data-pvs-tts-ui','1');
    root.innerHTML=
      '<div class="pvs-tts-shell">' +
        '<button class="pvs-tts-btn" type="button" title="Lecture orale (Alt+Shift+S)" aria-label="Lecture orale" data-pvs-tts-ui="1" id="pvsTtsLauncher"><span aria-hidden="true">&#128266;</span><span class="pvs-tts-btn-label">Lire</span></button>' +
        '<div class="pvs-tts-panel" id="pvsTtsPanel" data-pvs-tts-ui="1">' +
          '<div class="pvs-tts-title">Lecture orale</div>' +
          '<div class="pvs-tts-row">' +
            '<button class="pvs-tts-chip" type="button" id="pvsTtsPlay" data-pvs-tts-ui="1">Lire la page</button>' +
            '<button class="pvs-tts-chip" type="button" id="pvsTtsSelection" data-pvs-tts-ui="1">Lire la selection</button>' +
            '<button class="pvs-tts-chip" type="button" id="pvsTtsPause" data-pvs-tts-ui="1">Pause</button>' +
            '<button class="pvs-tts-chip" type="button" id="pvsTtsStop" data-pvs-tts-ui="1">Stop</button>' +
          '</div>' +
          '<div class="pvs-tts-label">Voix</div>' +
          '<select class="pvs-tts-select" id="pvsTtsVoice" data-pvs-tts-ui="1"></select>' +
          '<div class="pvs-tts-label">Vitesse</div>' +
          '<input class="pvs-tts-range" id="pvsTtsRate" data-pvs-tts-ui="1" type="range" min="0.7" max="1.3" step="0.05">' +
          '<div class="pvs-tts-status" id="pvsTtsStatus" aria-live="polite" data-pvs-tts-ui="1"></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(root);

    document.getElementById('pvsTtsLauncher').addEventListener('click',togglePanel);
    document.getElementById('pvsTtsPlay').addEventListener('click',function(){speakPage();});
    document.getElementById('pvsTtsSelection').addEventListener('click',function(){speakSelection();});
    document.getElementById('pvsTtsPause').addEventListener('click',togglePause);
    document.getElementById('pvsTtsStop').addEventListener('click',stopSpeaking);
    document.getElementById('pvsTtsRate').addEventListener('input',function(ev){
      state.settings.rate=clamp(Number(ev.target.value||1),0.7,1.3);
      saveSettings();
      updateStatus('Vitesse: x'+state.settings.rate.toFixed(2));
    });
    document.getElementById('pvsTtsVoice').addEventListener('change',function(ev){
      state.settings.voice=String(ev.target.value||'');
      saveSettings();
      updateStatus('Voix selectionnee.');
    });

    document.addEventListener('keydown',function(ev){
      if(ev.altKey&&ev.shiftKey&&String(ev.key).toLowerCase()==='s'){
        ev.preventDefault();
        togglePanel();
      }
      if(ev.altKey&&ev.shiftKey&&String(ev.key).toLowerCase()==='l'){
        ev.preventDefault();
        speakSelection();
      }
    });

    document.getElementById('pvsTtsRate').value=String(state.settings.rate);
    updatePauseLabel();
    updateStatus(hasSpeechSupport()?'Pret a lire la page ou la selection.':'La synthese vocale du navigateur est indisponible ici.');
  }

  function hasSpeechSupport(){
    return typeof window.speechSynthesis!=='undefined' && typeof window.SpeechSynthesisUtterance!=='undefined';
  }

  function togglePanel(){
    var panel=document.getElementById('pvsTtsPanel');
    if(!panel)return;
    panel.classList.toggle('on');
  }

  function updateStatus(msg){
    var el=document.getElementById('pvsTtsStatus');
    if(el)el.textContent=msg;
  }

  function updatePauseLabel(){
    var btn=document.getElementById('pvsTtsPause');
    if(!btn)return;
    btn.textContent=state.paused?'Reprendre':'Pause';
  }

  function isVisibleElement(el){
    if(!el||el.nodeType!==1)return false;
    if(el.closest('[data-pvs-tts-ui]'))return false;
    var style=window.getComputedStyle(el);
    if(style.display==='none' || style.visibility==='hidden' || style.opacity==='0')return false;
    if(el.hasAttribute('hidden'))return false;
    return true;
  }

  function getSelectedText(){
    try{
      var sel=window.getSelection();
      return sel?String(sel.toString()||'').trim():'';
    }catch(e){
      return '';
    }
  }

  function cleanText(text){
    return String(text||'')
      .replace(/\u00a0/g,' ')
      .replace(/[ \t]+\n/g,'\n')
      .replace(/\n{3,}/g,'\n\n')
      .split('\n')
      .map(function(line){return line.trim();})
      .filter(function(line){return line.length>1;})
      .join('\n')
      .replace(/[ ]{2,}/g,' ')
      .trim();
  }

  function pickReadableRoot(){
    var selectors=[
      'dialog[open]',
      '[role="dialog"]',
      '.modal',
      '[id*="modal"]',
      'main',
      '[role="main"]',
      'article',
      '.wrap',
      '.container',
      '.content',
      '#content',
      '#app',
      '.card'
    ];
    var best=document.body;
    var bestScore=0;
    selectors.forEach(function(selector){
      document.querySelectorAll(selector).forEach(function(node){
        if(!isVisibleElement(node))return;
        var text=extractText(node);
        if(text.length>bestScore){
          best=node;
          bestScore=text.length;
        }
      });
    });
    return best||document.body;
  }

  function extractText(node){
    if(!node)return'';
    var clone=node.cloneNode(true);
    clone.querySelectorAll('[data-pvs-tts-ui],script,style,noscript,iframe,video,audio,svg,canvas').forEach(function(el){el.remove();});
    var text=(clone.innerText||clone.textContent||'');
    return cleanText(text).slice(0,14000);
  }

  function splitText(text,maxLen){
    var normalized=cleanText(text);
    if(!normalized)return[];
    var pieces=[];
    var paragraphs=normalized.split(/\n{2,}/);
    paragraphs.forEach(function(paragraph){
      var rest=paragraph.trim();
      while(rest.length>maxLen){
        var cut=rest.lastIndexOf('. ',maxLen);
        if(cut<80)cut=rest.lastIndexOf(' ',maxLen);
        if(cut<40)cut=maxLen;
        pieces.push(rest.slice(0,cut+1).trim());
        rest=rest.slice(cut+1).trim();
      }
      if(rest)pieces.push(rest);
    });
    return pieces.filter(Boolean);
  }

  function getPreferredVoice(){
    var voices=state.voices||[];
    if(!voices.length)return null;
    var selected=voices.find(function(v){return v.voiceURI===state.settings.voice;});
    if(selected)return selected;
    return voices.find(function(v){return /^fr\b/i.test(v.lang||'');}) || voices[0] || null;
  }

  function fillVoices(){
    var select=document.getElementById('pvsTtsVoice');
    if(!select)return;
    var voices=window.speechSynthesis.getVoices()||[];
    state.voices=voices.slice().sort(function(a,b){
      return String(a.lang||'').localeCompare(String(b.lang||'')) || String(a.name||'').localeCompare(String(b.name||''));
    });
    select.innerHTML='';
    if(!state.voices.length){
      var empty=document.createElement('option');
      empty.value='';
      empty.textContent='Voix du navigateur indisponibles';
      select.appendChild(empty);
      return;
    }
    state.voices.forEach(function(voice){
      var opt=document.createElement('option');
      opt.value=voice.voiceURI;
      opt.textContent=voice.name+' ('+voice.lang+')';
      select.appendChild(opt);
    });
    var preferred=getPreferredVoice();
    if(preferred){
      select.value=preferred.voiceURI;
      state.settings.voice=preferred.voiceURI;
      saveSettings();
    }
  }

  function stopSpeaking(silent){
    if(hasSpeechSupport())window.speechSynthesis.cancel();
    state.chunks=[];
    state.index=0;
    state.currentUtterance=null;
    state.speaking=false;
    state.paused=false;
    updatePauseLabel();
    if(!silent)updateStatus('Lecture arretee.');
  }

  function speakNextChunk(){
    if(!hasSpeechSupport()){
      updateStatus('La synthese vocale du navigateur est indisponible ici.');
      return;
    }
    if(state.index>=state.chunks.length){
      stopSpeaking(true);
      updateStatus('Lecture terminee.');
      return;
    }
    var utterance=new SpeechSynthesisUtterance(state.chunks[state.index]);
    var voice=getPreferredVoice();
    if(voice){
      utterance.voice=voice;
      utterance.lang=voice.lang||'fr-FR';
    }else{
      utterance.lang='fr-FR';
    }
    utterance.rate=state.settings.rate;
    utterance.pitch=1;
    utterance.volume=1;
    utterance.onend=function(){
      if(state.paused)return;
      state.index+=1;
      state.currentUtterance=null;
      speakNextChunk();
    };
    utterance.onerror=function(){
      stopSpeaking(true);
      updateStatus('La lecture vocale a rencontre un probleme.');
    };
    state.currentUtterance=utterance;
    window.speechSynthesis.speak(utterance);
  }

  function startSpeaking(text,label){
    var chunks=splitText(text,240);
    if(!chunks.length){
      updateStatus('Aucun texte lisible n a ete trouve.');
      return;
    }
    stopSpeaking(true);
    state.chunks=chunks;
    state.index=0;
    state.speaking=true;
    state.paused=false;
    updatePauseLabel();
    updateStatus('Lecture: '+label+'.');
    speakNextChunk();
  }

  function speakSelection(){
    var text=getSelectedText();
    if(!text){
      updateStatus('Selectionne un texte puis relance "Lire la selection".');
      return;
    }
    startSpeaking(text,'selection');
  }

  function speakPage(){
    var text=getSelectedText();
    if(text){
      startSpeaking(text,'selection active');
      return;
    }
    var root=pickReadableRoot();
    startSpeaking(extractText(root),'page');
  }

  function togglePause(){
    if(!hasSpeechSupport()){
      updateStatus('La synthese vocale du navigateur est indisponible ici.');
      return;
    }
    if(window.speechSynthesis.speaking && !state.paused){
      window.speechSynthesis.pause();
      state.paused=true;
      updatePauseLabel();
      updateStatus('Lecture en pause.');
      return;
    }
    if(state.paused){
      window.speechSynthesis.resume();
      state.paused=false;
      updatePauseLabel();
      updateStatus('Lecture reprise.');
      return;
    }
    updateStatus('Aucune lecture en cours.');
  }

  function init(){
    buildUi();
    if(hasSpeechSupport()){
      fillVoices();
      if(typeof window.speechSynthesis.onvoiceschanged!=='undefined'){
        window.speechSynthesis.onvoiceschanged=fillVoices;
      }
    }
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init,{once:true});
  }else{
    init();
  }
})();

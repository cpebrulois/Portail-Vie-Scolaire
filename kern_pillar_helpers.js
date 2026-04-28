/* ============================================================
 * KERN PILLAR HELPERS v1.2 - "Aide Kern" et "Resume du cours"
 * ============================================================
 * v1.1 : fix decodage Uint8Array, persistance localStorage, setKernInputBusy.
 * v1.2 : sampling anti-boucle (temp 0.45, pen 1.35, topK 40),
 *        prompts compacts pour modele 0.5B (5 modules max, system prompt court).
 * ============================================================ */
(function(){
  'use strict';

  var pillarCoachMode = null;        // pillarKey courant ou null
  var pillarSummaryCache = {};       // cache resumes par pillarKey
  var origSendKern = null;           // sauvegarde de la fonction sendKern d'origine

  // ── Persistance localStorage des messages Kern Pilier ──────────
  var KP_MSGS_KEY = 'KP_PILLAR_MSGS_V1';
  var KP_MAX_MSGS = 80;

  function kpSaveMsg(role, text) {
    try {
      var arr = JSON.parse(localStorage.getItem(KP_MSGS_KEY) || '[]');
      arr.push({ role: role, text: String(text || ''), t: Date.now() });
      if (arr.length > KP_MAX_MSGS) arr.splice(0, arr.length - KP_MAX_MSGS);
      localStorage.setItem(KP_MSGS_KEY, JSON.stringify(arr));
    } catch(e) {}
  }

  function kpClearMsgs() {
    try { localStorage.removeItem(KP_MSGS_KEY); } catch(e) {}
  }

  function kpRestoreHistory() {
    var msgs;
    try { msgs = JSON.parse(localStorage.getItem(KP_MSGS_KEY) || '[]'); } catch(e) { msgs = []; }
    if (!msgs.length) return;
    var container = getMessagesEl();
    if (!container) return;
    if (container.children.length > 0) return;
    msgs.forEach(function(m) {
      var d = document.createElement('div');
      d.className = 'agora-msg ' + (m.role === 'user' ? 'user' : 'ai');
      var safe = String(m.text)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
      d.innerHTML = '<span class="msg-name">' + (m.role === 'user' ? 'Toi' : 'Kern') + '</span>' + safe;
      container.appendChild(d);
    });
    container.scrollTop = container.scrollHeight;
    openKernPanel();
  }

  function getPillarByKey(key){
    if (typeof window.PILLARS === 'undefined' || !Array.isArray(window.PILLARS)) return null;
    for (var i=0;i<window.PILLARS.length;i++){
      if (window.PILLARS[i].key === key) return window.PILLARS[i];
    }
    return null;
  }

  function getMessagesEl(){ return document.getElementById('agora-messages'); }
  function getPanelEl(){ return document.getElementById('agora-panel'); }
  function getInputEl(){ return document.getElementById('agora-input'); }

  function appendKernMsg(role, htmlText, extraClass){
    var msgs = getMessagesEl();
    if (!msgs) { console.warn('[KernPillar] #agora-messages introuvable'); return null; }
    var d = document.createElement('div');
    d.className = 'agora-msg ' + (role==='user' ? 'user' : 'ai') + (extraClass ? ' '+extraClass : '');
    d.innerHTML = '<span class="msg-name">' + (role==='user' ? 'Toi' : 'Kern') + '</span>' + htmlText;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  }

  function openKernPanel(){
    var panel = getPanelEl();
    if (panel && !panel.classList.contains('open')) panel.classList.add('open');
    var section = document.getElementById('agora-section');
    if (section) try { section.scrollIntoView({behavior:'smooth', block:'start'}); } catch(e){}
  }

  // Active ou desactive l'input + le bouton Envoyer.
  // agora_pixhare.js les desactive pendant ses propres operations.
  function setKernInputBusy(busy) {
    var inp = getInputEl();
    var btn = document.getElementById('agora-send');
    if (inp) inp.disabled = !!busy;
    if (btn) btn.disabled = !!busy;
    if (!busy && inp) inp.focus();
  }

  // Activation LocalLLM avec UI dans le panneau Kern
  async function ensureLLMReady(){
    if (!window.LocalLLM){
      alert("Module LocalLLM absent. Verifie que local_llm.js est inclus dans cette page.");
      return false;
    }
    if (window.LocalLLM.isReady()) return true;

    openKernPanel();
    var loading = appendKernMsg('kern',
      '<b>🔄 Activation de l\'assistant local...</b><br>' +
      '<span class="kern-llm-progress">Telechargement du modele Qwen2.5-0.5B (~400 MB) - premiere visite uniquement, ensuite cache navigateur.</span>');
    var progressSpan = loading ? loading.querySelector('.kern-llm-progress') : null;

    try {
      await window.LocalLLM.activate({
        onProgress: function(p){
          if (progressSpan && p && p.text) progressSpan.textContent = p.text;
        },
        onReady: function(){
          if (loading) loading.innerHTML = '<span class="msg-name">Kern</span><b>✓ Assistant local pret.</b>';
          setKernInputBusy(false);
        }
      });
      return true;
    } catch(e){
      if (progressSpan) progressSpan.textContent = 'Echec : ' + (e.message || e);
      console.error('[KernPillar] Activation LocalLLM echouee :', e);
      return false;
    }
  }

  // 5 modules max : limiter la taille du contexte pour le modele 0.5B.
  function buildModulesList(pillar){
    return pillar.modules.slice(0, 5).map(function(m){
      return '- ' + (m.name || '');
    }).join('\n');
  }

  // ============================================================
  // RESUME DU COURS
  // ============================================================
  window.requestKernPillarSummary = async function(pillarKey){
    var pillar = getPillarByKey(pillarKey);
    if (!pillar){ alert('Pilier inconnu : ' + pillarKey); return; }

    openKernPanel();

    if (pillarSummaryCache[pillarKey]){
      appendKernMsg('kern',
        '<b>📜 Resume du Pilier ' + (pillar.title || pillar.key) + '</b> <i>(en cache)</i><br><br>' +
        pillarSummaryCache[pillarKey].replace(/\n/g, '<br>'));
      return;
    }

    var ok = await ensureLLMReady();
    if (!ok) return;

    var msgEl = appendKernMsg('kern',
      '<b>📜 Resume du Pilier ' + (pillar.title || pillar.key) + '</b><br><br>' +
      '<span class="kern-stream"><i>Generation du resume...</i></span>');
    var streamSpan = msgEl ? msgEl.querySelector('.kern-stream') : null;

    setKernInputBusy(true);

    var modulesList = buildModulesList(pillar);
    // Prompt compact : modele 0.5B, contexte 1024 tokens max.
    var systemPrompt =
      "Tu es Kern, assistant de formation anti-harcelement.\n" +
      "Reponds en francais, 3 phrases maximum, clair et simple.\n" +
      "Pas de titres. Pas de listes. Pas de repetitions.";

    var userPrompt =
      "Pilier : " + (pillar.title || pillar.key) +
      (pillar.desc ? " — " + pillar.desc : "") +
      "\nPremiers modules : " + modulesList +
      "\n\nFais un resume tres court de ce pilier en 3 phrases simples pour un eleve.";

    var streaming = '';
    var result = await window.LocalLLM.ask({
      systemPrompt: systemPrompt,
      userPrompt: userPrompt,
      options: {
        temperature: 0.45, maxTokens: 160, topK: 40, topP: 0.85, repeatPenalty: 1.35,
        onChunk: function(piece){
          streaming += piece;
          if (streamSpan) streamSpan.textContent = streaming;
        }
      }
    });

    if (result && result.ok && result.text){
      pillarSummaryCache[pillarKey] = result.text;
      if (streamSpan) streamSpan.textContent = result.text;
      kpSaveMsg('kern', '📜 Résumé — ' + (pillar.title || pillar.key) + '\n\n' + result.text);
    } else {
      if (streamSpan) streamSpan.textContent = '[erreur : ' + ((result && result.error) || 'inconnue') + ']';
    }
    setKernInputBusy(false);
  };

  // ============================================================
  // AIDE KERN (mode coach pilier)
  // ============================================================
  window.startKernPillarCoach = async function(pillarKey){
    var pillar = getPillarByKey(pillarKey);
    if (!pillar){ alert('Pilier inconnu : ' + pillarKey); return; }

    openKernPanel();
    var ok = await ensureLLMReady();
    if (!ok) return;

    pillarCoachMode = pillarKey;

    appendKernMsg('kern',
      '<b>🛡️ Mode Coach - Pilier ' + (pillar.title || pillar.key) + '</b><br>' +
      'Pose-moi tes questions sur les notions de ce pilier. Je m\'appuie sur les ' + pillar.modules.length + ' modules.<br>' +
      'Pour quitter ce mode et revenir a la conversation normale, ecris : <code>mode normal</code>');
    kpSaveMsg('kern', '🛡️ Mode Coach - Pilier ' + (pillar.title || pillar.key) +
      '\nPose-moi tes questions sur les notions de ce pilier. ' +
      "Pour quitter, ecris : mode normal");

    var input = getInputEl();
    if (input) input.placeholder = 'Pose ta question sur le Pilier ' + (pillar.title || pillar.key) + '...';
    setKernInputBusy(false);

    // Sauvegarde et remplacement de sendKern
    if (origSendKern === null && typeof window.sendKern === 'function'){
      origSendKern = window.sendKern;
    }

    window.sendKern = async function(){
      var inp = getInputEl();
      var text = inp && inp.value ? inp.value.trim() : '';
      if (!text) return;
      inp.value = '';
      appendKernMsg('user', text.replace(/\n/g, '<br>'));
      kpSaveMsg('user', text);

      // Sortie du mode coach ?
      if (/^mode\s+normal$/i.test(text)){
        pillarCoachMode = null;
        appendKernMsg('kern',
          'Mode normal reactive. Tu peux poser n\'importe quelle question, je reponds en mode standard.');
        if (origSendKern){ window.sendKern = origSendKern; }
        if (inp) inp.placeholder = 'Demande une aventure, une scene a choix, ou decris une situation reelle a clarifier...';
        setKernInputBusy(false);
        return;
      }

      setKernInputBusy(true);

      var modulesList = buildModulesList(pillar);
      // Prompt tres compact pour le modele 0.5B.
      var systemPrompt =
        "Tu es Kern, coach anti-harcelement pour college.\n" +
        "Reponds en francais, 2 a 3 phrases courtes, simples, directes.\n" +
        "Pas de titres. Pas de repetition. Si tu ne sais pas, dis-le.";

      var userPrompt =
        "Pilier : " + (pillar.title || pillar.key) +
        "\nModules : " + modulesList +
        "\n\nQuestion : " + text;

      var msgEl = appendKernMsg('kern', '<span class="kern-stream"><i>Reflexion...</i></span>');
      var streamSpan = msgEl ? msgEl.querySelector('.kern-stream') : null;
      var streaming = '';

      var result = await window.LocalLLM.ask({
        systemPrompt: systemPrompt,
        userPrompt: userPrompt,
        options: {
          temperature: 0.45, maxTokens: 140, topK: 40, topP: 0.85, repeatPenalty: 1.35,
          onChunk: function(piece){
            streaming += piece;
            if (streamSpan) streamSpan.textContent = streaming;
          }
        }
      });

      if (result && result.ok && result.text){
        if (streamSpan) streamSpan.textContent = result.text;
        kpSaveMsg('kern', result.text);
      } else {
        if (streamSpan) streamSpan.textContent = '[erreur : ' + ((result && result.error) || 'inconnue') + ']';
      }
      setKernInputBusy(false);
    };
  };

  // ── Restauration historique + hook clearKernHistory ─────────────
  window.addEventListener('load', function () {
    kpRestoreHistory();
    if (typeof window.clearKernHistory === 'function') {
      var _origClear = window.clearKernHistory;
      window.clearKernHistory = function () {
        kpClearMsgs();
        return _origClear.apply(this, arguments);
      };
    }
  });

  console.log('[kern_pillar_helpers] v1.2 charge.');
})();

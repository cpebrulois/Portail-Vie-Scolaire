/* ============================================================
 * KERN PILLAR HELPERS - "Aide Kern" et "Resume du cours"
 * ============================================================
 * Definit les deux fonctions globales appelees par index_PIXHARe.html :
 *   - window.requestKernPillarSummary(pillarKey)
 *   - window.startKernPillarCoach(pillarKey)
 *
 * Ces fonctions appellent window.LocalLLM (charge depuis local_llm.js).
 * Aucune cle API. Tout reste dans le navigateur.
 *
 * Pre-requis : <script src="local_llm.js"></script> AVANT ce fichier.
 *              window.PILLARS doit exister (defini dans index_PIXHARe.html).
 * ============================================================ */
(function(){
  'use strict';

  var pillarCoachMode = null;        // pillarKey courant ou null
  var pillarSummaryCache = {};       // cache resumes par pillarKey
  var origSendKern = null;           // sauvegarde de la fonction sendKern d'origine

  // ── Persistance localStorage des messages Kern Pilier ──────────
  // Les messages appendKernMsg() ne vivent que dans le DOM et disparaissent
  // au rechargement. Ce bloc les sauvegarde et les restaure.
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
    // Ne restaurer que si le conteneur est vide (eviter doublon si agora_pixhare a deja rendu)
    if (container.children.length > 0) return;
    msgs.forEach(function(m) {
      var d = document.createElement('div');
      d.className = 'agora-msg ' + (m.role === 'user' ? 'user' : 'ai');
      // Echappement minimal pour eviter XSS sur les textes restaures
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
  // agora_pixhare.js les desactive pendant ses propres operations ; on doit
  // les redonner en main apres chaque appel LocalLLM cote kern_pillar_helpers.
  function setKernInputBusy(busy) {
    var inp = getInputEl();
    var btn = document.getElementById('agora-send');
    if (inp) inp.disabled = !!busy;
    if (btn) btn.disabled = !!busy;
    if (!busy && inp) {
      inp.focus();
    }
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
          // agora_pixhare.js a peut-etre bloque l'input pendant le chargement : on le libere.
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

  function buildModulesList(pillar){
    return pillar.modules.slice(0, 12).map(function(m){
      return '- ' + (m.id || '') + ' : ' + (m.name || '');
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

    // Bloquer l'input pendant la generation du resume
    setKernInputBusy(true);

    var modulesList = buildModulesList(pillar);
    var systemPrompt =
      (window.LocalLLM.SOCLE_COMMUN || '') +
      "\n\nTu es Kern, formateur PIX pHARe. Tu prepares un resume pedagogique pour un eleve qui vient de terminer un pilier." +
      "\nTon resume est court : 4 a 6 phrases naturelles. Pas de titres, pas de listes numerotees." +
      "\nTu rappelles l'idee centrale du pilier et 2 ou 3 notions cles que l'eleve doit retenir.";

    var userPrompt =
      "Pilier : " + (pillar.title || pillar.key) +
      (pillar.desc ? "\nDescription : " + pillar.desc : "") +
      "\nModules (" + pillar.modules.length + " au total) :\n" + modulesList +
      "\n\nFais un resume pedagogique des notions cles de ce pilier, en 4-6 phrases simples, comme si tu parlais a l'eleve qui vient de finir.";

    var streaming = '';
    var result = await window.LocalLLM.ask({
      systemPrompt: systemPrompt,
      userPrompt: userPrompt,
      options: {
        temperature: 0.05, maxTokens: 240, topK: 20, topP: 0.75, repeatPenalty: 1.20,
        onChunk: function(piece){
          streaming += piece;
          if (streamSpan) streamSpan.textContent = streaming;
        }
      }
    });

    if (result && result.ok && result.text){
      pillarSummaryCache[pillarKey] = result.text;
      if (streamSpan) streamSpan.textContent = result.text;
      // Persister dans localStorage : sauvegarder le resume final (pas le streaming)
      kpSaveMsg('kern', '📜 Résumé — ' + (pillar.title || pillar.key) + '\n\n' + result.text);
    } else {
      if (streamSpan) streamSpan.textContent = '[erreur : ' + ((result && result.error) || 'inconnue') + ']';
    }
    // Liberer l'input apres la generation du resume
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
    // Persister l'annonce du mode coach
    kpSaveMsg('kern', '🛡️ Mode Coach - Pilier ' + (pillar.title || pillar.key) +
      '\nPose-moi tes questions sur les notions de ce pilier. ' +
      "Pour quitter, ecris : mode normal");

    var input = getInputEl();
    if (input) input.placeholder = 'Pose ta question sur le Pilier ' + (pillar.title || pillar.key) + '...';
    // Force la liberation de l'input : agora_pixhare.js l'a peut-etre bloque
    // pendant le chargement du modele et ne sait pas que c'est termine.
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
      // Persister le message utilisateur immediatement
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

      // Bloquer l'input pendant la generation pour eviter les doubles envois
      setKernInputBusy(true);

      var modulesList = buildModulesList(pillar);
      var systemPrompt =
        (window.LocalLLM.SOCLE_COMMUN || '') +
        "\n\nTu es Kern, coach pHARe en mode 'Pilier " + (pillar.title || pillar.key) + "'." +
        "\nTu aides un eleve a comprendre les notions de ce pilier specifique." +
        "\nReponse courte : 4 a 6 phrases. Pas d'invention. Si l'info manque, dis-le et propose de demander a un adulte.";

      var userPrompt =
        "Pilier de formation : " + (pillar.title || pillar.key) +
        "\nModules du pilier :\n" + modulesList +
        "\n\nQuestion de l'eleve : " + text;

      var msgEl = appendKernMsg('kern', '<span class="kern-stream"><i>Reflexion...</i></span>');
      var streamSpan = msgEl ? msgEl.querySelector('.kern-stream') : null;
      var streaming = '';

      var result = await window.LocalLLM.ask({
        systemPrompt: systemPrompt,
        userPrompt: userPrompt,
        options: {
          temperature: 0.05, maxTokens: 240, topK: 20, topP: 0.75, repeatPenalty: 1.20,
          onChunk: function(piece){
            streaming += piece;
            if (streamSpan) streamSpan.textContent = streaming;
          }
        }
      });

      if (result && result.ok && result.text){
        if (streamSpan) streamSpan.textContent = result.text;
        // Persister la reponse finale du coach (pas le streaming intermediaire)
        kpSaveMsg('kern', result.text);
      } else {
        if (streamSpan) streamSpan.textContent = '[erreur : ' + ((result && result.error) || 'inconnue') + ']';
      }
      // Toujours liberer l'input apres la generation, qu'elle ait reussi ou non
      setKernInputBusy(false);
    };
  };

  // ── Restauration historique + hook clearKernHistory ─────────────
  // On attend que tous les scripts (agora_pixhare.js inclus) soient charges
  // avant de restaurer, pour ne pas ecraser ce qu'agora_pixhare aurait rendu.
  window.addEventListener('load', function () {
    // Restaurer les messages Kern Pilier depuis localStorage
    kpRestoreHistory();

    // Si clearKernHistory existe (defini dans agora_pixhare.js), on l'enveloppe
    // pour effacer aussi notre stock localStorage quand l'utilisateur efface la conv.
    if (typeof window.clearKernHistory === 'function') {
      var _origClear = window.clearKernHistory;
      window.clearKernHistory = function () {
        kpClearMsgs();
        return _origClear.apply(this, arguments);
      };
    }
  });

  console.log('[kern_pillar_helpers] charge. window.requestKernPillarSummary et window.startKernPillarCoach disponibles.');
})();

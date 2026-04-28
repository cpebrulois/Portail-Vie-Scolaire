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
    } else {
      if (streamSpan) streamSpan.textContent = '[erreur : ' + ((result && result.error) || 'inconnue') + ']';
    }
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

    var input = getInputEl();
    if (input) input.placeholder = 'Pose ta question sur le Pilier ' + (pillar.title || pillar.key) + '...';

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

      // Sortie du mode coach ?
      if (/^mode\s+normal$/i.test(text)){
        pillarCoachMode = null;
        appendKernMsg('kern',
          'Mode normal reactive. Tu peux poser n\'importe quelle question, je reponds en mode standard.');
        if (origSendKern){ window.sendKern = origSendKern; }
        if (inp) inp.placeholder = 'Demande une aventure, une scene a choix, ou decris une situation reelle a clarifier...';
        return;
      }

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
      } else {
        if (streamSpan) streamSpan.textContent = '[erreur : ' + ((result && result.error) || 'inconnue') + ']';
      }
    };
  };

  console.log('[kern_pillar_helpers] charge. window.requestKernPillarSummary et window.startKernPillarCoach disponibles.');
})();

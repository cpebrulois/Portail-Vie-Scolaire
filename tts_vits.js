/**
 * tts_vits.js — Synthèse vocale intégrée dans la fenêtre de chat
 * Basée sur l'approche "La Forge" (Web Speech API, sans CDN externe)
 *
 * API publique :
 *   window.PVS_VITS_SPEAK(text)  → lit le texte
 *   window.PVS_VITS_STOP()       → coupe la lecture
 *   window.PVS_VITS_READY        → true après init
 *
 * Injecte automatiquement une barre de contrôle (🔊 ON/OFF · ↩ Relire · ■ Stop)
 * dans :
 *   - #agora-panel        (Kern / PIXHARe)
 *   - #viescoAiPanel      (Hélène / Vie-Scolaire)
 */
(function () {
  if (window.PVS_VITS_READY) return;
  window.PVS_VITS_READY = true;

  // ─── État ────────────────────────────────────────────────────────
  var ttsOk  = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  var ttsOn  = true;
  var voices = [];
  var curUtt = null;
  var lastTx = '';

  // ─── Préférence persistante ──────────────────────────────────────
  function loadPref() {
    try { var r = localStorage.getItem('pvs_tts_on'); if (r !== null) ttsOn = r === '1'; } catch (e) {}
  }
  function savePref() {
    try { localStorage.setItem('pvs_tts_on', ttsOn ? '1' : '0'); } catch (e) {}
  }

  // ─── Voix françaises ─────────────────────────────────────────────
  function refreshVoices() {
    if (!ttsOk) return;
    voices = window.speechSynthesis.getVoices() || [];
  }
  function bestVoice() {
    var vs = voices.length ? voices : (window.speechSynthesis.getVoices() || []);
    if (!vs.length) return null;
    return vs.find(function (v) { return /^fr[-_]?fr$/i.test(v.lang || ''); })
        || vs.find(function (v) { return /^fr\b/i.test(v.lang || ''); })
        || vs.find(function (v) { return /french/i.test((v.name || '') + (v.lang || '')); })
        || vs[0];
  }

  // ─── Nettoyage du texte (Markdown → texte brut) ──────────────────
  function clean(t) {
    return (t || '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // ─── Contrôles UI ────────────────────────────────────────────────
  function setStatus(msg) {
    document.querySelectorAll('.pvs-tts-status').forEach(function (el) { el.textContent = msg; });
  }
  function refreshUI() {
    document.querySelectorAll('.pvs-tts-toggle').forEach(function (btn) {
      btn.textContent = ttsOn ? '🔊 ON' : '🔇 OFF';
      btn.classList.toggle('pvs-tts-off', !ttsOn);
    });
    document.querySelectorAll('.pvs-tts-replay').forEach(function (btn) {
      btn.disabled = !ttsOk || !lastTx;
    });
    document.querySelectorAll('.pvs-tts-stop').forEach(function (btn) {
      btn.disabled = !ttsOk || !curUtt;
    });
    if (!ttsOk)     setStatus('Voix indisponible');
    else if (!ttsOn) setStatus('Voix coupée');
    else             setStatus(curUtt ? '▶ Lecture...' : 'Voix prête');
  }

  // ─── API publique ─────────────────────────────────────────────────
  window.PVS_VITS_STOP = function () {
    if (!ttsOk) return;
    curUtt = null;
    window.speechSynthesis.cancel();
    refreshUI();
  };

  window.PVS_VITS_SPEAK = function (text) {
    if (!ttsOk || !ttsOn) return;
    var spoken = clean(text);
    if (!spoken) return;
    lastTx = text;
    window.PVS_VITS_STOP();
    var utt = new SpeechSynthesisUtterance(spoken);
    var v = bestVoice();
    utt.lang   = (v && v.lang) || 'fr-FR';
    if (v) utt.voice = v;
    utt.rate   = 1;
    utt.pitch  = 1;
    utt.volume = 1;
    utt.onstart = function () { curUtt = utt; setStatus('▶ Lecture...'); refreshUI(); };
    utt.onend   = function () { if (curUtt === utt) curUtt = null; setStatus('Voix prête'); refreshUI(); };
    utt.onerror = function () { if (curUtt === utt) curUtt = null; setStatus('Erreur lecture'); refreshUI(); };
    curUtt = utt;
    window.speechSynthesis.speak(utt);
    refreshUI();
  };

  function toggleTTS() {
    if (!ttsOk) { refreshUI(); return; }
    ttsOn = !ttsOn;
    savePref();
    if (!ttsOn) window.PVS_VITS_STOP();
    refreshUI();
  }
  function replayLast() { if (lastTx) window.PVS_VITS_SPEAK(lastTx); }

  // ─── Injection CSS ────────────────────────────────────────────────
  function injectStyle() {
    if (document.getElementById('pvs-tts-style')) return;
    var s = document.createElement('style');
    s.id = 'pvs-tts-style';
    s.textContent =
      '.pvs-tts-bar{'
        + 'display:flex;align-items:center;gap:6px;flex-wrap:wrap;'
        + 'padding:6px 10px;border-top:1px solid rgba(255,255,255,.07);'
        + 'background:rgba(0,0,0,.18);flex-shrink:0;'
      + '}'
      + '.pvs-tts-btn{'
        + 'appearance:none;border:1px solid rgba(99,102,241,.32);'
        + 'background:rgba(99,102,241,.13);color:#c7d2fe;'
        + 'padding:4px 10px;border-radius:999px;font-size:.6rem;font-weight:700;'
        + 'font-family:monospace;cursor:pointer;transition:.15s;letter-spacing:.4px;'
      + '}'
      + '.pvs-tts-btn:hover:not(:disabled){filter:brightness(1.2);transform:translateY(-1px);}'
      + '.pvs-tts-btn:disabled{opacity:.3;cursor:not-allowed;transform:none;}'
      + '.pvs-tts-btn.pvs-tts-off{'
        + 'background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.1);'
        + 'color:rgba(255,255,255,.3);'
      + '}'
      + '.pvs-tts-status{font-size:.58rem;color:rgba(255,255,255,.3);font-family:monospace;margin-left:auto;}';
    document.head.appendChild(s);
  }

  // ─── Construction de la barre ─────────────────────────────────────
  function buildBar(id) {
    var bar = document.createElement('div');
    bar.className = 'pvs-tts-bar';
    if (id) bar.id = id;

    function mkBtn(label, extraClass, handler) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'pvs-tts-btn' + (extraClass ? ' ' + extraClass : '');
      b.textContent = label;
      b.onclick = handler;
      bar.appendChild(b);
      return b;
    }

    mkBtn(ttsOn ? '🔊 ON' : '🔇 OFF',
          'pvs-tts-toggle' + (ttsOn ? '' : ' pvs-tts-off'),
          toggleTTS);

    var rep = mkBtn('↩ Relire', 'pvs-tts-replay', replayLast);
    rep.disabled = true;

    var stp = mkBtn('■ Stop', 'pvs-tts-stop', window.PVS_VITS_STOP);
    stp.disabled = true;

    var st = document.createElement('span');
    st.className = 'pvs-tts-status';
    st.textContent = !ttsOk ? 'Voix indisponible' : (ttsOn ? 'Voix prête' : 'Voix coupée');
    bar.appendChild(st);

    return bar;
  }

  // ─── Injection dans les panneaux ──────────────────────────────────
  function injectAgora() {
    var panel = document.getElementById('agora-panel');
    if (!panel || panel.querySelector('.pvs-tts-bar')) return;
    var before = panel.querySelector('.agora-input-row') || null;
    panel.insertBefore(buildBar('pvs-tts-kern'), before);
  }

  function injectViesco() {
    var panel = document.getElementById('viescoAiPanel');
    if (!panel || panel.querySelector('.pvs-tts-bar')) return;
    var before = document.getElementById('viescoAiFoot') || null;
    panel.insertBefore(buildBar('pvs-tts-viesco'), before);
  }

  function tryAll() {
    injectAgora();
    injectViesco();
    refreshUI();
  }

  // MutationObserver pour les panneaux créés dynamiquement
  function watch() {
    if (!window.MutationObserver) return;
    new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        m.addedNodes.forEach(function (n) {
          if (!n || !n.id) return;
          if (n.id === 'viescoAiPanel') { setTimeout(injectViesco, 30); }
          if (n.id === 'agora-panel')   { setTimeout(injectAgora,  30); }
        });
      });
    }).observe(document.body, { childList: true });
  }

  // ─── Init ─────────────────────────────────────────────────────────
  loadPref();
  injectStyle();
  if (ttsOk) {
    refreshVoices();
    if ('onvoiceschanged' in window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = refreshVoices;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { tryAll(); watch(); });
  } else {
    tryAll();
    watch();
  }
})();

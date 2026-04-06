/**
 * PVS-VITS — Synthèse vocale neurale (Piper TTS via @diffusionstudio/vits-web)
 * Drop-in pour PIXHARe / Plateforme Vie Scolaire
 *
 * Expose :
 *   window.PVS_VITS_SPEAK(text)   → synthétise et joue le texte
 *   window.PVS_VITS_STOP()        → arrête la lecture en cours
 *   window.PVS_VITS_READY         → true une fois initialisé
 *
 * Charge le modèle neural (~60 Mo) au premier appel, le met en cache OPFS.
 * Fallback automatique vers Web Speech API si VITS échoue.
 */
(function () {
  if (window.PVS_VITS_READY) return;
  window.PVS_VITS_READY = true;

  /* ── Configuration ──────────────────────────────────────────────── */
  var CDN      = 'https://esm.sh/@diffusionstudio/vits-web@1';
  var VOICES   = ['fr_FR-siwis-medium', 'fr_FR-upmc-medium', 'fr_FR-mls-medium'];
  var MAX_CHUNK = 220;   /* caractères max par chunk avant split */

  /* ── État interne ───────────────────────────────────────────────── */
  var lib         = null;   /* module vits-web une fois chargé */
  var loadPromise = null;   /* promesse de chargement unique */
  var voiceId     = VOICES[0];
  var queue       = [];     /* blobs audio en attente */
  var current     = null;   /* Audio en cours */
  var active      = false;  /* lecture en cours */

  /* ── Indicateur flottant ─────────────────────────────────────────── */
  var indicator = null;

  function getIndicator() {
    if (indicator) return indicator;
    indicator = document.createElement('div');
    indicator.id = 'pvs-vits-indicator';
    indicator.style.cssText = [
      'position:fixed;bottom:70px;left:14px;z-index:2147483000',
      'background:linear-gradient(135deg,rgba(8,20,38,.96),rgba(19,43,75,.96))',
      'color:#ffd46a;padding:7px 14px 7px 10px;border-radius:22px',
      'font-family:Arial,sans-serif;font-size:11.5px;font-weight:700;letter-spacing:.2px',
      'border:1px solid rgba(255,212,106,.38);box-shadow:0 4px 18px rgba(0,0,0,.3)',
      'pointer-events:none;opacity:0;transition:opacity .22s;white-space:nowrap',
      'display:flex;align-items:center;gap:7px'
    ].join(';');
    document.body.appendChild(indicator);
    return indicator;
  }

  function showMsg(msg) {
    var el = getIndicator();
    el.textContent = msg;
    el.style.opacity = '1';
  }

  function hideMsg() {
    var el = getIndicator();
    if (el) el.style.opacity = '0';
  }

  /* ── Chargement lazy du module VITS ─────────────────────────────── */
  function loadLib() {
    if (loadPromise) return loadPromise;
    loadPromise = import(CDN)
      .then(function (mod) {
        lib = mod;
        /* Tente de résoudre la meilleure voix française disponible */
        if (typeof lib.voices === 'function') {
          return lib.voices().then(function (all) {
            var keys = Object.keys(all || {});
            for (var i = 0; i < VOICES.length; i++) {
              if (keys.indexOf(VOICES[i]) !== -1) { voiceId = VOICES[i]; break; }
            }
            return lib;
          }).catch(function () { return lib; });
        }
        return lib;
      })
      .catch(function (err) {
        loadPromise = null;   /* réessayable */
        throw err;
      });
    return loadPromise;
  }

  /* ── Découpage du texte en phrases ──────────────────────────────── */
  function splitPhrases(text) {
    var clean = (text || '')
      .replace(/\*\*?([^*]+)\*\*?/g, '$1')    /* markdown bold */
      .replace(/#{1,6}\s*/g, '')               /* markdown headers */
      .replace(/\s+/g, ' ')
      .trim();
    if (!clean) return [];

    /* Split sur ponctuation forte puis sur virgules si phrase > MAX_CHUNK */
    var parts = clean.split(/(?<=[.!?…»\n])\s+/);
    var out = [];
    parts.forEach(function (p) {
      p = p.trim();
      if (!p) return;
      if (p.length <= MAX_CHUNK) { out.push(p); return; }
      /* phrase longue : split sur virgule/point-virgule */
      var sub = p.split(/(?<=[,;:])\s+/);
      var buf = '';
      sub.forEach(function (s) {
        if ((buf + ' ' + s).trim().length <= MAX_CHUNK) {
          buf = (buf ? buf + ' ' : '') + s;
        } else {
          if (buf) out.push(buf.trim());
          buf = s;
        }
      });
      if (buf) out.push(buf.trim());
    });
    return out.filter(function (s) { return s.length > 1; });
  }

  /* ── File de lecture audio ───────────────────────────────────────── */
  function stopAll() {
    active = false;
    queue  = [];
    if (current) {
      try { current.pause(); current.src = ''; } catch (e) {}
      current = null;
    }
    hideMsg();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }

  function playNext() {
    if (!active || !queue.length) {
      active = false;
      hideMsg();
      return;
    }
    var blob = queue.shift();
    var url  = URL.createObjectURL(blob);
    var audio = new Audio(url);
    current = audio;
    showMsg('🔊 Lecture…');
    audio.onended = function () {
      URL.revokeObjectURL(url);
      current = null;
      playNext();
    };
    audio.onerror = function () {
      URL.revokeObjectURL(url);
      current = null;
      playNext();
    };
    audio.play().catch(function () {
      URL.revokeObjectURL(url);
      current = null;
      playNext();
    });
  }

  /* ── Synthèse d'un chunk via VITS ───────────────────────────────── */
  function synthesizeChunk(phrase, isFirst) {
    return lib.predict(
      { text: phrase, voiceId: voiceId },
      function (p) {
        if (p && p.total > 0 && isFirst) {
          var pct = Math.round((p.loaded / p.total) * 100);
          showMsg('🔊 Chargement vocal… ' + pct + '%');
        }
      }
    );
  }

  /* ── Fallback Web Speech API ─────────────────────────────────────── */
  function fallbackWSA(text) {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
    window.speechSynthesis.cancel();
    var utt  = new SpeechSynthesisUtterance(text);
    utt.lang = 'fr-FR';
    utt.rate = 1;
    var voices = window.speechSynthesis.getVoices();
    var frVoice = voices.find(function (v) { return /^fr\b/i.test(v.lang); });
    if (frVoice) utt.voice = frVoice;
    window.speechSynthesis.speak(utt);
  }

  /* ── API publique ────────────────────────────────────────────────── */
  window.PVS_VITS_SPEAK = async function (text) {
    if (!text || !text.trim()) return;
    stopAll();

    var phrases = splitPhrases(text);
    if (!phrases.length) return;

    active = true;

    try {
      /* Chargement du module si nécessaire */
      if (!lib) {
        showMsg('🔊 Chargement moteur vocal (1ère fois, ~10s sur fibre)…');
        await loadLib();
      }

      /* Synthèse + mise en file phrase par phrase */
      for (var i = 0; i < phrases.length; i++) {
        if (!active) break;
        var blob = await synthesizeChunk(phrases[i], i === 0);
        queue.push(blob);
        /* Démarre la lecture dès que le 1er blob est prêt */
        if (i === 0) {
          showMsg('🔊 Lecture…');
          playNext();
        }
      }
    } catch (err) {
      console.warn('[PVS-VITS] Échec VITS, bascule Web Speech API :', err.message || err);
      hideMsg();
      stopAll();
      fallbackWSA(text);
    }
  };

  window.PVS_VITS_STOP = function () {
    stopAll();
  };

})();

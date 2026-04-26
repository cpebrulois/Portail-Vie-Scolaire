/* LOCAL LLM v2.1 - moteur partage Kern / Helene / Agora / Epictete
   Pile : wllama (jsDelivr) + Qwen2.5-0.5B-Instruct-Q4 (HuggingFace).
   Inference 100% navigateur, RGPD souverain.
   Sampling Qwen-friendly (teste GPT5.5+Aurelien) : temp 0.05, top_k 20, top_p 0.75, penalty 1.20. */
(function () {
  'use strict';

  var MODEL_REPO = 'lmstudio-community/Qwen2.5-0.5B-Instruct-GGUF';
  var MODEL_FILE = 'Qwen2.5-0.5B-Instruct-Q4_K_M.gguf';
  var N_CTX = 768;
  var N_THREADS = 1;

  var WLLAMA_ESM = 'https://cdn.jsdelivr.net/npm/@wllama/wllama/esm/index.js';
  var WLLAMA_WASM_PATHS = {
    'single-thread/wllama.wasm': 'https://cdn.jsdelivr.net/npm/@wllama/wllama/esm/single-thread/wllama.wasm',
    'multi-thread/wllama.wasm':  'https://cdn.jsdelivr.net/npm/@wllama/wllama/esm/multi-thread/wllama.wasm'
  };

  var DEFAULTS = { temperature: 0.05, maxTokens: 120, topK: 20, topP: 0.75, repeatPenalty: 1.20 };
  var STOP_PROMPTS = ['<|im_end|>', '<|im_start|>'];

  var SOCLE_COMMUN = [
    "Tu reponds en francais clair, simple et naturel.",
    "Tu reponds court.",
    "Tu reponds directement a l'utilisateur.",
    "Tu ne dois jamais expliquer la consigne.",
    "Tu ne dois jamais decrire ce que tu es en train de faire.",
    "Tu ne dois jamais ecrire 'la premiere phrase', 'la deuxieme phrase', 'action concrete', 'format obligatoire'.",
    "Tu ne dois jamais ecrire de titres ni de listes numerotees sauf si on te le demande explicitement.",
    "Tu ne dois pas inventer d'information absente du contexte.",
    "Si l'information manque, dis-le simplement.",
    "Tu ne fais pas de diagnostic.",
    "Tu ne prends pas de decision a la place de l'utilisateur.",
    "Tu poses une question utile si l'information manque."
  ].join('\n');

  var wllama = null, activated = false, activating = null, loadedAt = null, lastError = null;

  function buildChatML(systemPrompt, userPrompt) {
    return ('<|im_start|>system\n' + (systemPrompt || '').trim() + '\n<|im_end|>\n' +
            '<|im_start|>user\n'   + (userPrompt   || '').trim() + '\n<|im_end|>\n' +
            '<|im_start|>assistant\n');
  }

  function buildPrompt(parts) {
    parts = parts || {};
    var socle      = ((parts.socle != null ? parts.socle : SOCLE_COMMUN) || '').trim();
    var persona    = (parts.persona    || '').trim();
    var mode       = (parts.mode       || '').trim();
    var format     = (parts.format     || '').trim();
    var ragContext = (parts.ragContext || '').trim();
    var userMsg    = (parts.userMessage|| '').trim();

    var sysBlocks = [];
    if (socle)   sysBlocks.push(socle);
    if (persona) sysBlocks.push(persona);
    if (mode)    sysBlocks.push(mode);
    if (format)  sysBlocks.push(format);
    var systemPrompt = sysBlocks.join('\n\n');

    var userBlocks = [];
    if (ragContext) {
      userBlocks.push("Contexte local utile :\n" + ragContext +
        "\n\nUtilise ce contexte seulement s'il aide a repondre. Si insuffisant, dis que l'information manque.");
    }
    userBlocks.push(userMsg);
    var userPrompt = userBlocks.join('\n\n');

    return { systemPrompt: systemPrompt, userPrompt: userPrompt, full: buildChatML(systemPrompt, userPrompt) };
  }

  function messagesToChatML(messages) {
    var prompt = '';
    var arr = messages || [];
    for (var i = 0; i < arr.length; i++) {
      var m = arr[i];
      if (!m || !m.role || m.content == null) continue;
      prompt += '<|im_start|>' + m.role + '\n' + String(m.content).trim() + '\n<|im_end|>\n';
    }
    prompt += '<|im_start|>assistant\n';
    return prompt;
  }

  function cleanOutput(raw) {
    if (!raw) return '';
    var out = raw;
    var stops = STOP_PROMPTS.concat(['<|endoftext|>']);
    for (var i = 0; i < stops.length; i++) {
      var idx = out.indexOf(stops[i]);
      if (idx >= 0) out = out.slice(0, idx);
    }
    return out.trim();
  }

  async function activate(opts) {
    opts = opts || {};
    if (activated) { if (opts.onReady) opts.onReady({ alreadyReady: true }); return true; }
    if (activating) return activating;
    activating = (async function () {
      try {
        if (opts.onProgress) opts.onProgress({ stage: 'wllama_import', progress: 0, text: 'Import wllama...' });
        var wllamaMod = await import(WLLAMA_ESM);
        var Wllama = wllamaMod.Wllama;
        if (!Wllama) throw new Error("Module wllama invalide (Wllama introuvable)");
        wllama = new Wllama(WLLAMA_WASM_PATHS);
        if (opts.onProgress) opts.onProgress({ stage: 'model_download', progress: 0.05, text: "Telechargement Qwen2.5-0.5B (~400 MB)..." });
        await wllama.loadModelFromHF(MODEL_REPO, MODEL_FILE, {
          n_ctx: N_CTX, n_threads: N_THREADS, useCache: true,
          progressCallback: function (p) {
            if (opts.onProgress && p.total > 0) {
              var progress = 0.05 + 0.9 * (p.loaded / p.total);
              var mb = (p.loaded / 1024 / 1024).toFixed(1);
              var tot = (p.total / 1024 / 1024).toFixed(0);
              opts.onProgress({ stage: 'model_download', progress: progress,
                text: 'Telechargement : ' + mb + ' / ' + tot + ' MB (' + Math.round(progress * 100) + '%)',
                loaded: p.loaded, total: p.total });
            }
          }
        });
        activated = true; loadedAt = Date.now();
        if (opts.onProgress) opts.onProgress({ stage: 'ready', progress: 1, text: 'Pret.' });
        if (opts.onReady) opts.onReady({ alreadyReady: false });
        return true;
      } catch (err) {
        lastError = err; activating = null;
        console.error('[LocalLLM] Activation echouee :', err);
        if (opts.onError) opts.onError(err);
        throw err;
      }
    })();
    return activating;
  }

  async function ask(args) {
    args = args || {};
    if (!activated) throw new Error("LocalLLM non active. Appelle window.LocalLLM.activate() d'abord.");
    var promptText;
    if (typeof args.fullPrompt === 'string') {
      promptText = args.fullPrompt;
    } else if (typeof args.systemPrompt === 'string' || typeof args.userPrompt === 'string') {
      promptText = buildChatML(args.systemPrompt || '', args.userPrompt || '');
    } else {
      throw new Error("LocalLLM.ask : fournis fullPrompt OU (systemPrompt + userPrompt)");
    }
    var opts = args.options || {};
    var params = {
      temperature:   opts.temperature   != null ? opts.temperature   : DEFAULTS.temperature,
      maxTokens:     opts.maxTokens     != null ? opts.maxTokens     : DEFAULTS.maxTokens,
      topK:          opts.topK          != null ? opts.topK          : DEFAULTS.topK,
      topP:          opts.topP          != null ? opts.topP          : DEFAULTS.topP,
      repeatPenalty: opts.repeatPenalty != null ? opts.repeatPenalty : DEFAULTS.repeatPenalty
    };
    var fullText = '';
    try {
      await wllama.createCompletion(promptText, {
        nPredict: params.maxTokens,
        sampling: { temp: params.temperature, top_k: params.topK, top_p: params.topP, penalty_repeat: params.repeatPenalty },
        stopPrompts: STOP_PROMPTS,
        onNewToken: function (token, piece) {
          if (piece) { fullText += piece; if (opts.onChunk) opts.onChunk(piece); }
        }
      });
      return { text: cleanOutput(fullText), ok: true };
    } catch (err) {
      console.error('[LocalLLM] Erreur generation :', err);
      return { text: '', ok: false, error: err.message || String(err) };
    }
  }

  async function askMessages(messages, options) {
    if (!activated) throw new Error("LocalLLM non active.");
    return ask({ fullPrompt: messagesToChatML(messages), options: options });
  }

  async function reset() {
    if (wllama && wllama.kvClear) { try { await wllama.kvClear(); } catch (e) {} }
  }

  window.LocalLLM = {
    activate: activate, ask: ask, askMessages: askMessages, reset: reset,
    buildPrompt: buildPrompt, buildChatML: buildChatML,
    isReady: function () { return activated; },
    isActivating: function () { return !!activating && !activated; },
    lastError: function () { return lastError; },
    SOCLE_COMMUN: SOCLE_COMMUN, DEFAULTS: DEFAULTS, STOP_PROMPTS: STOP_PROMPTS,
    MODEL_INFO: { repo: MODEL_REPO, file: MODEL_FILE, contextSize: N_CTX,
      paramSize: '0.5B', quantization: 'Q4_K_M', sizeMB: 400 }
  };
  console.log('[LocalLLM] v2.1 charge (non active). Appelle window.LocalLLM.activate() pour demarrer.');
})();

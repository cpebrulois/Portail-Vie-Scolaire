/* ============================================================
 * HELENE MOUTH - inference ONNX cote navigateur
 * ============================================================
 * Charge la bouche neurale Q4 (~22 MB) depuis ./model/helene_mouth.onnx
 * Tokenise via le word-tokenizer compact (729 tokens)
 * Greedy decode avec EOS et max_tokens
 *
 * IMPORTANT - LIMITE HONNETE :
 * La bouche actuelle vient du synth500 v0 (vocab HD/Aethonyx, 729 tokens).
 * Elle n'est PAS entrainee sur le corpus orientation BFC.
 * Sur des prompts orientation, elle generera du texte coherent mais dans
 * le registre HD (math, alolina, identite). Pour usage Helene reel, il faut
 * re-entrainer une bouche dediee orientation (Colab ~3-5h GPU).
 *
 * Cette implementation prouve que la chaine ONNX-in-browser fonctionne et
 * permettra de brancher rapidement une bouche dediee une fois entrainee.
 * ============================================================ */

const HeleneMouth = (function () {

  // ---------- CONFIG ----------
  const MODEL_URL = './model/helene_mouth.onnx';
  const TOKENIZER_URL = './model/helene_tokenizer.json';
  const MAX_GEN_TOKENS = 64;     // par defaut court - bouche compacte
  const TEMPERATURE = 0.7;       // greedy si T=0, sampling sinon

  // ---------- STATE ----------
  let session = null;
  let tokenizerData = null;
  let vocab = null;            // token -> id
  let invVocab = null;         // id -> token
  let specialTokens = null;
  let splitRegex = null;
  let maxSeqLen = 256;         // evite OOM pour la generation
  let ready = false;

  // ---------- CHARGEMENT ----------
  async function load() {
    if (ready) return true;

    // Charge ONNX Runtime Web depuis CDN (one-shot)
    if (typeof window.ort === 'undefined') {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/ort.min.js';
        s.onload = resolve;
        s.onerror = () => reject(new Error('Echec chargement ONNX Runtime Web'));
        document.head.appendChild(s);
      });
    }

    // Configure ORT pour WASM
    window.ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/';

    // Charge tokenizer
    const tokRes = await fetch(TOKENIZER_URL);
    if (!tokRes.ok) throw new Error('Tokenizer absent : ' + TOKENIZER_URL);
    tokenizerData = await tokRes.json();
    vocab = tokenizerData.vocab;
    invVocab = {};
    for (const [tok, id] of Object.entries(vocab)) invVocab[id] = tok;
    specialTokens = tokenizerData.special_tokens || { pad: 0, bos: 1, eos: 2, unk: 3 };
    splitRegex = new RegExp(tokenizerData.split_regex || '\\s*\\S+', 'g');

    // Charge le modele ONNX
    const modelRes = await fetch(MODEL_URL);
    if (!modelRes.ok) throw new Error('Modele ONNX absent : ' + MODEL_URL);
    const modelBuf = await modelRes.arrayBuffer();
    session = await window.ort.InferenceSession.create(modelBuf, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    });
    console.log('[HeleneMouth] Inputs :', session.inputNames);
    console.log('[HeleneMouth] Outputs :', session.outputNames);
    ready = true;
    return true;
  }

  // ---------- TOKENISATION ----------
  function tokenize(text) {
    if (!vocab) throw new Error('Tokenizer non charge');
    // Le synth500 utilise un word-tokenizer "leading_space_word" :
    // splitRegex = \s*\S+ : capture chaque mot avec ses espaces preliminaires.
    const matches = (text || '').match(splitRegex) || [];
    const ids = [];
    for (const w of matches) {
      ids.push(vocab[w] !== undefined ? vocab[w] : specialTokens.unk);
    }
    return ids;
  }

  function detokenize(ids) {
    if (!invVocab) throw new Error('Tokenizer non charge');
    const parts = [];
    for (const id of ids) {
      const tok = invVocab[id];
      if (tok === undefined) continue;
      // Skip special tokens dans la sortie utilisateur
      if (id <= 3) continue;
      parts.push(tok);
    }
    // Le tokenizer leading_space_word concatene direct (les espaces sont dans le token)
    return parts.join('');
  }

  // ---------- INFERENCE ----------
  // Greedy decode token par token (KV-cache pas implemente pour simplicite)
  async function generate(promptText, opts) {
    if (!ready) await load();
    opts = opts || {};
    const maxNew = opts.maxTokens || MAX_GEN_TOKENS;
    const temperature = opts.temperature !== undefined ? opts.temperature : TEMPERATURE;
    const stopTokens = new Set([specialTokens.eos]);
    const onChunk = opts.onChunk || null;

    let ids = tokenize(promptText);
    if (ids.length === 0) ids = [specialTokens.bos];

    const generated = [];
    for (let step = 0; step < maxNew; step++) {
      // Truncate context si trop long
      if (ids.length > maxSeqLen - 1) ids = ids.slice(-(maxSeqLen - 1));

      const inputArray = BigInt64Array.from(ids.map(BigInt));
      const inputTensor = new window.ort.Tensor('int64', inputArray, [1, ids.length]);
      const result = await session.run({ input_ids: inputTensor });
      const logitsTensor = result.logits;
      const logits = logitsTensor.data;        // Float32Array [1, seq, vocab]
      const seqLen = logitsTensor.dims[1];
      const vocabSize = logitsTensor.dims[2];
      const offset = (seqLen - 1) * vocabSize;

      // Sample (greedy si T=0, sinon temperature softmax)
      let nextId;
      if (temperature <= 0.001) {
        // Greedy
        let bestVal = -Infinity, bestIdx = 0;
        for (let i = 0; i < vocabSize; i++) {
          if (logits[offset + i] > bestVal) {
            bestVal = logits[offset + i];
            bestIdx = i;
          }
        }
        nextId = bestIdx;
      } else {
        // Temperature sampling
        // 1) softmax with temperature
        let maxLogit = -Infinity;
        for (let i = 0; i < vocabSize; i++) {
          if (logits[offset + i] > maxLogit) maxLogit = logits[offset + i];
        }
        const probs = new Float32Array(vocabSize);
        let sum = 0;
        for (let i = 0; i < vocabSize; i++) {
          probs[i] = Math.exp((logits[offset + i] - maxLogit) / temperature);
          sum += probs[i];
        }
        for (let i = 0; i < vocabSize; i++) probs[i] /= sum;
        // 2) sample
        const r = Math.random();
        let cum = 0;
        nextId = vocabSize - 1;
        for (let i = 0; i < vocabSize; i++) {
          cum += probs[i];
          if (r < cum) { nextId = i; break; }
        }
      }

      if (stopTokens.has(nextId)) break;
      generated.push(nextId);
      ids.push(nextId);

      // Streaming
      if (onChunk) {
        const tokStr = invVocab[nextId];
        if (tokStr && nextId > 3) onChunk(tokStr);
      }
    }

    return {
      ids: generated,
      text: detokenize(generated),
    };
  }

  function isReady() { return ready; }
  function getVocabSize() { return vocab ? Object.keys(vocab).length : 0; }

  return { load, generate, tokenize, detokenize, isReady, getVocabSize, MODEL_URL };
})();

if (typeof window !== 'undefined') {
  window.HeleneMouth = HeleneMouth;
}

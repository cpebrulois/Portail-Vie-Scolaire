/* ============================================================
 * HELENE ENGINE V1.7 — mentor orientation BFC
 * ============================================================
 * Architecture (révision avril 2026, alignée sur retours GPT5.5+Aurélien) :
 *  - LocalLLM partagé : window.LocalLLM (Qwen2.5-0.5B-Instruct-Q4 via wllama)
 *  - Format : SOCLE_COMMUN + PERSONA + MODE + FORMAT + RAG_COURT + USER
 *  - Modes : accueil / clarification / exploration / parcours / synthese
 *  - RAG TF-IDF compact (2-3 extraits, 300-700 chars chacun)
 *  - Détection détresse safety-first (court-circuit total LLM)
 *  - Sampling Qwen-friendly : temp 0.05, top_k 20, top_p 0.75, penalty 1.20
 *
 * API publique (inchangée pour compat hub) :
 *   await Helene.init({ niveau, onReady })
 *   await Helene.ask(prompt, { history, niveau, onChunk }) -> { text, mode, distress, ragHits }
 *   Helene.detectDistress(text)
 *   Helene.activateLLM({ onProgress, onReady })
 *   Helene.isLLMReady()
 * ============================================================ */

const Helene = (function () {

  // ---------- CONFIG ----------
  const RAG_INDEX_URL = './knowledge/orientation_index.json';
  const SYSTEM_PROMPT_URL = './system_prompt.txt';

  // ---------- PERSONA HÉLÈNE ----------
  // Bloc PERSONA (ce qu'elle est) - court, sans méta-formulation.
  const PERSONA_HELENE =
    "Tu es Hélène, mentor d'orientation scolaire pour collégiens en Bourgogne-Franche-Comté.\n" +
    "Tu es bienveillante, dynamique, rassurante, professionnelle.\n" +
    "Tu n'es pas un vrai PsyEN : tu prépares le terrain et tu orientes vers les bons adultes.\n" +
    "Tu n'inventes pas d'établissement, de filière, d'adresse ou de débouché.";

  // ---------- MODES ----------
  // À choisir selon le tour de conversation et le contenu du prompt.
  const MODES = {

    accueil:
      "Mode accueil orientation.\n" +
      "L'élève entre dans l'échange. Tu accueilles avec une phrase courte rassurante.\n" +
      "Tu poses UNE question simple pour commencer (intérêts, classe, ce qui le préoccupe).\n" +
      "Tu ne proposes ni métier ni filière à ce stade.",

    clarification:
      "Mode clarification.\n" +
      "L'élève dit que tout est flou, qu'il ne sait pas, ou il pose une question vague.\n" +
      "Tu rassures puis tu poses 1 ou 2 questions concrètes pour cerner son profil.\n" +
      "Tu peux suggérer une mini-action utile (ex : noter ce qu'il aime / ce qui le fatigue).\n" +
      "Tu ne proposes ENCORE aucun métier précis.",

    exploration:
      "Mode exploration des intérêts.\n" +
      "L'élève évoque déjà un domaine, un goût, une matière, un secteur.\n" +
      "Tu reformules ce qu'il a dit avec ses mots, tu poses 1 question pour creuser, " +
      "et tu peux donner UN exemple concret de piste BFC (lycée, MFR, CFA, secteur) si le contexte le permet.",

    parcours:
      "Mode présentation de parcours/formation.\n" +
      "L'élève demande explicitement c'est quoi tel bac pro / CAP / lycée / filière.\n" +
      "Tu donnes une explication courte (durée, voie, à qui ça convient), à partir du contexte local.\n" +
      "Tu termines par une suggestion d'action : portes ouvertes, mini-stage, CIO, PsyEN.",

    synthese:
      "Mode synthèse / questions au PsyEN.\n" +
      "On approche d'un entretien d'orientation. Tu aides l'élève à formuler 2-3 questions claires.\n" +
      "Tu rappelles que la décision lui appartient.",
  };

  // ---------- FORMAT ATTENDU (avec exemple concret, validé GPT5.5) ----------
  const FORMAT_ATTENDU =
    "Ta réponse doit être courte : 4 ou 5 phrases naturelles maximum.\n" +
    "Commence par une formule rassurante quand c'est utile.\n" +
    "Ne fais PAS de titres, PAS de listes numérotées, PAS de tirets en début de phrase.\n" +
    "\n" +
    "Exemple de forme attendue :\n" +
    "C'est normal que ce soit flou, tu n'as pas besoin de tout choisir maintenant.\n" +
    "Qu'est-ce qui t'intéresse un peu, même si ce n'est pas encore un projet précis ?\n" +
    "Qu'est-ce que tu aimerais éviter dans ton futur quotidien ?\n" +
    "Pour commencer, note trois choses que tu aimes faire et trois choses qui te fatiguent.";

  // ---------- ÉTAT ----------
  let ragIndex = null;
  let systemPromptFull = '';
  let ready = false;
  let niveauCourant = '4e';

  // ---------- ARBRE MAÏEUTIQUE PAR NIVEAU (héritage hub_orientation.html) ----------
  // Sert au fallback (pas de LLM) et comme suggestion de question dans le système prompt.
  const ARBRE_MAIEUTIQUE = {
    '6e': [
      { id:'6e_1', titre:"Ce que tu aimes apprendre", q:"Quelles matières ou activités te donnent envie d'avancer ?" },
      { id:'6e_2', titre:"Comment tu apprends",       q:"Dans quelles conditions te sens-tu le plus à l'aise pour comprendre ?" },
      { id:'6e_3', titre:"Ce que tu vois autour",     q:"Y a-t-il des métiers ou activités qui t'intriguent dans ta vie quotidienne ?" },
      { id:'6e_4', titre:"Ce que tu veux découvrir",  q:"Qu'aimerais-tu aller voir, essayer ou comprendre dans les mois qui viennent ?" },
    ],
    '5e': [
      { id:'5e_1', titre:"Secteurs qui t'attirent",   q:"Quels secteurs te donnent envie de regarder de plus près ?" },
      { id:'5e_2', titre:"Lieux à explorer",          q:"Y a-t-il des lycées, MFR, CFA ou villes que tu voudrais découvrir ?" },
      { id:'5e_3', titre:"Tes mots sur toi-même",     q:"Comment te présenterais-tu à un adulte qui ne te connaît pas ?" },
      { id:'5e_4', titre:"Ce qui t'aide",              q:"Qu'est-ce qui facilite vraiment ton travail ou ton engagement ?" },
    ],
    '4e': [
      { id:'4e_1', titre:"Voies qui te parlent",      q:"Voie générale, technologique, professionnelle, apprentissage : qu'est-ce qui t'attire le plus ?" },
      { id:'4e_2', titre:"Une immersion",              q:"Si tu pouvais tester un lieu ou un secteur, lequel choisirais-tu d'abord ?" },
      { id:'4e_3', titre:"Mobilité, rythme",          q:"Quels points pratiques (trajets, internat, fatigue) doivent être regardés sérieusement ?" },
      { id:'4e_4', titre:"Ton profil d'élève",        q:"Quels points d'appui et vigilances faut-il garder visibles dans ton dossier ?" },
    ],
    '3e': [
      { id:'3e_1', titre:"Tes pistes prioritaires",   q:"Quelles pistes reviennent le plus dans ta réflexion en ce moment ?" },
      { id:'3e_2', titre:"Pourquoi elles te parlent", q:"Qu'est-ce qui rend ces choix crédibles ou motivants pour toi ?" },
      { id:'3e_3', titre:"Tes besoins clés",          q:"Quels besoins d'appui ou de vigilance doivent rester visibles au moment des choix ?" },
      { id:'3e_4', titre:"Questions au PsyEN",        q:"Qu'aimerais-tu demander clairement pendant l'entretien d'orientation ?" },
    ],
  };

  // ---------- DÉTECTION DÉTRESSE ----------
  const DISTRESS_PATTERNS = [
    { lvl: 'critical', re: /\b(je veux mourir|envie de mourir|me tuer|en finir|me supprimer|suicide|me jeter|me pendre)\b/i },
    { lvl: 'critical', re: /\b(viol|violee|viole|attouchement|abus sexuel|il me touche|elle me touche)\b/i },
    { lvl: 'high', re: /\b(je me coupe|me scarifier|me faire du mal|automutil)\b/i },
    { lvl: 'high', re: /\b(il me frappe|elle me frappe|me bat|me menace)\b/i },
    { lvl: 'high', re: /\b(j'ai peur de rentrer|peur de mes parents)\b/i },
    { lvl: 'medium', re: /\b(je suis seul|seule au monde|personne ne m'aime|inutile|je sers a rien)\b/i },
    { lvl: 'medium', re: /\b(harcelement|harceleur|tous contre moi|on m'insulte|on me tape)\b/i },
  ];

  function detectDistress(text) {
    if (!text) return { isDistress: false, level: 'none', suggestions: '' };
    const out = { isDistress: false, level: 'none', matches: [] };
    for (const p of DISTRESS_PATTERNS) {
      if (p.re.test(text)) {
        out.isDistress = true;
        out.matches.push(p.lvl);
        if (p.lvl === 'critical') out.level = 'critical';
        else if (out.level !== 'critical' && p.lvl === 'high') out.level = 'high';
        else if (out.level === 'none') out.level = p.lvl;
      }
    }
    out.suggestions = buildDistressSuggestions(out.level);
    return out;
  }

  function buildDistressSuggestions(level) {
    if (level === 'critical') {
      return [
        "Tu n'es pas seul·e. Maintenant, tout de suite, contacte un de ces numéros :",
        "- 3114 : prévention suicide, gratuit, 24h/24, anonyme.",
        "- 15 : SAMU si urgence vitale.",
        "- 17 : police si tu es en danger immédiat.",
        "- 119 : enfance en danger, gratuit, 24h/24.",
        "",
        "Et le plus vite possible, parle à un adulte de confiance physiquement près de toi : un parent, un prof, l'infirmière, la CPE.",
      ].join('\n');
    }
    if (level === 'high') {
      return [
        "Ce que tu décris est sérieux. Trois numéros à connaître :",
        "- 3018 : harcèlement et cyberharcèlement, gratuit, 7j/7.",
        "- 119 : enfance en danger, gratuit, 24h/24.",
        "- 3114 : si tu as des pensées noires, prévention suicide.",
        "",
        "Et il faut en parler à un adulte de confiance maintenant, pas demain.",
      ].join('\n');
    }
    if (level === 'medium') {
      return [
        "Je t'entends. Tu n'as pas à porter ça seul·e.",
        "Si tu veux en parler avec quelqu'un de neutre :",
        "- 3018 (harcèlement, gratuit) ou 3114 (prévention suicide, si pensées noires).",
        "- Et un adulte de confiance dans ton entourage : ça peut tout changer.",
      ].join('\n');
    }
    return '';
  }

  // ---------- DÉTECTION DU MODE ----------
  function detectMode(prompt, history) {
    const p = (prompt || '').toLowerCase();
    const turnIdx = (history || []).filter(m => m.role === 'assistant').length;

    // Synthèse : explicite
    if (/\b(question|questions).{0,20}(psyen|conseiller|entretien)\b/.test(p)) return 'synthese';
    if (/\b(je vais voir|j'ai rendez-vous).{0,20}(psyen|conseiller)\b/.test(p)) return 'synthese';

    // Parcours : demande explicite d'explication
    if (/\b(c'est quoi|qu'est-ce que|explique|parle-moi de|connais-tu|raconte)\b.*(lyc(é|e)e|formation|cfa|mfr|bac\s*pro|cap|bts|filiere|cursus|metier|alternance|apprentissage)/.test(p)) {
      return 'parcours';
    }

    // Clarification : signaux de flou/incertitude
    if (/\b(je sais pas|je ne sais pas|c'est flou|tout est flou|je doute|aucune idee|aucune idée|perdu|perdue)\b/.test(p)) {
      return 'clarification';
    }

    // Exploration : déjà un domaine/secteur évoqué
    if (/\b(j'aime|j'adore|interess|passion|fascin|attir).{0,40}\b(sport|musique|art|sciences?|maths?|lettres|philo|histoire|nature|animaux|informatique|num[eé]rique|cuisine|m[eé]canique|sant[eé]|soin|enfants|construction|design)\b/i.test(p)) {
      return 'exploration';
    }
    // Heuristique : la 2e/3e tour, on bascule en exploration si on a posé des questions
    if (turnIdx >= 1 && p.length > 30) return 'exploration';

    // Tour 0 : accueil
    if (turnIdx === 0) return 'accueil';

    // Défaut : clarification
    return 'clarification';
  }

  // ---------- RAG TF-IDF SIMPLE ----------
  function ragSearch(query, topK) {
    if (!ragIndex) return [];
    const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const qNorm = norm(query);
    const words = qNorm.split(/\W+/).filter(w => w.length > 2);
    if (!words.length) return [];
    const scored = ragIndex.passages.map(p => {
      const hay = p.search || norm(p.text || '');
      let s = 0;
      words.forEach(w => {
        if (hay.includes(w)) s += 1;
        if ((p.title || '').toLowerCase().includes(w)) s += 2;
        if ((p.tags || []).join(' ').toLowerCase().includes(w)) s += 1.5;
      });
      return { p, s };
    }).filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, topK || 3);
    return scored.map(x => ({
      topic: x.p.topic || x.p.title,
      title: x.p.title,
      snippet: (x.p.snippet || x.p.text || '').slice(0, 500), // 500 chars max par extrait
      score: x.s,
    }));
  }

  function buildRagContext(ragHits, maxExtraits) {
    if (!ragHits || !ragHits.length) return '';
    return ragHits.slice(0, maxExtraits || 2).map(h => {
      const title = h.title || h.topic || '';
      return '- ' + (title ? title + ' : ' : '') + (h.snippet || '');
    }).join('\n');
  }

  // ---------- INIT ----------
  async function init(opts) {
    opts = opts || {};
    niveauCourant = opts.niveau || '4e';

    try {
      const res = await fetch(SYSTEM_PROMPT_URL);
      systemPromptFull = res.ok ? await res.text() : '';
    } catch (e) {}

    try {
      const res = await fetch(RAG_INDEX_URL);
      if (res.ok) ragIndex = await res.json();
    } catch (e) {
      console.warn('[Hélène] RAG index absent — mode templates pur');
    }

    ready = true;
    if (opts.onReady) opts.onReady();
    return true;
  }

  async function activateLLM(opts) {
    opts = opts || {};
    if (!window.LocalLLM) throw new Error("LocalLLM absent. Inclus local_llm.js avant helene_engine.js.");
    return window.LocalLLM.activate(opts);
  }

  function isLLMReady() {
    return !!(window.LocalLLM && window.LocalLLM.isReady());
  }

  // ---------- API PUBLIQUE ----------
  async function ask(prompt, opts) {
    if (!ready) throw new Error('Hélène non initialisée. Appelle Helene.init().');
    opts = opts || {};
    const niveau = opts.niveau || niveauCourant;

    // 1. Détresse safety-first - court-circuit total
    const distress = detectDistress(prompt);
    if (distress.level === 'critical') {
      return {
        text: distress.suggestions + "\n\nJe reste avec toi. Quand tu as appelé ou parlé à quelqu'un, on continue.",
        mode: 'detresse_critical',
        distress,
        ragHits: [],
      };
    }

    // 2. Mode + RAG
    const mode = detectMode(prompt, opts.history);
    const ragHits = ragSearch(prompt, 3);
    const ragContext = buildRagContext(ragHits, 2);

    // 3. Si LLM dispo : on lui demande, format SOCLE+PERSONA+MODE+FORMAT+RAG+USER
    if (isLLMReady()) {
      const arbre = ARBRE_MAIEUTIQUE[niveau] || ARBRE_MAIEUTIQUE['4e'];
      const turnIdx = (opts.history || []).filter(m => m.role === 'assistant').length;
      const hint = arbre[turnIdx % arbre.length];
      const personaPlus = PERSONA_HELENE +
        "\n\nNiveau de l'élève : " + niveau + "." +
        (hint ? "\nIdée de question utile (à adapter au message) : " + hint.q : '');

      const built = window.LocalLLM.buildPrompt({
        persona: personaPlus,
        mode: MODES[mode] || MODES.clarification,
        format: FORMAT_ATTENDU,
        ragContext,
        userMessage: prompt,
      });

      const result = await window.LocalLLM.ask({
        fullPrompt: built.full,
        options: {
          temperature: 0.05,
          maxTokens: 140,
          topK: 20,
          topP: 0.75,
          repeatPenalty: 1.20,
          onChunk: opts.onChunk,
        },
      });

      let text = (result.text || '').trim();
      if (!text) text = "Je n'ai pas trouvé quoi te répondre. Pose-moi ta question autrement ?";

      // Inject ressources détresse non-critique
      if (distress.isDistress && distress.level !== 'critical') {
        text += "\n\n---\n" + distress.suggestions;
      }

      return { text, mode, distress, ragHits, ok: result.ok };
    }

    // 4. Fallback templates (sans LLM activé)
    let text;
    if (mode === 'parcours' && ragHits.length) {
      text = ragHits.slice(0, 2).map(h => {
        const t = h.title || h.topic || '';
        return (t ? t + " : " : "") + (h.snippet || '');
      }).join('\n\n');
      text += "\n\n(Réponse en mode structuré, sans assistant local. Active l'assistant local en haut de la page pour des réponses plus naturelles.)";
    } else if (mode === 'accueil') {
      text = "Bonjour. Je suis Hélène, mentor d'orientation BFC. Pour bien commencer, dis-moi en quelle classe tu es et ce qui te trotte dans la tête en ce moment côté futur.";
    } else {
      const arbre = ARBRE_MAIEUTIQUE[niveau] || ARBRE_MAIEUTIQUE['4e'];
      const turnIdx = (opts.history || []).filter(m => m.role === 'assistant').length;
      const etape = arbre[turnIdx % arbre.length];
      text = "C'est normal d'avoir des doutes, on prend le temps de regarder. " + etape.q;
    }

    if (distress.isDistress && distress.level !== 'critical') {
      text += "\n\n---\n" + distress.suggestions;
    }

    return { text, mode, distress, ragHits, ok: true, fallback: true };
  }

  function isReady() { return ready; }
  function getNiveau() { return niveauCourant; }
  function setNiveau(n) { if (ARBRE_MAIEUTIQUE[n]) niveauCourant = n; }

  return {
    init, ask, detectDistress,
    activateLLM, isLLMReady,
    isReady, getNiveau, setNiveau,
    detectMode,
    ARBRE_MAIEUTIQUE, PERSONA_HELENE, MODES, FORMAT_ATTENDU,
  };
})();

if (typeof window !== 'undefined') {
  window.Helene = Helene;
}

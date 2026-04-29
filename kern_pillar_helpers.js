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
    var ragContext = findRagContext(pillarKey, '', { maxEntries: 4 });
    var systemPrompt =
      "Tu es Kern, assistant de formation anti-harcelement.\n" +
      "Reponds en francais en 2 ou 3 phrases completes.\n" +
      "Interdiction : numeros, tirets, listes, titres.\n" +
      "Ecris du texte continu, comme une explication simple a voix haute.";

    var userPrompt =
      "Pilier : " + (pillar.title || pillar.key) +
      (pillar.desc ? " — " + pillar.desc : "") +
      "\nPremiers modules : " + modulesList +
      (ragContext ? "\nSavoirs cles :\n" + ragContext : "") +
      "\n\nFais un resume tres court de ce pilier en 2 ou 3 phrases pour un eleve.";

    var streaming = '';
    var result = await window.LocalLLM.ask({
      systemPrompt: systemPrompt,
      userPrompt: userPrompt,
      options: {
        temperature: 0.45, maxTokens: 220, topK: 40, topP: 0.85, repeatPenalty: 1.35,
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
      var ragContext = findRagContext(pillarKey, text);
      var systemPrompt =
        "Tu es Kern, coach anti-harcelement pour college.\n" +
        "Reponds en 2 ou 3 phrases completes, sans numeros, sans tirets.\n" +
        "Cite les faits, chiffres et noms precis des savoirs fournis.\n" +
        "Tu peux croiser les informations entre elles si c est pertinent.";

      var userPrompt =
        (ragContext ? "Savoirs cles :\n" + ragContext + "\n\n" : "") +
        "Pilier : " + (pillar.title || pillar.key) +
        "\n\nQuestion : " + text;

      var msgEl = appendKernMsg('kern', '<span class="kern-stream"><i>Reflexion...</i></span>');
      var streamSpan = msgEl ? msgEl.querySelector('.kern-stream') : null;
      var streaming = '';

      var result = await window.LocalLLM.ask({
        systemPrompt: systemPrompt,
        userPrompt: userPrompt,
        options: {
          temperature: 0.45, maxTokens: 180, topK: 40, topP: 0.85, repeatPenalty: 1.35,
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


  /* ===================== RAG : base de connaissances ===================== */
  var KERN_RAG_KB = {
    'GRP': [
      { keys: ['triangle','auteur','cible','temoin','temoins','57','roles'],
        text: 'M01 Triangle : 3 roles — Auteur (agit), Cible (subit), Temoins (voient). Sans public, pas de harcelement. Si UN temoin intervient, 57% des situations s arretent en 10 secondes.' },
      { keys: ['bystander','spectateur','effet spectateur','diffusion','responsabilite','latane','darley'],
        text: 'Effet spectateur (Darley-Latane) : plus il y a de temoins, moins chacun se sent responsable. Solution : se sentir personnellement concerne. Meme un petit geste brise la dynamique.' },
      { keys: ['etape','etapes','5 etapes','notifier','nommer','decider','agir','signaler'],
        text: 'M03 5 etapes du temoin actif : 1 Remarquer. 2 Reconnaitre le probleme. 3 Se sentir responsable. 4 Savoir quoi faire. 5 Agir. Bloquer a n importe quelle etape = inaction.' },
      { keys: ['kiva','pikas','programme','finlande','pairs','aidant','preoccupation'],
        text: 'M04 KiVa (Finlande) et methode Pikas : agir par les pairs, pas seulement par les adultes. KiVa = jeux de role + signalement anonyme. Taux de resolution 80% en contexte scolaire.' },
      { keys: ['spirale','silence','opinion','peur','majoritaire','noelle','neumann'],
        text: 'M05 Spirale du Silence (Noelle-Neumann) : quand une opinion semble majoritaire, les autres se taisent. Le silence des temoins donne l impression que le harcelement est accepte.' },
      { keys: ['piege','cognitif','biais','deresponsabilisation','deshumanisation','conformisme','obedience'],
        text: 'M06 8 pieges cognitifs : deresponsabilisation ("c etait pour rire"), deshumanisation de la cible, conformisme de groupe, obedience a l autorite, diffusion de responsabilite, euphemisation, banalisation, externalisation.' },
      { keys: ['milgram','zimbardo','stanford','autorite','obeissance','prison'],
        text: 'M07 Milgram (1963) : 65% obeissent a l autorite meme pour blesser autrui. Zimbardo/Stanford (1971) : etudiants normaux deviennent oppresseurs en 6 jours. Le contexte compte plus que le caractere.' },
      { keys: ['pairs','aidants','formation','mediateur','pair','aidant'],
        text: 'M08 Pairs-aidants : eleves formes comme mediateurs. Ils ont plus de legitimite que les adultes aupres de leurs pairs. Formation a l ecoute active, deescalade, signalement.' },
      { keys: ['normes','tajfel','turner','identite','sociale','ingroup','outgroup','appartenance'],
        text: 'M09 Theorie des normes (Tajfel-Turner) : on adopte les comportements du groupe d appartenance. Si la norme tolere le harcelement, chacun s y conforme. Changer la norme = changer les comportements.' },
      { keys: ['cyberharcelement','numerique','en ligne','reseau','anonymat','24h'],
        text: 'M10 Cyberharcelement : le numerique supprime les limites de temps et d espace. L anonymat desinhibit l agressivite. Les contenus se propagent sans controle. Le harcelement continue apres l ecole.' },
      { keys: ['prevention','phare','ministeriel','college','lycee','plan','national'],
        text: 'pHARe : programme ministeriel francais de prevention. Deploye en colleges et lycees depuis 2021. Inclut formation des equipes, protocoles d intervention, ambassadeurs.' }
    ],
    'HIS': [
      { keys: ['mot','nommer','nom','origine','avant','heinemann','1969','olweus'],
        text: 'M01 Avant 1969, le mot harcelement scolaire n existait pas. Heinemann (Suede, 1969) : premier a nommer "mobbing". Olweus (Norvege, 1973) : premier programme scientifique anti-harcelement.' },
      { keys: ['loi','2022','2023','3018','code','penal','france'],
        text: 'M02 Loi 2022 (France) : creation du delit specifique de harcelement scolaire. Loi 3018 renforce les sanctions. Infraction penale passible d emprisonnement et amende.' },
      { keys: ['phare','programme','ministeriel','2021','ambassadeur','formation'],
        text: 'M03 Programme pHARe (2021) : programme national ministeriel. 8 piliers. Formation des equipes educatives, protocoles d intervention, ambassadeurs eleves.' },
      { keys: ['olweus','norvege','recherche','scientifique','50','pionnier','bully'],
        text: 'M04 Olweus (Norvege, 1973-1983) : criteres = repetition, intentionnalite, desequilibre de pouvoir. Son programme a reduit le harcelement de 50%.' },
      { keys: ['memoire','todorov','verite','reconciliation','cvr','reparation','histoire'],
        text: 'M06 Memoire et reparation : Todorov — la memoire juste ne se reduit ni a l oubli ni a l obsession. Les Commissions Verite et Reconciliation (CVR) : ecrire l histoire pour construire la paix.' },
      { keys: ['juste','arendt','staub','desobeissance','courage','moral','temoin','banalite'],
        text: 'M07 Figures du Juste : Hannah Arendt (banalite du mal) — les crimes sont commis par des gens ordinaires qui obeissent. Ervin Staub : le courage moral du temoin est le facteur protecteur principal.' },
      { keys: ['fanon','colonial','regard','decoloniser','opprime','identite','domination'],
        text: 'M08 Fanon : le regard colonial construit une image de soi negative chez les personnes dominees. Decoloniser le regard = deconstruire les stereotypes interiorises.' },
      { keys: ['paix','ecriture','temoignage','voix','reparation','narratif','recit'],
        text: 'M09 Ecriture de la paix : donner une voix aux temoins et victimes. Le recit repare. La litterature testimoniale (Primo Levi, Elie Wiesel) montre comment nommer l horreur protege de la repetition.' }
    ],
    'JUR': [
      { keys: ['article','222','code penal','delit','peine','prison','amende'],
        text: 'M01 Art. 222-33-2-3 Code Penal : harcelement = violence repetee, intentionnelle, causant degradation des conditions de vie. Peine : jusqu a 3 ans prison + 45 000 EUR amende. Aggravation si mineur ou en ligne.' },
      { keys: ['bandura','apprentissage','social','modelisation','imitation','agressif','comportement'],
        text: 'M02 Bandura : apprentissage par modelisation. Si l agresseur n est pas sanctionne, le groupe apprend que le comportement est acceptable. La sanction visible a un effet dissuasif collectif.' },
      { keys: ['cyber','numerique','en ligne','internet','reseaux','anonymat','preuve','capture','pharos'],
        text: 'M03 Cyberharcelement : memes lois + dispositions specifiques (loi 2022). Capturer les preuves (copies ecran datees). L anonymat ne protege pas : traçabilite IP, signalement plateformes (Pharos).' },
      { keys: ['phare','protocole','etablissement','equipe','signalement','adulte','referent','art 40'],
        text: 'M04 Protocole pHARe : situation signalee = investigation dans les 5 jours. Equipe pluridisciplinaire. Separation des parties. Suivi sur 3 mois. Art.40 : obligation de signalement pour fonctionnaires.' },
      { keys: ['systemique','systeme','famille','ecole','acteurs','entourage','reseau'],
        text: 'M05 Vision systemique : le harcelement implique toute la communaute. Punir l auteur seul = insuffisant. Il faut agir sur auteur, cible, temoins, familles et environnement.' },
      { keys: ['restauratif','restaurative','zehr','reparation','relation','victime','auteur','mediation'],
        text: 'M06 Justice restaurative (Zehr) : centree sur la reparation des relations. "Qui a ete blesse ? Quels besoins ?" Plus efficace que la punition seule pour prevenir la recidive.' },
      { keys: ['cide','droits','enfant','onu','convention','1989','protection'],
        text: 'M07 CIDE (ONU, 1989) : tout enfant a droit a la protection contre toute violence (art.19), a la sante (art.24), a l education sans discrimination (art.28). L Etat est garant.' },
      { keys: ['chaine','protection','signalement','3018','psychologue','infirmier','adulte'],
        text: 'M08 Chaine de protection : eleve → adulte de confiance → CPE/direction → psychologue scolaire → equipe mobile securite → parquet si necessaire. 3018 = numero national harcelement (gratuit, 24h/24).' },
      { keys: ['rgpd','donnees','personnelles','image','droit','oubli','publication','consentement','photo'],
        text: 'M09 RGPD et droit a l image : publier une photo sans accord = violation. Mineur : accord des deux parents. Droit a l oubli = demande de suppression. Usurpation d identite = delit penal.' },
      { keys: ['etre entendu','sanctionner','expliquer','droits defense','procedure','presomption','innocence'],
        text: 'M10 Principe fondamental (DUDH art.10-11, CEDH art.6) : nul ne peut etre sanctionne sans avoir pu s expliquer. Presomption d innocence. Un eleve accuse a tort a le droit d etre entendu et rehabilite.' }
    ],
    'NEU': [
      { keys: ['empathie','cognitive','affective','comprendre','ressentir','circuits','manipuler','paralyser'],
        text: 'M01 Empathie : 2 dimensions — Cognitive (comprendre les pensees et intentions) + Affective (resonance emotionnelle). Deux circuits cerebraux. Comprendre sans ressentir peut conduire a manipuler. Ressentir sans comprendre peut paralyser.' },
      { keys: ['cerveau','ado','adolescent','cortex','prefrontal','limbique','risque','pairs','maturite'],
        text: 'M02 Cerveau adolescent : le systeme emotionnel (limbique) murit en premier. Le cortex prefrontal (controle, reflexion) finit a 25 ans. Emotions intenses + controle limite. Prise de risques en presence de pairs.' },
      { keys: ['emotion','nommer','alexithymie','ekman','universelle','joie','colere','peur','tristesse'],
        text: 'M03 Nommer les emotions : mettre un mot diminue l activite de l amygdale. Alexithymie = difficulte a identifier ses emotions (10% pop). Ekman : 6 emotions universelles. La granularite emotionnelle aide le cerveau.' },
      { keys: ['douleur','sociale','dacc','physique','cyberball','exclusion','rejet','neurologique'],
        text: 'M04 Douleur sociale : le cerveau ne distingue pas douleur physique et sociale. Le dACC est le centre commun. Etude Cyberball : l exclusion active les memes circuits meme avec des algorithmes. Le harcelement est neurologique.' },
      { keys: ['regulation','emotionnelle','coherence cardiaque','respiration','recadrage','cognitif','metacognition','amygdale'],
        text: 'M05 Regulation emotionnelle : moduler intensite et expression (pas supprimer). Coherence cardiaque : 5s insp / 5s exp, calme l amygdale en 3 min. Recadrage cognitif : changer l interpretation modifie l emotion.' },
      { keys: ['reconsolidation','memorielle','ledoux','souvenir','traumatisme','fixed mindset','growth mindset','dweck'],
        text: 'M06 LeDoux : chaque rappel d un souvenir le reecrit legerement — utile pour reduire la charge emotionnelle. Dweck : growth mindset (capacites constructibles) change les zones cerebrales activees face a l echec.' },
      { keys: ['sommeil','amygdale','60','privation','chronobiologie','melatonine','social jetlag'],
        text: 'M07 Sommeil : privation = amygdale 60% plus reactive. Chronobiologie ado : secretion de melatonine decalee. Social jetlag = decalage rythme naturel / horaires scolaires. Une nuit complete consolide mieux que 2h de revision.' },
      { keys: ['dopamine','addiction','renforcement','intermittent','likes','notifications','loot box'],
        text: 'M09 Dopamine : signal du plaisir anticipe. Renforcement intermittent = le plus addictif. Likes, notifs, loot boxes utilisent ce mecanisme. Cerveau ado : systeme recompense hypersensible + frein (cortex prefrontal) en construction.' },
      { keys: ['neuroplasticite','pleine conscience','mindfulness','holzel','matiere grise','remodeler','meditation'],
        text: 'M10 Neuroplasticite : la mindfulness reduit le volume de l amygdale. Holzel : changements cerebraux structuraux en 8 semaines. Le DMN s active en pilote automatique — la pleine conscience entraine a l interrompre.' }
    ],
    'VEA': [
      { keys: ['force','personnelle','valeur','connaissance de soi','boussole','energie','naturellement'],
        text: 'M01 Forces et valeurs : une force = ce qu on fait naturellement bien ET qui donne de l energie. Les valeurs = ce qui guide les choix selon sa conscience. Beaucoup de forces sont invisibles — les autres les voient avant nous.' },
      { keys: ['emotion','signal','colere','injustice','peur','danger','tristesse','intelligence emotionnelle','bloquer'],
        text: 'M02 Emotions comme signaux : colere = injustice, peur = danger, tristesse = perte. Bloquer = elles reviennent plus fort. Intelligence emotionnelle = reconnaitre, nommer, decider sans etre submerge.' },
      { keys: ['empathie','pitie','brenebrown','neurones miroirs','ecoute active','lien','distance'],
        text: 'M03 Empathie vs pitie : la pitie regarde de haut. L empathie descend sans juger. Brene Brown : "L empathie cree du lien. La pitie cree de la distance." Neurones miroirs = base neurologique. Ecoute active = reformuler, ne pas juger.' },
      { keys: ['assertivite','assertif','cnv','ofnr','observation','besoin','demande','message je','message tu','passif','agressif'],
        text: 'M04 Assertivite et CNV : assertif = exprimer clairement et respectueusement. Formule OFNR (Rosenberg) : Observation + Feeling + Need + Request. Message "je" reduit la defensive et ouvre le dialogue.' },
      { keys: ['prosocial','prosocialite','bystander','spectateur','intervenir','aider','entraide'],
        text: 'M05 Prosocialite : action volontaire pour aider les autres. Se sentir personnellement concerne brise l effet spectateur. Les personnes prosociales ont un bien-etre plus eleve — aider active le systeme de recompense.' },
      { keys: ['ambassadeur','capital social','conflit','modele','normes','imitation','mobiliser'],
        text: 'M06 Ambassadeur : cree les conditions pour que les autres agissent bien. Capital social = confiance + entraide + normes communes. Conflit bien gere = plus de confiance qu une absence de conflit.' },
      { keys: ['estime de soi','rosenberg','autocompassion','growth mindset','dweck','echec','valeur personnelle'],
        text: 'M07 Estime de soi : evaluation globale de la valeur personnelle. Growth mindset (Dweck) : l intelligence evolue avec l effort. L autocompassion motive davantage que l autocritique et ne s effondre pas a l echec.' },
      { keys: ['cnv','ofnr','chacal','girafe','communication','non violente','rosenberg'],
        text: 'M08 CNV Rosenberg : OFNR = Observation + Sentiment + Besoin + Demande. Metaphore : chacal = juge et exige. Girafe = observe, ressent, demande. Le modele exprime un vecu sans accusation — reduit la defensive.' },
      { keys: ['interdependance','cooperative','jigsaw','efficacite collective','cooperation'],
        text: 'M09 Apprentissage cooperatif : interdependance positive = la reussite de chacun depend de celle des autres. Jigsaw : chaque eleve enseigne sa partie. L efficacite collective est malleable : des succes communs la renforcent.' },
      { keys: ['justice restaurative','zehr','reparation','relation','punition','baton de parole','mediation'],
        text: 'M10 Justice restaurative (Zehr 2002) : reparer les relations, pas punir. Baton de parole : seule la personne qui le tient parle. Les mediateurs formes developpent empathie et resolution de conflits durables.' }
    ]

  ,
  'NUM': [
    { keys: ['attention','economie','dopamine','notification','like','scroll','infini','addiction','machine a sous','boucle'],
      text: 'M01 Economie de l attention : chaque seconde sur une app = revenus pub. Notifications/likes = micro-doses de dopamine. Scroll infini : sans pagination, le cerveau ne reçoit jamais le signal "c est fini" → on scrolle 90 metres de contenu/jour. Renforcement intermittent : recompense imprevue = plus addictif qu une recompense previsible (meme circuit que machines a sous).' },
    { keys: ['dark pattern','design trompeur','roach motel','misdirection','culpabilisation','essai gratuit','abonnement','accepter'],
      text: 'M02 Dark Patterns : pieges de design. Culpabilisation : bouton "Non merci, je prefere payer plus". Roach Motel : 1 clic pour entrer, 15 etapes pour sortir (Amazon Prime). Misdirection : gros bouton vert "ACCEPTER TOUT" vs petit lien gris "Parametrer". Essai gratuit : 48% des utilisateurs oublient d annuler avant prelevement.' },
    { keys: ['filtre bulle','chambre echo','algorithme','biais confirmation','pariser','polarisation','eli pariser'],
      text: 'M03 Filtre bulle (Eli Pariser, 2011) : chaque utilisateur voit un internet different selon son historique/clics/localisation. Chambre d echo : tes opinions sont repetees et amplifiees par des semblables. Le biais de confirmation humain est amplifie par l algorithme. Resultat : deux groupes qui ne partagent plus la meme realite.' },
    { keys: ['rgpd','droits','acces','effacement','portabilite','opposition','cnil','donnees','1 mois'],
      text: 'M04 Droits RGPD : Acces = demander quelles donnees (reponse obligatoire sous 1 mois). Effacement = supprimer si plus necessaires ou consentement retire. Portabilite = recuperer ses donnees (JSON/CSV) pour les transferer. Opposition = refuser la pub ciblee. CNIL = autorite française, sanctions jusqu a 20M EUR ou 4% du CA mondial.' },
    { keys: ['produit','annonceur','attention vendue','automatisme','cognitif','democratie','bulle','realite parallele','hygiene numerique'],
      text: 'M05 Tu n es pas le client des plateformes gratuites — tu es le produit. Les dark patterns ciblent les 95% de decisions prises en mode automatique. Les bulles creeent des realites paralleles : sans terrain factuel commun, le debat democratique devient impossible. Hygiene numerique : audit mensuel des apps, purge des notifications, diversification des sources.' },
    { keys: ['desinformation','mesinformation','wardle','fake news','lecture laterale','stanford','clemi','6 fois','rumeur'],
      text: 'M07 Wardle : mesinformation = erronee sans malveillance. Desinformation = creee et diffusee pour manipuler. Les fausses infos se propagent 6 fois plus vite, atteignant 70% de personnes en plus. Lecture laterale (Stanford/CLEMI) : sortir du site pour chercher ce que d autres en disent — plus efficace qu analyser le contenu en profondeur.' },
    { keys: ['empreinte numerique','trace','metadonnees','gps','droit oubli','mineur','cnil','googler','identite'],
      text: 'M08 Empreinte numerique : chaque visite, recherche, connexion laisse une trace (souvent invisible). Metadonnees d une photo = modele, date, coordonnees GPS. Droit a l effacement (droit a l oubli) : une fois majeur, on peut demander la suppression des contenus publies pendant la minorite. Googler regulierement son nom = reflex recommande par la CNIL.' },
    { keys: ['ia','intelligence artificielle','hallucination','biais algorithmique','eduscol','prompt','verifier'],
      text: 'M09 IA generative : les hallucinations sont inherentes — l IA optimise la coherence du texte, pas la verite. Peut inventer des citations, chiffres, evenements de façon convaincante. Biais algorithmique : des donnees inegales = inegalites reelles (ex : 35% d erreur sur visages de femmes noires). Posture Eduscol : interroger (prompt precis) → verifier (sources externes) → declarer (mentionner l usage).' },
    { keys: ['phishing','hameçonnage','mot de passe','phrase de passe','2fa','double facteur','anssi','cybersecurite'],
      text: 'M10 Cybersecurite : 1 Français sur 3 cible par phishing en 2024. Phrase de passe : longue et memorisable (ex : "MonChatMangeDes2Souris"). Piege classique : meme mot de passe partout. Double facteur (2FA) : meme si mot de passe vole, l attaquant a besoin du second facteur. ANSSI recommande le 2FA sur tous les comptes importants.' }
  ]

  }; /* fin KERN_RAG_KB */

  function normStr(s) {
    return (s || '').toLowerCase()
      .replace(/[éèêë]/g, 'e').replace(/[àâä]/g, 'a')
      .replace(/[îï]/g, 'i').replace(/[ôö]/g, 'o')
      .replace(/[ûü]/g, 'u').replace(/ç/g, 'c');
  }

  // RAG v1.6 : cross-pilier + phrase matching bonus + 3 entrees max.
  // Pour le resume (question vide), cherche dans le pilier actif uniquement.
  // Pour le coach (question presente), cherche dans TOUS les piliers.
  function findRagContext(pillarKey, question, opts) {
    opts = opts || {};
    var maxEntries = opts.maxEntries || 3;
    var q = normStr(question || '');
    var scored = [];
    var searchPillars = (q.length > 2)
      ? Object.keys(KERN_RAG_KB)   // coach : cross-pilier
      : (pillarKey ? [pillarKey] : Object.keys(KERN_RAG_KB)); // resume : mono-pilier

    searchPillars.forEach(function(pk) {
      var isPrimary = (pk === pillarKey);
      (KERN_RAG_KB[pk] || []).forEach(function(e) {
        var score = 0;
        e.keys.forEach(function(kw) {
          var normKw = normStr(kw);
          if (q.indexOf(normKw) >= 0) {
            // Bonus pour les expressions multi-mots (plus precises)
            score += (kw.indexOf(' ') >= 0) ? 4 : 2;
          }
        });
        normStr(e.text).split(/\s+/).forEach(function(w) {
          if (w.length > 5 && q.indexOf(w) >= 0) score += 1;
        });
        // Leger bonus pour le pilier actif (pertinence contexte)
        if (isPrimary && score > 0) score += 1;
        if (score > 0) scored.push({ score: score, text: e.text, pillar: pk });
      });
    });

    scored.sort(function(a, b) { return b.score - a.score; });

    if (!scored.length) {
      // Fallback : 3 premieres entrees du pilier actif (contexte general)
      var fallbackEntries = (KERN_RAG_KB[pillarKey] || []).slice(0, 3);
      if (fallbackEntries.length) return fallbackEntries.map(function(e){ return e.text; }).join('\n');
      return '';
    }

    // Max 2 entrees par pilier pour eviter la redundance
    var pillarCount = {};
    var result = [];
    scored.forEach(function(s) {
      var pc = pillarCount[s.pillar] || 0;
      if (pc < 2 && result.length < maxEntries) {
        pillarCount[s.pillar] = pc + 1;
        result.push(s.text);
      }
    });
    return result.join('\n');
  }

  console.log('[kern_pillar_helpers] v1.6 charge (RAG 57 entrees, 6 piliers, cross-pilier, Qwen3.5-0.8B)');
})();

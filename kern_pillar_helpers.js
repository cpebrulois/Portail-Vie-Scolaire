/* ============================================================
 * KERN PILLAR HELPERS v1.4
 * v1.1 : fix Uint8Array, localStorage, setKernInputBusy.
 * v1.2 : sampling anti-boucle (temp 0.45, pen 1.35, topK 40).
 * v1.3 : RAG statique GROUPE (GRP) — 11 entrees.
 * v1.4 : RAG etendu — HISTOIRE (HIS) 8 entrees + JURIDIQUE (JUR) 10 entrees.
 * ============================================================ */
(function(){
  'use strict';
  var pillarCoachMode = null;
  var pillarSummaryCache = {};
  var origSendKern = null;
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

  /* =========================================================
   * RAG : base de connaissances statique
   * Extraite des modules HTML des piliers GRP, HIS, JUR.
   * findRagContext() retourne les 2 entrees les plus pertinentes.
   * ========================================================= */
  var KERN_RAG_KB = {

    /* -- GROUPE (GRP) 11 entrees -- */
    'GRP': [
      { keys: ['triangle','infernal','temoin','temoins','auteur','cible','victime','role','public','57'],
        text: 'M01 Triangle : 3 roles — Auteur (agit), Cible (subit), Temoins (voient). Sans public, pas de harcelement. Si UN temoin intervient, 57% des situations s arretent en 10 secondes. 5 types de temoins : supporters actifs (encouragent), passifs (rient), indifferents, defenseurs potentiels, defenseurs actifs. Objectif pHARe : transformer les potentiels en actifs.' },
      { keys: ['bystander','spectateur','effet spectateur','diffusion','responsabilite','dilue','quelqu','personne n'],
        text: 'Effet spectateur : plus il y a de temoins, moins chacun se sent responsable. Chacun pense quelqu un d autre va agir. C est un biais cognitif, pas de la lacheté. Solution : se designer SOI-MEME responsable — Si je n agis pas, qui va le faire ?' },
      { keys: ['5 etapes','cinq etapes','etape','percevoir','interpreter','accepter','savoir','agir','darley','latane','barriere'],
        text: 'M02 5 etapes du temoin (Darley & Latane) : 1.PERCEVOIR l incident. 2.INTERPRETER comme urgence. 3.ACCEPTER la responsabilite (c est MON probleme). 4.SAVOIR comment agir : directement, distraction, deleguer a un adulte, soutien differe. 5.AGIR malgre la peur. 85% des harcelements se passent devant des pairs.' },
      { keys: ['renforceur','assistant','defenseur','roles autour','foules','mecanique'],
        text: 'Roles autour de l agresseur : Agresseur (initie), Assistant (participe), Renforceur (encourage, rit), Spectateur passif (observe), Defenseur (intervient). Assistants et renforceurs = extension de l agresseur. Retirer le public suffit souvent a faire cesser le harcelement.' },
      { keys: ['piege','mecanisme','justif','blague','euphemis','comparaison','deshumanis','minimis','excuse','attribution','faute','cherche','huit mecanismes'],
        text: 'M03 8 pieges cognitifs : 1.Justification morale. 2.Etiquetage euphemisant (c etait une blague — une vraie blague fait rire TOUT LE MONDE). 3.Comparaison avantageuse. 4.Deplacement responsabilite. 5.Diffusion responsabilite. 6.Distorsion consequences. 7.Deshumanisation (le plus dangereux). 8.Attribution faute. Reconnaitre ces phrases = les neutraliser.' },
      { keys: ['kiva','pikas','no blame','methode','prevention','punition','briser','cycle','reduire','empathie','competence'],
        text: 'M04 KiVa (Finlande) cible les temoins, rend la defense socialement payante : -19% perpetration, -16% victimation. Methode Pikas/No Blame : mobilise l empathie sans punir. La punition seule = INEFFICACE. Competences protectrices : empathie affective, auto-efficacite sociale, regulation emotionnelle.' },
      { keys: ['leader','positif','ambassadeur','prestige','synthese','certif','cool'],
        text: 'M05 Leader Positif : rend la defense prestigieuse et cree des normes de protection. Tu influences ce qui est cool dans ton groupe. Triangle -> QUI agit. 5 etapes -> OU intervenir. 8 mecanismes -> COMMENT on se justifie. Un Leader Positif forme les autres.' },
      { keys: ['spirale','silence','noelle','neumann','taire','isolement','minoritaire','consensus','opinion','signalement','boite'],
        text: 'M07 Spirale du silence (Noelle-Neumann, 1974) : quand on croit etre minoritaire, on se tait par peur de l exclusion sociale. A l ecole, les temoins se taisent non par indifference mais par peur d etre eux-memes cibles. Ce silence valide l agresseur. UN seul eleve qui parle suffit a rompre l illusion du consensus silencieux.' },
      { keys: ['milgram','zimbardo','obeissance','autorite','agentique','desobeir','stanford','ordre','legitime','abusif'],
        text: 'M08 Milgram (1963) : 65% des personnes obeissent a une autorite jusqu au bout, meme pour nuire. Etat agentique = se percevoir comme instrument d une autorite -> on transfere sa responsabilite morale. Zimbardo/Stanford (1971) : des roles de pouvoir creent des comportements abusifs en 6 jours. L obeissance a une autorite abusive n est pas une excuse.' },
      { keys: ['pairs','aidants','soutien','bouclier','protege','france','victimes','hawkins','menesini','700000'],
        text: 'M09 Programmes pairs-aidants : eleves formes qui soutiennent leurs camarades. Menesini & Ortega (2009) : -15 a 30% de victimisation. En France (MEN 2023) : 700 000 eleves victimes de violences scolaires/an, 2,6% harcelement severe. Hawkins (2001) : 57% des situations s arretent en 10s quand un pair intervient.' },
      { keys: ['norme','identite','tajfel','turner','charte','cvs','conseil','scolaire','minorite','moscovici','architecte','appartenance'],
        text: 'M10 Tajfel & Turner (1979) : on adopte les normes du groupe pour maintenir son appartenance. Les normes changent quand des membres influents adoptent de nouveaux comportements (minorite active, Moscovici). Charte pHARe = contrat co-construit efficace. CVS : les eleves deviennent architectes des normes de l etablissement.' }
    ],

    /* -- HISTOIRE (HIS) 8 entrees -- */
    'HIS': [
      { keys: ['mot','nommer','nom','origine','avant','bizutage','rite','passage','invisible','virilite','caserne','forger','caractere'],
        text: 'M01 Avant 1969, le mot harcelement scolaire n existait pas. Sans nom, pas de visibilite institutionnelle. La violence entre eleves etait vue comme un rite de passage durcissant. Le bizutage (present depuis le Moyen Age) legitimait l humiliation. La croyance que souffrir forge le caractere rendait l inaction normale. Nommer un probleme = premier acte de resistance.' },
      { keys: ['heinemann','olweus','mobbing','bullying','critere','intentionnel','repetition','asymetrie','desequilibre','scientifique','norvege','suicide','1969','1973','1982'],
        text: 'M02 Heinemann (1969) : premier a nommer mobbing (attaque collective). Olweus (1973) definit 3 criteres : intentionnalite + repetition + desequilibre de pouvoir. 1982 : suicides de 3 adolescents norvegiens -> premiere campagne nationale anti-harcelement. Ces criteres distinguent harcelement (asymetrique, repete) et conflit ponctuel.' },
      { keys: ['loi','juridique','penal','delit','code','2022','3018','droit','recours','infraction','legislation','debarbieux'],
        text: 'M03 & M09 Avant 2022, pas de cadre penal specifique. La loi mars 2022 (n 2022-299) fait du harcelement scolaire un delit penal — premiere en France. Elle cree le 3018 (numero national gratuit, anonyme, 7j/7), oblige les etablissements a designer un referent, reconnait le cyberharcelement. Debarbieux documentait l ampleur dans les annees 2000.' },
      { keys: ['phare','programme','ambassadeur','3018','signalement','protocole','formation','pilier'],
        text: 'M04 Programme pHARe (2021, deploye 2022) : Eduquer, Former, Intervenir, Associer, Mobiliser. Repose sur l insight d Heinemann : harcelement = phenomene de groupe. Les ambassadeurs eleves creent une culture anti-harcelement collective. 3018 = numero national, anonyme, 7j/7.' },
      { keys: ['memoire','reparation','todorov','litterale','exemplaire','amnesique','oublie','pardonne','verite','reconciliation','afrique','braithwaite','honte','tutu'],
        text: 'M06 Todorov : memoire litterale (reste prisonniere du passe, risque de vengeance) vs memoire exemplaire (tirer des lecons). Commission Verite et Reconciliation (Afrique du Sud, Desmond Tutu, 1996) : nommer sans effacer. Braithwaite : honte stigmatisante isole et aggrave. Honte reintegrative repare.' },
      { keys: ['juste','figure','upstander','arendt','banalite','eichmann','mal','bien','staub','empath','courage','yad vashem'],
        text: 'M07 Hannah Arendt : banalite du mal — Eichmann etait un bureaucrate ordinaire qui avait arrete de penser. Il existe aussi une banalite du bien : 28 000 Justes (Yad Vashem). Ervin Staub : 3 caracteristiques des Justes — empathie cognitive, responsabilite personnelle, autonomie par rapport au groupe. Upstander = agit sans attendre.' },
      { keys: ['regard','decolonis','fanon','perspective','point de vue','recit','version','manuel','biais','representation','deux versions','unesco'],
        text: 'M08 Frantz Fanon : la colonisation passe aussi par les representations. UNESCO 2021 : perspectives d Afrique, Amerique latine, Asie sous-representees dans les manuels. Tout recit vient d un point de vue. Dans un conflit entre eleves, ce que tu entends est UNE version. L autre version existe. La comprendre ne signifie pas excuser.' },
      { keys: ['paix','ecrire','accord','nations','unies','onu','dudh','regles','co-construit','co-construire','particip','contrat','classe','charte'],
        text: 'M10 Charte des Nations Unies (1945), DUDH : 1800 mots, rediges pour etre compris par tous. Principe : une regle que personne n a construite ne sera jamais respectee. Un accord co-construit vaut mieux qu une regle imposee. Application : regle de vie de classe co-construite par les eleves = respectee.' }
    ],

    /* -- JURIDIQUE (JUR) 10 entrees -- */
    'JUR': [
      { keys: ['article','222','code penal','delit','peine','prison','amende','legal','critere','repetition','intentionnel','asymetrie','meute','effet de meute'],
        text: 'M01 Art. 222-33-2-3 Code Penal : harcelement = violence repetee, intentionnelle, avec asymetrie de pouvoir. Peines : jusqu a 10 ans si la victime se suicide. Effet de meute : si plusieurs personnes commettent chacune UN acte, elles sont TOUTES coupables — la victime subit bien la repetition. Exclusion sociale repetee = harcelement psychologique.' },
      { keys: ['bandura','desengagement','moral','mecanisme','psychologie','statut','88','19','30','adolescent','cerveau','striatum','defens'],
        text: 'M02 Bandura : 8 mecanismes de desengagement moral (identiques GRP). 88% des harcelements ont lieu devant temoins — mais seulement 19-30% interviennent. Cerveau ado : striatum ventral hyperactif -> besoin fort de validation du groupe. Les defenseurs sont PROTEGES par leur statut social positif, pas fragilises.' },
      { keys: ['cyber','numerique','ligne','internet','reseau','capture','screenshot','preuve','snapchat','anonymat','usurpation','identite','fake','compte','revenge'],
        text: 'M03 Cyberharcelement = extension du reel. Usurpation d identite (art. 226-4-1) : faux compte = delit des la creation (1 an + 15 000 euros). Revenge porn (art. 226-2-1) = delit. Loi francaise s applique si victime OU auteur est en France. Snapchat conserve des logs. Procedure preuve : screenshot immediat avec date/heure + URL + contexte. Ne jamais supprimer avant de capturer.' },
      { keys: ['article 40','signalement','protocole','phare','mpp','methode','preoccupation','partagee','fonctionnaire','obligation','piliers','novembre','detection','procureur'],
        text: 'M04 Article 40 CPP : tout fonctionnaire DOIT informer le Procureur sans delai — ne pas signaler = faute professionnelle. 5 piliers pHARe : Eduquer, Former, Intervenir, Associer, Mobiliser. MPP (Methode Preoccupation Partagee) : l adulte exprime sa preoccupation sans accuser directement les auteurs — ils deviennent acteurs de la solution. Sanctions progressives : avertissement -> blame -> exclusion -> conseil de discipline.' },
      { keys: ['systemique','vision','systeme','sanction seule','insuffisant','defenseur','game changer','harmonie','catalyseur','reintegration','normes','suivi'],
        text: 'M05 Vision systemique : le harcelement n est JAMAIS isole entre 2 personnes. Auteurs, temoins, groupe, institution sont impliques. La sanction seule traite le symptome, pas la cause. Sans travail sur les normes, la situation revient. Le Defenseur est le game-changer (57% d arret en 10s). Ambassadeur = catalyseur, pas policier.' },
      { keys: ['restauratif','restaurative','retributif','retributive','zehr','reparation','justice','reparer','punir','braithwaite','honte','stigmatis','reintegrat'],
        text: 'M06 Howard Zehr (1990) : justice retributive (quelle peine ?) vs restaurative (quel tort ? comment reparer ?). Les deux peuvent coexister. Braithwaite : honte stigmatisante isole et aggrave. Honte reintegrative responsabilise sans exclure. MPP en milieu scolaire = approche restaurative concrete.' },
      { keys: ['cide','convention','enfant','droits','internationale','1989','onu','article 19','article 12','article 3','article 28','dignite','interet superieur','entendu'],
        text: 'M07 CIDE (1989, 196 Etats). 4 principes : non-discrimination (art.2), interet superieur de l enfant (art.3), droit a la vie/developpement (art.6), droit d etre entendu (art.12). A l ecole : harcelement viole art.19 (violences mentales). Punition humiliante = violation art.28. Ne pas ecouter la victime = violation art.12.' },
      { keys: ['chaine','protection','acteur','institution','police','justice','ass','infirmier','assistante','direction','etablissement','signaler','qui contacter','cpe'],
        text: 'M08 Chaine de protection : etablissement (CPE, principal), assistante sociale (ASS), infirmier scolaire, police/gendarmerie, parquet. Ces acteurs se transmettent les informations selon la gravite. Un eleve doit savoir qu il existe des portes d entree et que chaque signalement declenche une reponse adaptee.' },
      { keys: ['rgpd','donnees','personnelles','cnil','informatique','liberte','ip','photo','localisation','consentement','effacement','oubli','droit acces'],
        text: 'M09 RGPD (2018) + Loi informatique et libertes (1978). Donnee personnelle = toute info permettant d identifier : nom, photo, adresse IP, localisation GPS, resultats scolaires, navigation. CNIL = autorite francaise — sanctions jusqu a 4% du CA mondial. Droits : acces, rectification, effacement (droit a l oubli), opposition.' },
      { keys: ['etre entendu','sanctionner','expliquer','droits defense','procedure','equitable','presomption','innocence','dudh','due process','cedh'],
        text: 'M10 Principe fondamental (DUDH art.10-11, CEDH art.6) : nul ne peut etre sanctionne sans avoir pu s expliquer. A l ecole aussi. Sanction juste = entendre l accuse, les temoins, decider de facon proportionnee. Un eleve accuse a tort a le droit d etre entendu et rehabilite. La presomption d innocence est une garantie, pas un obstacle.' }
    ]


  ,
  'NEU': [
    { keys: ['empathie','cognitive','affective','comprendre','ressentir','circuits','manipuler','paralyser','dimension'],
      text: 'M01 Empathie : 2 dimensions — Cognitive (comprendre les pensees et intentions d autrui sans les ressentir) + Affective (resonance emotionnelle face a la souffrance). Deux circuits cerebraux differents. Comprendre sans ressentir peut conduire a manipuler. Ressentir sans comprendre peut paralyser. Les deux ensemble = empathie complete.' },
    { keys: ['cerveau','ado','adolescent','cortex','prefrontal','limbique','risque','pairs','maturite','construction','immature'],
      text: 'M02 Cerveau adolescent : pas fini. Le systeme emotionnel (limbique) murit en premier — tres sensible aux recompenses sociales. Le cortex prefrontal (controle, reflexion) finit de se developper vers 25 ans. Resultat : emotions intenses + controle limite. Les ados prennent plus de risques en presence de pairs car le cerveau social influence les decisions.' },
    { keys: ['emoion','nommer','alexithymie','ekman','universelle','joie','colere','peur','tristesse','langage','granularite'],
      text: 'M03 Nommer les emotions : mettre un mot sur une emotion ("je suis anxieux") diminue l activite de l amygdale. L alexithymie = difficulte a identifier ses emotions (10% pop). Ekman : 6 emotions universelles — joie, tristesse, colere, peur, degout, surprise. La granularite emotionnelle (precision du vocabulaire) aide le cerveau a mieux traiter la situation.' },
    { keys: ['douleur','sociale','dacc','physique','cyberball','exclusion','rejet','harcelement','neurologique','circuit','paracetamol'],
      text: 'M04 Douleur sociale : le cerveau ne distingue pas douleur physique et douleur sociale. Le dACC (cortex cingulaire anterieur) est le centre commun. Etude Cyberball : meme en sachant que les joueurs sont des algorithmes, l exclusion active les memes circuits. Le harcelement n est pas "juste moral" — il est neurologique. DeWall (2010) : le paracetamol reduit partiellement la douleur sociale.' },
    { keys: ['regulation','emotionnelle','coherence cardiaque','respiration','recadrage','cognitif','metacognition','amygdale','parasympathique','moduler'],
      text: 'M05 Regulation emotionnelle : moduler intensite, duree et expression des emotions (pas les supprimer). Coherence cardiaque : 5s inspiration / 5s expiration, calme l amygdale en moins de 3 min. Recadrage cognitif : changer l interpretation d une situation modifie l emotion. Metacognition : observer ses emotions sans s y noyer ("je SENS la colere" vs "je SUIS en colere").' },
    { keys: ['reconsolidation','memorielle','ledoux','souvenir','reecrit','traumatisme','fixed mindset','growth mindset','dweck','neuroplasticite'],
      text: 'M06 Reconsolidation memorielle (LeDoux) : chaque fois qu on rappelle un souvenir, on le reecrit legerement. Fonction utile : reduire la charge emotionnelle d un douleur passee. Dweck : fixed mindset (capacites fixes) vs growth mindset (capacites constructibles). Le growth mindset change litteralement quelles zones cerebrales s activent face a l echec.' },
    { keys: ['sommeil','amygdale','60','privation','chronobiologie','melatonine','social jetlag','horaires','scolaire','consolidation','memoire'],
      text: 'M07 Sommeil et cerveau ado : Walker (2017) — privation de sommeil rend l amygdale 60% plus reactive. La chronobiologie adolescente decale la secretion de melatonine (rythme naturel plus tard). Social jetlag = decalage entre rythme impose (ecole tot) et rythme naturel. Une nuit complete consolide l apprentissage mieux que 2h de revision supplementaires.' },
    { keys: ['dopamine','addiction','renforcement','intermittent','likes','notifications','loot box','recompense','impulsivite','25 ans'],
      text: 'M09 Dopamine et addictions : dopamine = signal du plaisir anticipe et motivation a repeter. Le renforcement intermittent (recompense imprevue) est le plus addictif — principe des machines a sous. Likes, notifications, loot boxes utilisent ce mecanisme. Le cerveau finit de maturiser a 25 ans : ado = systeme de recompense hypersensible + frein (cortex prefrontal) en construction.' },
    { keys: ['neuroplasticite','pleine conscience','mindfulness','DMN','holzel','matiere grise','structure','cerveau','remodeler','meditation','8 semaines'],
      text: 'M10 Neuroplasticite et pleine conscience : la pratique reguliere de la mindfulness reduit le volume de l amygdale (moins de reactivite emotionnelle). Holzel et al. : changements structuraux cerebraux mesurables en 8 semaines. Le DMN (Default Mode Network) s active en pilote automatique — la pleine conscience entraine a l interrompre. Le cerveau peut se remodeler.' }
  ],

  'VEA': [
    { keys: ['force','personnelle','valeur','connaissance de soi','boussole','lucidite','energie','naturellement','deficit'],
      text: 'M01 Forces et valeurs : une force personnelle = ce qu on fait naturellement bien ET qui donne de l energie (pas seulement ce qu on reussit). Les valeurs = ce qui guide les choix selon sa conscience (loyaute, honnetete, curiosite). Beaucoup de forces sont invisibles a leurs proprietaires — les autres les voient avant nous. Connaissance de soi = voir forces ET difficultes (pas que les defauts).' },
    { keys: ['emotion','signal','colere','injustice','peur','danger','tristesse','perte','intelligence emotionnelle','bloquer','amygdale'],
      text: 'M02 Emotions comme signaux : ni bonnes ni mauvaises. La colere signale une injustice. La peur signale un danger. La tristesse signale une perte. Bloquer ses emotions = elles reviennent plus fort. Intelligence emotionnelle = reconnaitre une emotion, la nommer, decider comment repondre sans etre submerge. Nommer l emotion ("je suis anxieux") diminue l activite de l amygdale.' },
    { keys: ['empathie','pitie','brenebrown','neurones miroirs','ecoute active','comprendre','perspective','lien','distance','reformuler'],
      text: 'M03 Empathie vs pitie : la pitie regarde l autre de haut. L empathie descend au niveau de l autre sans juger. Brene Brown : "L empathie cree du lien. La pitie cree de la distance." Neurones miroirs : cellules qui s activent quand on observe quelqu un agir ou ressentir — base neurologique de l empathie. Ecoute active = ecouter sans preparer sa reponse, reformuler, dire "je suis la pour toi".' },
    { keys: ['assertivite','assertif','cnv','ofnr','observation','besoin','demande','message je','message tu','passif','agressif','rosenberg'],
      text: 'M04 Assertivite et CNV : assertif = exprimer ce qu on pense clairement et respectueusement, ni agressif ni soumis. Formule OFNR (Rosenberg) : Observation + Feeling (emotion) + Need (besoin) + Request (demande). Ex : "Quand tu coupes la parole (obs.), je me sens frustre (em.) parce que j ai besoin d etre entendu (besoin). Peux-tu me laisser finir ? (demande)". Message "je" au lieu de "tu" reduit la defensive.' },
    { keys: ['prosocial','prosocialite','bystander','spectateur','intervenir','aider','entraide','bien-etre','groupe','recompense'],
      text: 'M05 Comportement prosocial : action volontaire pour aider les autres sans y etre oblige. Tenir une porte, defendre quelqu un, consoler = prosocialite. Elle renforce la confiance mutuelle et la resilience du groupe. Effet spectateur inverse : se sentir personnellement concerne brise le phenomene. Les personnes prosociales ont un bien-etre plus eleve — aider active le systeme de recompense cerebral.' },
    { keys: ['ambassadeur','capital social','conflit','modele','normes','imitation','mobiliser','conditions','neurones miroirs','resilience'],
      text: 'M06 Ambassadeur et capital social : un ambassadeur ne se comporte pas seulement bien — il cree les conditions pour que les autres puissent aussi le faire. Neurones miroirs : voir quelqu un agir bien donne la permission et le modele. Capital social = valeur des liens : confiance, entraide, normes communes. Gerer un conflit = chercher les besoins non exprimes, pas designer un coupable.' },
    { keys: ['estime de soi','rosenberg','autocompassion','growth mindset','dweck','echec','valeur personnelle','globale','conditionnelle'],
      text: 'M07 Estime de soi et autocompassion : l estime de soi est une evaluation globale du sentiment de valeur personnelle (pas limitee a une competence). Rosenberg : estime haute (competence + appartenance) vs estime basse (doute, honte). Growth mindset (Dweck) : l intelligence evolue avec l effort — change le rapport a l echec. L autocompassion (se traiter comme un ami en difficulte) motive davantage que l autocritique.' },
    { keys: ['cnv','ofnr','chacal','girafe','non violente','communication','rosenberg','jugement','exigence','blesser'],
      text: 'M08 CNV de Rosenberg : OFNR = Observation sans jugement → Sentiment vecu → Besoin sous-jacent → Demande concrete et positive. Metaphore : le chacal juge et exige ("tu es nul, tu dois"). La girafe connecte ("j observe, je ressens, j ai besoin, je demande"). La formulation CNV exprime un vecu sans accusation — elle reduit la defensive et ouvre le dialogue.' },
    { keys: ['interdependance','cooperative','jigsaw','efficacite collective','coopération','enseigner','groupe','succes'],
      text: 'M09 Apprentissage cooperatif : l interdependance positive = la reussite de chacun depend de celle des autres, rendant la cooperation naturelle. Methode Jigsaw : chaque eleve enseigne sa partie et ecoute les autres — force une cooperation reelle, donne de la valeur a chaque contribution. L efficacite collective est une croyance malleable — des succes communs la renforcent (cercle vertueux).' },
    { keys: ['justice restaurative','zehr','reparation','relation','punition','baton de parole','mediation','mediateur','autochtone','reparation'],
      text: 'M10 Justice restaurative (Zehr 2002) : centree sur la reparation des relations, pas la punition. Question : "Qui a ete blesse ? Quels sont ses besoins ?" plutot que "Qui a transgresse ? Quelle punition ?". Baton de parole (tradition autochtone) : seule la personne qui le tient parle — cree l ecoute authentique et l egalite des voix. Les mediateurs formes developpent empathie et resolution de conflits durables.' }
  ]

  }; /* fin KERN_RAG_KB */

  /* ===================== RAG : normalisation et recherche ===================== */
  function normStr(s) {
    return (s || '').toLowerCase()
      .replace(/[éèêë]/g, 'e')
      .replace(/[àâä]/g, 'a')
      .replace(/[îï]/g, 'i')
      .replace(/[ôö]/g, 'o')
      .replace(/[ûü]/g, 'u')
      .replace(/ç/g, 'c');
  }

  function findRagContext(pillarKey, question) {
    var entries = KERN_RAG_KB[pillarKey];
    if (!entries || !entries.length) return '';
    var q = normStr(question);
    var scored = [];
    entries.forEach(function(e) {
      var score = 0;
      e.keys.forEach(function(kw) { if (q.indexOf(normStr(kw)) >= 0) score += 2; });
      normStr(e.text).split(/\s+/).forEach(function(w) {
        if (w.length > 5 && q.indexOf(w) >= 0) score += 1;
      });
      if (score > 0) scored.push({ score: score, text: e.text });
    });
    scored.sort(function(a, b) { return b.score - a.score; });
    if (!scored.length) {
      var fallbacks = {
        'GRP': 'Le Pilier Groupe couvre : Triangle (Auteur/Cible/Temoins), 5 etapes du temoin (Darley-Latane), 8 pieges cognitifs, KiVa/Pikas, Spirale du Silence, Milgram/Zimbardo, programmes pairs-aidants, theorie des normes (Tajfel-Turner).',
        'HIS': 'Le Pilier Histoire couvre : origine du mot harcelement (Heinemann 1969, Olweus 1973), loi 2022 et 3018, programme pHARe, memoire et reparation (Todorov, CVR), Figures du Juste (Arendt, Staub), decolonisation du regard (Fanon), ecriture de la paix.',
        'JUR': 'Le Pilier Juridique couvre : definition penale (art.222-33-2-3), psychologie (Bandura), cyberharcelement, protocole pHARe et art.40, vision systemique, justice restaurative (Zehr), CIDE (droits enfant), chaine de protection, RGPD, droit d etre entendu.',
        'NEU': 'Le Pilier Neurosciences couvre : empathie cognitive/affective, cerveau adolescent (cortex prefrontal/limbique), nommer les emotions, douleur sociale (dACC), regulation emotionnelle (coherence cardiaque, recadrage), reconsolidation memorielle (LeDoux), sommeil et amygdale, dopamine et addictions, neuroplasticite (Holzel, mindfulness).',
        'VEA': 'Le Pilier Vie Emotionnelle couvre : forces et valeurs personnelles, emotions comme signaux, intelligence emotionnelle, empathie vs pitie (Brene Brown), assertivite et CNV Rosenberg (OFNR), prosocialite, ambassadeur et capital social, estime de soi, autocompassion, apprentissage cooperatif (Jigsaw), justice restaurative.'
      };
      return fallbacks[pillarKey] || '';
    }
    return scored.slice(0, 2).map(function(s) { return s.text; }).join('\n');
  }

  /* ===================== Helpers DOM ===================== */
  function getPillarByKey(key) {
    if (typeof window.PILLARS === 'undefined' || !Array.isArray(window.PILLARS)) return null;
    for (var i = 0; i < window.PILLARS.length; i++) {
      if (window.PILLARS[i].key === key) return window.PILLARS[i];
    }
    return null;
  }
  function getMessagesEl() { return document.getElementById('agora-messages'); }
  function getPanelEl()    { return document.getElementById('agora-panel'); }
  function getInputEl()    { return document.getElementById('agora-input'); }

  function appendKernMsg(role, htmlText, extraClass) {
    var msgs = getMessagesEl();
    if (!msgs) { console.warn('[KernPillar] #agora-messages introuvable'); return null; }
    var d = document.createElement('div');
    d.className = 'agora-msg ' + (role === 'user' ? 'user' : 'ai') + (extraClass ? ' ' + extraClass : '');
    d.innerHTML = '<span class="msg-name">' + (role === 'user' ? 'Toi' : 'Kern') + '</span>' + htmlText;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  }
  function openKernPanel() {
    var panel = getPanelEl();
    if (panel && !panel.classList.contains('open')) panel.classList.add('open');
    var section = document.getElementById('agora-section');
    if (section) try { section.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch(e) {}
  }
  function setKernInputBusy(busy) {
    var inp = getInputEl();
    var btn = document.getElementById('agora-send');
    if (inp) inp.disabled = !!busy;
    if (btn) btn.disabled = !!busy;
    if (!busy && inp) inp.focus();
  }

  /* ===================== LLM ===================== */
  async function ensureLLMReady() {
    if (!window.LocalLLM) { alert('Module LocalLLM absent.'); return false; }
    if (window.LocalLLM.isReady()) return true;
    openKernPanel();
    var loading = appendKernMsg('kern',
      '<b>🔄 Activation de l\'assistant local...</b><br>' +
      '<span class="kern-llm-progress">Telechargement du modele Qwen2.5-0.5B (~400 MB) - premiere visite uniquement.</span>');
    var progressSpan = loading ? loading.querySelector('.kern-llm-progress') : null;
    try {
      await window.LocalLLM.activate({
        onProgress: function(p) { if (progressSpan && p && p.text) progressSpan.textContent = p.text; },
        onReady: function() {
          if (loading) loading.innerHTML = '<span class="msg-name">Kern</span><b>✓ Assistant local pret.</b>';
          setKernInputBusy(false);
        }
      });
      return true;
    } catch(e) {
      if (progressSpan) progressSpan.textContent = 'Echec : ' + (e.message || e);
      return false;
    }
  }

  function buildModulesList(pillar) {
    return pillar.modules.slice(0, 5).map(function(m) { return '- ' + (m.name || ''); }).join('\n');
  }

  /* ===================== RESUME DU COURS ===================== */
  window.requestKernPillarSummary = async function(pillarKey) {
    var pillar = getPillarByKey(pillarKey);
    if (!pillar) { alert('Pilier inconnu : ' + pillarKey); return; }
    openKernPanel();
    if (pillarSummaryCache[pillarKey]) {
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
    var ragContext = findRagContext(pillarKey, '');
    var systemPrompt =
      'Tu es Kern, assistant de formation anti-harcelement.\n' +
      'Reponds en francais, 3 phrases maximum, clair et simple.\n' +
      'Pas de titres. Pas de listes. Pas de repetitions.';
    var userPrompt =
      'Pilier : ' + (pillar.title || pillar.key) +
      (pillar.desc ? ' — ' + pillar.desc : '') +
      (ragContext ? '\n\nSavoirs cles du pilier :\n' + ragContext : '\nModules : ' + buildModulesList(pillar)) +
      '\n\nFais un resume tres court en 3 phrases simples pour un eleve de college.';
    var streaming = '';
    var result = await window.LocalLLM.ask({
      systemPrompt: systemPrompt, userPrompt: userPrompt,
      options: {
        temperature: 0.45, maxTokens: 160, topK: 40, topP: 0.85, repeatPenalty: 1.35,
        onChunk: function(piece) { streaming += piece; if (streamSpan) streamSpan.textContent = streaming; }
      }
    });
    if (result && result.ok && result.text) {
      pillarSummaryCache[pillarKey] = result.text;
      if (streamSpan) streamSpan.textContent = result.text;
      kpSaveMsg('kern', 'Resume — ' + (pillar.title || pillar.key) + '\n\n' + result.text);
    } else {
      if (streamSpan) streamSpan.textContent = '[erreur : ' + ((result && result.error) || 'inconnue') + ']';
    }
    setKernInputBusy(false);
  };

  /* ===================== AIDE KERN (mode coach) ===================== */
  window.startKernPillarCoach = async function(pillarKey) {
    var pillar = getPillarByKey(pillarKey);
    if (!pillar) { alert('Pilier inconnu : ' + pillarKey); return; }
    openKernPanel();
    var ok = await ensureLLMReady();
    if (!ok) return;
    pillarCoachMode = pillarKey;
    appendKernMsg('kern',
      '<b>🛡️ Mode Coach — ' + (pillar.title || pillar.key) + '</b><br>' +
      'Pose-moi tes questions sur les notions de ce pilier. Je connais les ' + pillar.modules.length + ' modules.<br>' +
      'Pour quitter, ecris : <code>mode normal</code>');
    kpSaveMsg('kern', 'Mode Coach — ' + (pillar.title || pillar.key) + '\nPour quitter : mode normal');
    var input = getInputEl();
    if (input) input.placeholder = 'Pose ta question sur ' + (pillar.title || pillar.key) + '...';
    setKernInputBusy(false);
    if (origSendKern === null && typeof window.sendKern === 'function') origSendKern = window.sendKern;

    window.sendKern = async function() {
      var inp = getInputEl();
      var text = inp && inp.value ? inp.value.trim() : '';
      if (!text) return;
      inp.value = '';
      appendKernMsg('user', text.replace(/\n/g, '<br>'));
      kpSaveMsg('user', text);
      if (/^mode\s+normal$/i.test(text)) {
        pillarCoachMode = null;
        appendKernMsg('kern', 'Mode normal reactive. Tu peux poser n\'importe quelle question.');
        if (origSendKern) window.sendKern = origSendKern;
        if (inp) inp.placeholder = 'Demande une aventure, une scene a choix, ou decris une situation reelle...';
        setKernInputBusy(false);
        return;
      }
      setKernInputBusy(true);
      var ragContext = findRagContext(pillarKey, text);
      var systemPrompt =
        'Tu es Kern, coach anti-harcelement pour college.\n' +
        'Reponds en francais, 2 a 3 phrases courtes, simples, directes.\n' +
        'Utilise les savoirs fournis. Pas de titres. Pas de repetition.';
      var userPrompt = (ragContext ? 'Savoirs cles :\n' + ragContext + '\n\n' : '') + 'Question : ' + text;
      var msgEl = appendKernMsg('kern', '<span class="kern-stream"><i>Reflexion...</i></span>');
      var streamSpan = msgEl ? msgEl.querySelector('.kern-stream') : null;
      var streaming = '';
      var result = await window.LocalLLM.ask({
        systemPrompt: systemPrompt, userPrompt: userPrompt,
        options: {
          temperature: 0.45, maxTokens: 160, topK: 40, topP: 0.85, repeatPenalty: 1.35,
          onChunk: function(piece) { streaming += piece; if (streamSpan) streamSpan.textContent = streaming; }
        }
      });
      if (result && result.ok && result.text) {
        if (streamSpan) streamSpan.textContent = result.text;
        kpSaveMsg('kern', result.text);
      } else {
        if (streamSpan) streamSpan.textContent = '[erreur : ' + ((result && result.error) || 'inconnue') + ']';
      }
      setKernInputBusy(false);
    };
  };

  /* ===================== Init ===================== */
  window.addEventListener('load', function() {
    kpRestoreHistory();
    if (typeof window.clearKernHistory === 'function') {
      var _origClear = window.clearKernHistory;
      window.clearKernHistory = function() { kpClearMsgs(); return _origClear.apply(this, arguments); };
    }
  });

  console.log('[kern_pillar_helpers] v1.4 charge. RAG — GRP:' +
    (KERN_RAG_KB['GRP'] || []).length + ' HIS:' +
    (KERN_RAG_KB['HIS'] || []).length + ' JUR:' +
    (KERN_RAG_KB['JUR'] || []).length + ' NEU:' +
    (KERN_RAG_KB['NEU'] || []).length + ' VEA:' +
    (KERN_RAG_KB['VEA'] || []).length + ' entrees.');
})();

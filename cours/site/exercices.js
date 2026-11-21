/* Moteur d'exercices auto-générés, et progression à la maîtrise.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * POURQUOI DES EXERCICES GÉNÉRÉS, ET NON UNE BANQUE
 *
 * Le programme de mathématiques du cycle 3 demande des « activités rituelles
 * de calcul » et énumère nommément les automatismes attendus en sixième
 * (CLM-MAT-002). Une banque de cent exercices s'épuise ; un générateur ne
 * s'épuise pas, et il permet la reprise espacée qu'exige la mémorisation
 * (SRC-PED-003).
 *
 * Le programme donne aussi la raison de fond, et elle n'est pas de nous :
 * la maîtrise des automatismes « allège la mémoire de travail de l'élève
 * lors de la résolution de problèmes » et « produit souvent des progrès
 * rapides, ce qui engage les élèves dans un cercle vertueux » (CLM-MAT-001).
 * La motivation vient du progrès constaté, pas d'un score.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * CE QUE CE MOTEUR N'A PAS, ET N'AURA PAS
 *
 * Ni score, ni classement, ni série à ne pas rompre, ni minuterie qui
 * sanctionne. La charte les écarte, et l'apprentissage par maîtrise n'en a
 * pas besoin : son ressort est de voir qu'on y arrive.
 *
 * Rien n'est envoyé nulle part. Tout vit dans le navigateur de l'élève, et
 * s'efface d'un bouton.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * LE SEUIL DE MAÎTRISE EST UN CHOIX, PAS UNE MESURE
 *
 * L'apprentissage par maîtrise a un effet établi, plus fort sur les élèves
 * les plus faibles — et son ampleur DÉPEND DE LA SÉVÉRITÉ DU CRITÈRE retenu
 * (CLM-PED-025). Un seuil trop laxiste annule l'effet. Les valeurs
 * ci-dessous sont donc une décision pédagogique assumée, pas un réglage
 * technique, et elles sont à un seul endroit pour être discutées :
 *
 *     5 réussites d'affilée          → « acquis, à confirmer »
 *     puis 3 réussites, un jour plus tard → « confirmé »
 *
 * La seconde étape n'est pas un ornement : sans reprise différée, on mesure
 * la mémoire de la minute, pas l'automatisme. Le programme lui-même parle
 * d'« activités rituelles », donc répétées dans le temps.
 *
 * Ce coût est réel : la maîtrise prend plus de temps qu'un survol. C'est
 * écrit dans la source, et ce n'est pas caché ici.
 */

export const SEUIL = {
  suite: 5,          // réussites consécutives pour « acquis »
  confirmation: 3,   // réussites pour confirmer, après le délai
  delaiHeures: 20,   // délai minimal avant la confirmation
  fenetre: 12,       // nombre d'essais gardés par générateur
};

/* ═══════════════════════ HASARD REPRODUCTIBLE ═══════════════════════════ *
 * Un exercice tiré d'une graine peut être rejoué à l'identique — utile pour
 * qu'un professeur puisse regarder exactement ce que l'élève a eu.        */

export function graine(n) {
  let a = n >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const entre = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const parmi = (r, l) => l[Math.floor(r() * l.length)];

/* Écriture française des nombres : virgule décimale, pas de zéro inutile. */
function fr(x, decimales) {
  let s = (decimales === undefined ? x : Number(x).toFixed(decimales));
  s = String(s);
  if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s.replace('.', ',');
}

/* On accepte la virgule comme le point, les espaces, et les espaces fines.
 * Un élève qui écrit « 0.1 » n'a pas fait d'erreur de mathématiques.      */
export function normalise(s) {
  return String(s == null ? '' : s)
    .replace(/ | |\s/g, '')
    .replace(',', '.')
    .replace(/^\+/, '')
    .replace(/^(-?)0+(\d)/, '$1$2')
    .replace(/(\.\d*?)0+$/, '$1')
    .replace(/\.$/, '');
}

/* Le français demande une autre comparaison que les nombres.
 *
 * On ignore la casse, les espaces en trop et l'apostrophe typographique.
 * On N'IGNORE PAS les accents : dans un exercice d'orthographe, « a » et
 * « à » sont justement ce qui se joue, et un contrôle indulgent sur ce
 * point ferait exactement le contraire de ce qu'on demande.               */
export function normaliseTexte(s) {
  return String(s == null ? '' : s)
    .toLowerCase()
    .replace(/[’‘ʼ]/g, "'")
    .replace(/[.,;:!?]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/* « attendu » peut être une liste : plusieurs écritures sont parfois
 * également justes — « le chat » et « chat » pour un sujet, par exemple.  */
export function juste(saisie, attendu) {
  const liste = Array.isArray(attendu) ? attendu : [attendu];
  return liste.some(a => unSeul(saisie, a));
}

function unSeul(saisie, attendu) {
  const a = normalise(saisie), b = normalise(attendu);
  if (a === b) return true;
  const na = Number(a), nb = Number(b);
  if (a !== '' && isFinite(na) && isFinite(nb) && Math.abs(na - nb) < 1e-9) return true;
  const ta = normaliseTexte(saisie);
  return ta !== '' && ta === normaliseTexte(attendu);
}

/* ═══════════════════════ LES GÉNÉRATEURS ═══════════════════════════════ *
 *
 * Chacun porte l'affirmation qui l'autorise. Un générateur sans source ne
 * rentre pas : il ferait travailler quelque chose que le programme ne
 * demande pas, au détriment de ce qu'il demande.
 *
 * « rang » ordonne la difficulté et sert au test de positionnement.        */

export const GENERATEURS = [
{
  id: 'MA6-AUT-01', discipline: 'mathematiques', niveau: '6e',
  domaine: 'Nombres et calcul', rang: 1, source: 'CLM-MAT-002',
  nom: 'Fractions décimales et écriture à virgule',
  quoi: "Passer d'une fraction décimale à l'écriture à virgule, et l'inverse.",
  faire(r) {
    const d = parmi(r, [10, 100, 1000]);
    const n = entre(r, 1, d - 1);
    if (r() < 0.5) {
      return { enonce: `Écris <strong>${n}/${d}</strong> avec une virgule.`,
               reponse: fr(n / d), aide: `${d} au dénominateur, donc ${String(d).length - 1} chiffre(s) après la virgule.` };
    }
    return { enonce: `Écris <strong>${fr(n / d)}</strong> sous forme de fraction de dénominateur ${d}.`,
             reponse: String(n), aide: `Combien de ${1}/${d} y a-t-il dans ce nombre ?`,
             suffixe: `/${d}` };
  }
},
{
  id: 'MA6-AUT-02', discipline: 'mathematiques', niveau: '6e',
  domaine: 'Nombres et calcul', rang: 2, source: 'CLM-MAT-002',
  nom: 'Relations entre les unités de numération',
  quoi: "Combien de dixièmes dans une unité, de millièmes dans un centième…",
  faire(r) {
    const u = [['1', 1], ['1/10', 0.1], ['1/100', 0.01], ['1/1000', 0.001]];
    let i = entre(r, 0, 2), j = entre(r, i + 1, 3);
    const f = Math.round(u[i][1] / u[j][1]);
    return { enonce: `Combien de fois <strong>${u[j][0]}</strong> faut-il pour faire <strong>${u[i][0]}</strong> ?`,
             reponse: String(f), aide: "On multiplie par 10 à chaque rang qu'on descend." };
  }
},
{
  id: 'MA6-AUT-03', discipline: 'mathematiques', niveau: '6e',
  domaine: 'Nombres et calcul', rang: 3, source: 'CLM-MAT-002',
  nom: 'Somme de fractions décimales',
  quoi: "Reconnaître qu'une somme de fractions décimales et un nombre à virgule sont le même nombre.",
  faire(r) {
    const e = entre(r, 1, 9), a = entre(r, 0, 9), b = entre(r, 0, 9), c = entre(r, 1, 9);
    const val = e + a / 10 + b / 100 + c / 1000;
    const morceaux = [`${e}`];
    if (a) morceaux.push(`${a}/10`);
    if (b) morceaux.push(`${b}/100`);
    morceaux.push(`${c}/1000`);
    return { enonce: `Écris avec une virgule : <strong>${morceaux.join(' + ')}</strong>`,
             reponse: fr(val), aide: "Chaque fraction donne un chiffre à son rang : dixièmes, centièmes, millièmes." };
  }
},
{
  id: 'MA6-AUT-04', discipline: 'mathematiques', niveau: '6e',
  domaine: 'Nombres et calcul', rang: 4, source: 'CLM-MAT-002',
  nom: 'Multiplier un décimal par 10, 100, 1000',
  quoi: "Appliquer la procédure sans compter les zéros au hasard.",
  faire(r) {
    const m = parmi(r, [10, 100, 1000]);
    const x = (entre(r, 101, 9999) / parmi(r, [10, 100, 1000]));
    return { enonce: `Calcule : <strong>${fr(x)} × ${m}</strong>`,
             reponse: fr(Math.round(x * m * 1e6) / 1e6),
             aide: `Multiplier par ${m}, c'est décaler chaque chiffre de ${String(m).length - 1} rang(s) vers la gauche.` };
  }
},
{
  id: 'MA6-AUT-05', discipline: 'mathematiques', niveau: '6e',
  domaine: 'Nombres et calcul', rang: 5, source: 'CLM-MAT-002',
  nom: 'Diviser un décimal par 10, 100, 1000',
  quoi: "Appliquer la procédure inverse, sans confondre les deux sens.",
  faire(r) {
    const m = parmi(r, [10, 100, 1000]);
    const x = entre(r, 12, 9999) / parmi(r, [1, 10, 100]);
    return { enonce: `Calcule : <strong>${fr(x)} ÷ ${m}</strong>`,
             reponse: fr(Math.round(x / m * 1e9) / 1e9),
             aide: `Diviser par ${m}, c'est décaler chaque chiffre de ${String(m).length - 1} rang(s) vers la droite.` };
  }
},
{
  id: 'MA6-AUT-06', discipline: 'mathematiques', niveau: '6e',
  domaine: 'Nombres et calcul', rang: 6, source: 'CLM-MAT-002',
  nom: 'Comparer deux nombres décimaux',
  quoi: "Comparer sans se laisser tromper par le nombre de chiffres.",
  faire(r) {
    // On fabrique exprès des paires où le plus long n'est pas le plus grand.
    const ent = entre(r, 0, 12);
    const a = ent + entre(r, 1, 9) / 10;
    const b = ent + entre(r, 10, 99) / 100;
    const x = fr(a), y = fr(b);
    const signe = a > b ? '>' : (a < b ? '<' : '=');
    return { enonce: `Compare : <strong>${x} … ${y}</strong><br><span class="fine">Réponds par &lt;, &gt; ou =</span>`,
             reponse: signe, choix: ['<', '>', '='],
             aide: "On compare rang par rang, en partant de la gauche. Le nombre de chiffres ne dit rien." };
  }
},
{
  id: 'MA6-AUT-07', discipline: 'mathematiques', niveau: '6e',
  domaine: 'Nombres et calcul', rang: 7, source: 'CLM-MAT-002',
  nom: 'Valeur arrondie',
  quoi: "Arrondir à l'unité, au dixième ou au centième.",
  faire(r) {
    const rangs = [['à l’unité', 0], ['au dixième', 1], ['au centième', 2]];
    const [nom, d] = parmi(r, rangs);
    const x = entre(r, 1000, 99999) / 1000;
    return { enonce: `Donne la valeur arrondie <strong>${nom}</strong> de <strong>${fr(x)}</strong>.`,
             reponse: fr(Number(x.toFixed(d))),
             aide: "On regarde le chiffre juste après le rang demandé : 5 ou plus, on monte." };
  }
},
{
  id: 'MA6-AUT-08', discipline: 'mathematiques', niveau: '6e',
  domaine: 'Nombres et calcul', rang: 8, source: 'CLM-MAT-002',
  nom: 'Valeur d’un chiffre selon son rang',
  quoi: "Ne pas confondre le chiffre et ce qu'il vaut.",
  faire(r) {
    const rangs = [['des dixièmes', 0.1, 1], ['des centièmes', 0.01, 2], ['des millièmes', 0.001, 3]];
    const [nom, pas, pos] = parmi(r, rangs);
    const ent = entre(r, 1, 99);
    const dec = entre(r, 100, 999);
    const x = ent + dec / 1000;
    const chiffre = Number(String(dec).padStart(3, '0')[pos - 1]);
    return { enonce: `Dans <strong>${fr(x)}</strong>, quelle est la <strong>valeur</strong> du chiffre ${nom} ?`,
             reponse: fr(Math.round(chiffre * pas * 1000) / 1000),
             aide: `Le chiffre est ${chiffre}. Sa valeur est ${chiffre} × ${fr(pas)}, pas ${chiffre}.` };
  }
},

/* ─── Français, CE2 ─────────────────────────────────────────────────────
 * Deux entrées, et deux seulement : ce sont celles que le programme du
 * cycle 2 nomme (CLM-FR-004). Tout le reste attend d'être relu.          */
{
  id: 'FCE2-AUT-01', discipline: 'francais', niveau: 'CE2',
  domaine: 'Grammaire — se repérer dans la phrase simple', rang: 1, source: 'CLM-FR-004',
  nom: 'Trouver le sujet quand il n’est pas au début',
  quoi: "Retrouver le sujet d'une phrase qui commence par autre chose que lui.",
  saisie: 'texte',
  faire(r) {
    const debuts = ['Dans le jardin', 'Chaque matin', 'Sous la table', 'Près de la rivière',
                    'Le soir', 'Pendant la récréation', 'Derrière la porte', 'En hiver',
                    'Depuis ce matin', 'Tout au fond de la cour'];
    // « anime » décide de la question : on dit « qui est-ce qui court ? »
    // d'un chien, et « qu'est-ce qui tombe ? » d'une feuille.
    const sujets = [
      { d: 'le', s: 'chat', n: 1, anime: true }, { d: 'les', s: 'oiseaux', n: 2, anime: true },
      { d: 'une', s: 'souris', n: 1, anime: true }, { d: 'mon', s: 'frère', n: 1, anime: true },
      { d: 'les', s: 'élèves', n: 2, anime: true }, { d: 'la', s: 'voisine', n: 1, anime: true },
      { d: 'deux', s: 'chiens', n: 2, anime: true }, { d: 'les', s: 'voisins', n: 2, anime: true },
      { d: 'le', s: 'vent', n: 1, anime: false }, { d: 'les', s: 'feuilles', n: 2, anime: false },
      { d: 'la', s: 'pluie', n: 1, anime: false }, { d: 'les', s: 'volets', n: 2, anime: false },
    ];
    const verbes = [['dort', 'dorment'], ['attend', 'attendent'], ['revient', 'reviennent'],
                    ['s’arrête', 's’arrêtent'], ['passe', 'passent'], ['tombe', 'tombent']];
    const c = parmi(r, debuts), u = parmi(r, sujets), v = parmi(r, verbes);
    const groupe = `${u.d} ${u.s}`;
    const conjugue = u.n === 1 ? v[0] : v[1];
    const question = u.anime ? 'Qui est-ce qui' : 'Qu’est-ce qui';
    return {
      enonce: `${question} ${conjugue} ?<br><strong>${c}, ${groupe} ${conjugue}.</strong>`,
      reponse: groupe,
      reponses: [groupe, u.s],
      aide: `Posez la question « ${question.toLowerCase()} ${conjugue} ? ». ` +
            `Ce n’est pas « ${c.toLowerCase()} » : le sujet n’est pas le premier mot de la phrase.`,
    };
  }
},
{
  id: 'FCE2-AUT-02', discipline: 'francais', niveau: 'CE2',
  domaine: 'Orthographe grammaticale — accords dans le groupe nominal', rang: 2, source: 'CLM-FR-004',
  nom: 'Le pluriel qu’on n’entend pas',
  quoi: "Mettre au pluriel un groupe nominal dont le pluriel ne s'entend pas.",
  saisie: 'texte',
  faire(r) {
    const g = parmi(r, [
      ['le petit chat', 'les petits chats'], ['la grande fleur', 'les grandes fleurs'],
      ['le joli dessin', 'les jolis dessins'], ['la longue route', 'les longues routes'],
      ['le vieux mur', 'les vieux murs'], ['la belle image', 'les belles images'],
      ['le gros nuage', 'les gros nuages'], ['la petite fenêtre', 'les petites fenêtres'],
      ['le nouveau cahier', 'les nouveaux cahiers'], ['la douce lumière', 'les douces lumières'],
      ['le dernier jour', 'les derniers jours'], ['la première page', 'les premières pages'],
    ]);
    return {
      enonce: `Écrivez au pluriel : <strong>${g[0]}</strong>`,
      reponse: g[1],
      aide: 'Le nom passe au pluriel, et les mots autour de lui le répètent par écrit — ' +
            'même quand on n’entend rien de plus.',
    };
  }
},

/* ─── Français, sixième ─────────────────────────────────────────────────
 * Les quatre entrées nommées par le programme du cycle 3 pour la sixième
 * (CLM-FM-002). Les homophones grammaticaux n'y figurent pas : il n'y a
 * donc pas de générateur pour eux, et ce n'est pas un oubli.             */
{
  id: 'FR6-AUT-01', discipline: 'francais', niveau: '6e',
  domaine: 'Orthographe grammaticale — accord du sujet et du verbe', rang: 1, source: 'CLM-FM-002',
  nom: 'Accorder malgré la distance',
  quoi: "Accorder le verbe avec son sujet quand d'autres mots se sont glissés entre les deux.",
  saisie: 'texte',
  faire(r) {
    // Chaque sujet porte un complément du NOMBRE OPPOSÉ à son noyau : c'est
    // le piège, et il est là dans tous les tirages, sans exception.
    const sujets = [
      { s: 'Le chien des voisins', noyau: 'le chien', n: 1 },
      { s: 'Les chiens du voisin', noyau: 'les chiens', n: 2 },
      { s: 'La liste des courses', noyau: 'la liste', n: 1 },
      { s: 'Les élèves de la classe', noyau: 'les élèves', n: 2 },
      { s: 'Le sac des enfants', noyau: 'le sac', n: 1 },
      { s: 'Les portes du placard', noyau: 'les portes', n: 2 },
      { s: 'La couleur des murs', noyau: 'la couleur', n: 1 },
      { s: 'Les fenêtres de la salle', noyau: 'les fenêtres', n: 2 },
      { s: 'Le bruit des moteurs', noyau: 'le bruit', n: 1 },
      { s: 'Les feuilles de l’arbre', noyau: 'les feuilles', n: 2 },
      { s: 'Le toit des maisons', noyau: 'le toit', n: 1 },
      { s: 'Les branches du chêne', noyau: 'les branches', n: 2 },
      { s: 'Le trousseau de clés', noyau: 'le trousseau', n: 1 },
      { s: 'Les boîtes de conserve', noyau: 'les boîtes', n: 2 },
      { s: 'La sœur de mes cousins', noyau: 'la sœur', n: 1 },
      { s: 'Les enfants du village', noyau: 'les enfants', n: 2 },
      { s: 'Le gardien des immeubles', noyau: 'le gardien', n: 1 },
      { s: 'Les joueurs de l’équipe', noyau: 'les joueurs', n: 2 },
    ];
    // Verbe ET complément vont avec n'importe lequel de ces sujets : un
    // toit qui court ferait douter de l'exercice avant de le faire réussir.
    const verbes = [
      ['être', 'est', 'sont', 'toujours là'],
      ['avoir', 'a', 'ont', 'de l’importance'],
      ['aller', 'va', 'vont', 'très bien'],
      ['faire', 'fait', 'font', 'du bruit'],
      ['prendre', 'prend', 'prennent', 'de la place'],
      ['venir', 'vient', 'viennent', 'de loin'],
      ['partir', 'part', 'partent', 'demain'],
      ['attendre', 'attend', 'attendent', 'depuis une heure'],
      ['tenir', 'tient', 'tiennent', 'malgré tout'],
      ['finir', 'finit', 'finissent', 'par céder'],
      ['disparaître', 'disparaît', 'disparaissent', 'chaque hiver'],
      ['revenir', 'revient', 'reviennent', 'chaque année'],
      ['changer', 'change', 'changent', 'avec le temps'],
      ['compter', 'compte', 'comptent', 'beaucoup ici'],
      ['manquer', 'manque', 'manquent', 'depuis lundi'],
      ['arriver', 'arrive', 'arrivent', 'en retard'],
      ['tomber', 'tombe', 'tombent', 'souvent'],
      ['durer', 'dure', 'durent', 'longtemps'],
      ['pouvoir', 'peut', 'peuvent', 'encore servir'],
      ['devoir', 'doit', 'doivent', 'changer'],
      ['bouger', 'bouge', 'bougent', 'à peine'],
      ['servir', 'sert', 'servent', 'encore'],
    ];
    const u = parmi(r, sujets), v = parmi(r, verbes);
    return {
      enonce: `Écrivez le verbe au présent.<br><strong>${u.s} ……… ${v[3]}.</strong> <em>(${v[0]})</em>`,
      reponse: u.n === 1 ? v[1] : v[2],
      aide: `Demandez : qui est-ce qui ${v[0]} ? Le sujet est « ${u.noyau} ». ` +
            'Les mots posés entre le sujet et le verbe ne s’accrochent pas au fil.',
    };
  }
},
{
  id: 'FR6-AUT-02', discipline: 'francais', niveau: '6e',
  domaine: 'Orthographe grammaticale — chaîne d’accords dans le groupe nominal', rang: 2, source: 'CLM-FM-002',
  nom: 'La chaîne d’accords, exceptions comprises',
  quoi: 'Accorder un nom et son adjectif au pluriel, y compris quand le pluriel est irrégulier.',
  saisie: 'texte',
  faire(r) {
    const g = parmi(r, [
      ['journal', 'local', 'journaux', 'locaux'], ['cheval', 'gris', 'chevaux', 'gris'],
      ['tableau', 'ancien', 'tableaux', 'anciens'], ['bateau', 'bleu', 'bateaux', 'bleus'],
      ['chapeau', 'neuf', 'chapeaux', 'neufs'], ['oiseau', 'blanc', 'oiseaux', 'blancs'],
      ['travail', 'manuel', 'travaux', 'manuels'], ['vitrail', 'coloré', 'vitraux', 'colorés'],
      ['caillou', 'rond', 'cailloux', 'ronds'], ['genou', 'fragile', 'genoux', 'fragiles'],
      ['prix', 'élevé', 'prix', 'élevés'], ['bras', 'long', 'bras', 'longs'],
      ['festival', 'annuel', 'festivals', 'annuels'], ['carnaval', 'bruyant', 'carnavals', 'bruyants'],
      ['bal', 'populaire', 'bals', 'populaires'], ['pneu', 'neuf', 'pneus', 'neufs'],
      ['landau', 'ancien', 'landaus', 'anciens'], ['détail', 'précis', 'détails', 'précis'],
      ['chandail', 'épais', 'chandails', 'épais'], ['voix', 'douce', 'voix', 'douces'],
      ['croix', 'blanche', 'croix', 'blanches'], ['eau', 'claire', 'eaux', 'claires'],
    ]);
    return {
      enonce: `Complétez au pluriel : <strong>ces ……… ………</strong> <em>(${g[0]} ${g[1]})</em>`,
      reponse: `${g[2]} ${g[3]}`,
      aide: 'Le nom d’abord, l’adjectif ensuite — et l’adjectif suit le nom, ' +
            'même quand le pluriel du nom est irrégulier.',
    };
  }
},
{
  id: 'FR6-AUT-03', discipline: 'francais', niveau: '6e',
  domaine: 'Grammaire — se repérer dans la phrase complexe', rang: 3, source: 'CLM-FM-002',
  nom: 'Compter les propositions',
  quoi: 'Compter les propositions d’une phrase en comptant ses verbes conjugués.',
  saisie: 'texte',
  faire(r) {
    const p = phrasesAssemblees(r, entre(r, 1, 3));
    return {
      enonce: `Combien de propositions dans cette phrase ?<br><strong>${p.texte}</strong>`,
      reponse: String(p.n),
      aide: 'Une proposition, un verbe conjugué. Comptez les verbes conjugués : ' +
            'les infinitifs et les participes ne comptent pas.',
    };
  }
},
{
  id: 'FR6-AUT-04', discipline: 'francais', niveau: '6e',
  domaine: 'Grammaire — se repérer dans la phrase complexe', rang: 4, source: 'CLM-FM-002',
  nom: 'Juxtaposition, coordination, subordination',
  quoi: 'Nommer la façon dont deux propositions sont articulées.',
  faire(r) {
    const p = phrasesAssemblees(r, 2);
    return {
      enonce: `Comment ces deux propositions sont-elles reliées ?<br><strong>${p.texte}</strong>`,
      choix: ['juxtaposition', 'coordination', 'subordination'],
      reponse: p.lien,
      aide: 'Rien qu’une virgule : juxtaposition. « mais, ou, et, donc, or, ni, car » : ' +
            'coordination. Un mot qui rend la seconde dépendante de la première ' +
            '(« quand », « parce que », « qui », « que ») : subordination. ' +
            'Attention : « car » coordonne, « parce que » subordonne.',
    };
  }
},
{
  id: 'FR6-AUT-05', discipline: 'francais', niveau: '6e',
  domaine: 'Grammaire — pronoms et antécédents', rang: 5, source: 'CLM-FM-002',
  nom: 'À qui renvoie ce pronom ?',
  quoi: 'Mettre un pronom personnel en relation avec son antécédent.',
  saisie: 'texte',
  faire(r) {
    // Trois référents de genres et de nombres tous différents : le pronom
    // ne peut alors désigner qu'un seul d'entre eux, et l'exercice a une
    // réponse et une seule.
    const personnes = {
      m: [['le facteur', 'facteur'], ['le gardien', 'gardien'], ['le voisin', 'voisin']],
      f: [['la maîtresse', 'maîtresse'], ['la directrice', 'directrice'], ['la voisine', 'voisine']],
    };
    const objets = {
      m: [['les colis', 'colis'], ['les cahiers', 'cahiers'], ['les cartons', 'cartons']],
      f: [['les clés', 'clés'], ['les affiches', 'affiches'], ['les enveloppes', 'enveloppes']],
    };
    const lieux = {
      m: [['le placard', 'placard'], ['le comptoir', 'comptoir'], ['le bureau', 'bureau']],
      // Pas d'élision ici : « l’étagère » cacherait le genre, et l'exercice
      // porte justement sur le genre et le nombre.
      f: [['la table', 'table'], ['la vitrine', 'vitrine'], ['la fenêtre', 'fenêtre']],
    };
    const gp = r() < 0.5 ? 'm' : 'f';          // genre de la personne
    const gl = gp === 'm' ? 'f' : 'm';         // le lieu prend l'autre genre
    const go = r() < 0.5 ? 'm' : 'f';          // le genre de l'objet est libre : il est au pluriel
    const P = parmi(r, personnes[gp]), O = parmi(r, objets[go]), lieu = parmi(r, lieux[gl]);
    const cibles = [
      { ref: P, pron: gp === 'm' ? 'Il' : 'Elle', pl: false },
      { ref: O, pron: go === 'm' ? 'Ils' : 'Elles', pl: true },
      { ref: lieu, pron: gl === 'm' ? 'Il' : 'Elle', pl: false },
    ];
    const c = parmi(r, cibles);
    const suite = c.pl ? 'n’ont pas bougé de la journée' : 'n’a pas bougé de la journée';
    return {
      enonce: `À qui ou à quoi renvoie le pronom en gras ?<br>` +
              `<strong>${P[0].charAt(0).toUpperCase() + P[0].slice(1)} a posé ${O[0]} sur ${lieu[0]}. ` +
              `<em>${c.pron}</em> ${suite}.</strong>`,
      reponse: c.ref[0],
      reponses: [c.ref[0], c.ref[1]],
      aide: `« ${c.pron} » est ${c.pl ? 'au pluriel' : 'au singulier'} et ` +
            `${/^(Il|Ils)$/.test(c.pron) ? 'masculin' : 'féminin'} : un seul des trois groupes ` +
            'de la première phrase a ce genre et ce nombre.',
    };
  }
},
];

/* Assemble 1, 2 ou 3 propositions, chacune avec un seul verbe conjugué.
 * Le compte est donc connu par construction, et non deviné après coup. */
function phrasesAssemblees(r, combien) {
  const bouts = [
    'le vent souffle', 'la porte claque', 'les enfants rient', 'le chien aboie',
    'la lampe s’éteint', 'nous partons', 'le train arrive', 'les feuilles tombent',
    'la pluie cesse', 'les volets battent', 'le feu crépite', 'la nuit tombe',
  ];
  const liens = [
    { mot: ', ', type: 'juxtaposition' },
    { mot: ' et ', type: 'coordination' },
    { mot: ' mais ', type: 'coordination' },
    { mot: ' car ', type: 'coordination' },
    { mot: ' quand ', type: 'subordination' },
    { mot: ' parce que ', type: 'subordination' },
    { mot: ' pendant que ', type: 'subordination' },
  ];
  const choisis = [];
  while (choisis.length < combien) {
    const b = parmi(r, bouts);
    if (!choisis.includes(b)) choisis.push(b);
  }
  let texte = choisis[0], lien = null;
  for (let i = 1; i < choisis.length; i++) {
    const l = parmi(r, liens);
    if (i === 1) lien = l.type;
    texte += l.mot + choisis[i];
  }
  texte = texte.charAt(0).toUpperCase() + texte.slice(1) + '.';
  return { texte, n: combien, lien };
}

export const parId = id => GENERATEURS.find(g => g.id === id);

export function pourNiveau(discipline, niveau) {
  return GENERATEURS.filter(g => g.discipline === discipline && g.niveau === niveau)
                    .sort((a, b) => a.rang - b.rang);
}

/* ═══════════════════════ MAÎTRISE ══════════════════════════════════════ *
 *
 * Trois états, et un seul chemin entre eux :
 *
 *   à travailler  →  acquis (5 d'affilée)  →  confirmé (3 de plus, un jour après)
 *
 * Rien ne redescend automatiquement : un élève ne perd pas ce qu'il a
 * confirmé parce qu'il s'est trompé une fois. Il peut en revanche tout
 * effacer lui-même, ce qui est autre chose.                                */

const CLE = 'ci_exercices';

function tout() { try { return JSON.parse(localStorage.getItem(CLE) || '{}'); } catch (e) { return {}; } }
function ecrire(o) { try { localStorage.setItem(CLE, JSON.stringify(o)); } catch (e) {} }

export function etatDe(id) {
  const e = tout()[id] || {};
  return { essais: e.essais || [], acquis: e.acquis || null, confirme: e.confirme || null };
}

export function statut(id) {
  const e = etatDe(id);
  if (e.confirme) return 'confirme';
  if (e.acquis) {
    const h = (Date.now() - new Date(e.acquis).getTime()) / 3600000;
    return h >= SEUIL.delaiHeures ? 'a-confirmer' : 'acquis';
  }
  return 'a-travailler';
}

/** Combien de réussites d'affilée, dans l'état courant. */
export function suiteEnCours(id) {
  const e = etatDe(id);
  let n = 0;
  for (let i = e.essais.length - 1; i >= 0; i--) {
    if (e.essais[i]) n++; else break;
  }
  return n;
}

/** Enregistre un essai et renvoie le nouveau statut. */
export function noter(id, reussi) {
  const o = tout();
  const e = o[id] || { essais: [], acquis: null, confirme: null };
  e.essais = e.essais.concat([!!reussi]).slice(-SEUIL.fenetre);

  let n = 0;
  for (let i = e.essais.length - 1; i >= 0; i--) { if (e.essais[i]) n++; else break; }

  if (!e.acquis && n >= SEUIL.suite) {
    e.acquis = new Date().toISOString();
    e.essais = [];                       // la confirmation repart de zéro
  } else if (e.acquis && !e.confirme) {
    const h = (Date.now() - new Date(e.acquis).getTime()) / 3600000;
    if (h >= SEUIL.delaiHeures && n >= SEUIL.confirmation) e.confirme = new Date().toISOString();
  }
  o[id] = e;
  ecrire(o);
  return statut(id);
}

/** Le prochain générateur à travailler : le plus facile non confirmé. */
export function prochain(discipline, niveau) {
  const l = pourNiveau(discipline, niveau);
  return l.find(g => statut(g.id) === 'a-confirmer')
      || l.find(g => statut(g.id) === 'a-travailler')
      || l.find(g => statut(g.id) === 'acquis')
      || null;
}

export function avancementExercices(discipline, niveau) {
  const l = pourNiveau(discipline, niveau);
  const c = l.filter(g => statut(g.id) === 'confirme').length;
  return { total: l.length, confirmes: c, liste: l };
}

/* Le point de départ posé par le positionnement. C'est une POSITION, pas un
 * profil : elle se recalcule, elle n'est jamais transmise, et l'élève peut la
 * changer ou l'effacer lui-même à tout moment (CLM-PED-026). */
const CLE_DEPART = 'ci_depart';

export function depart(discipline) {
  try { return (JSON.parse(localStorage.getItem(CLE_DEPART) || '{}'))[discipline] || null; }
  catch (e) { return null; }
}

export function poserDepart(discipline, rang) {
  try {
    const o = JSON.parse(localStorage.getItem(CLE_DEPART) || '{}');
    o[discipline] = { rang, pose: new Date().toISOString() };
    localStorage.setItem(CLE_DEPART, JSON.stringify(o));
  } catch (e) {}
}

export function oublierDepart(discipline) {
  try {
    const o = JSON.parse(localStorage.getItem(CLE_DEPART) || '{}');
    delete o[discipline];
    localStorage.setItem(CLE_DEPART, JSON.stringify(o));
  } catch (e) {}
}

export function toutEffacer() {
  try { localStorage.removeItem(CLE); localStorage.removeItem(CLE_DEPART); } catch (e) {}
}

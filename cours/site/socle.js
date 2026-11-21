/* Socle commun aux trois hubs.
 *
 * Une seule source pour : la carte, l'inventaire, l'avancement, et le calcul
 * de ce qu'on propose a l'eleve.
 *
 * PRINCIPE DE L'ADAPTATION — il vaut la peine d'etre ecrit ici, en haut.
 * Rien de ce qui ressemble a un profil n'est enregistre. Ce que le navigateur
 * garde, ce sont des FAITS : tel module acheve tel jour, telle reponse ecrite,
 * tel rappel fait. Ce qu'on propose a l'eleve se RECALCULE a chaque visite a
 * partir de ces faits. Un profil enregistre survit a l'eleve qui a change ;
 * un calcul le suit.
 *
 * Et l'adaptation oriente, elle ne restreint jamais : tout niveau, toute
 * discipline et toute entree de differenciation restent accessibles d'un clic,
 * meme quand le site en propose une autre en premier.
 */

const CLE = 'ci_progres';

export function progres() {
  try { return JSON.parse(localStorage.getItem(CLE) || '{}'); } catch (e) { return {}; }
}
export function ecrire(p) {
  try { localStorage.setItem(CLE, JSON.stringify(p)); } catch (e) {}
}
export function majEtat(id, champs) {
  const p = progres();
  p[id] = Object.assign({}, p[id], champs);
  ecrire(p);
}
export function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
export function heuresDepuis(iso) {
  return (Date.now() - new Date(iso).getTime()) / 3600000;
}

/* --- Chargement de la carte et de l'inventaire ---------------------------- */

let CACHE = null;

export async function charger(prefixe = '') {
  if (CACHE) return CACHE;
  const [pr, ix] = await Promise.all([
    fetch(prefixe + 'programme.json').then(r => r.ok ? r.json() : null).catch(() => null),
    fetch(prefixe + 'modules/index.json').then(r => r.ok ? r.json() : null).catch(() => null)
  ]);
  const ecrits = new Map();
  (ix && ix.modules || []).forEach(m => ecrits.set(m.id, m));
  CACHE = { programme: pr, ecrits };
  return CACHE;
}

export function discipline(programme, id) {
  return (programme && programme.disciplines || []).find(d => d.id === id) || null;
}

/** Tous les identifiants declares d'une discipline pour un niveau donne. */
export function idsDuNiveau(disc, niveau) {
  const n = (disc && disc.niveaux || []).find(x => x.niveau === niveau);
  if (!n) return [];
  return n.themes.flatMap(t => t.modules.map(m => m.id));
}

/* --- Avancement, recalcule a chaque appel --------------------------------- */

/** Ce que l'eleve a reellement fait dans un niveau : rien n'est stocke ici. */
export function avancement(disc, niveau, ecrits) {
  const p = progres();
  const ids = idsDuNiveau(disc, niveau);
  const disponibles = ids.filter(i => ecrits.has(i));
  const acheves = disponibles.filter(i => (p[i] || {}).fait);
  const rappels = acheves.filter(i => (p[i] || {}).rappelJ1);
  return {
    declares: ids.length,
    disponibles: disponibles.length,
    acheves: acheves.length,
    rappelsFaits: rappels.length,
    reste: disponibles.filter(i => !(p[i] || {}).fait),
  };
}

/**
 * Le meme calcul, mais sur TOUTES les disciplines d'un niveau.
 *
 * Le hub de niveau parlait de « votre annee » en ne comptant que l'histoire :
 * tant qu'elle etait seule, l'erreur ne se voyait pas. Elle se voit des la
 * deuxieme discipline, et elle se reverra a chaque fois qu'on en ajoutera une.
 */
export function avancementNiveau(programme, niveau, ecrits) {
  const total = { declares: 0, disponibles: 0, acheves: 0, rappelsFaits: 0, reste: [] };
  (programme && programme.disciplines || []).forEach(d => {
    const a = avancement(d, niveau, ecrits);
    total.declares += a.declares;
    total.disponibles += a.disponibles;
    total.acheves += a.acheves;
    total.rappelsFaits += a.rappelsFaits;
    total.reste = total.reste.concat(a.reste);
  });
  return total;
}

/**
 * Les niveaux declares, toutes disciplines confondues, dans l'ordre ou la
 * carte les presente. Aucune discipline ne sert de reference aux autres.
 */
const ORDRE_SCOLAIRE = ['CP', 'CE1', 'CE2', 'CM1', 'CM2', '6e', '5e', '4e', '3e'];
const PRIMAIRE = ['CP', 'CE1', 'CE2', 'CM1', 'CM2'];

/**
 * Un enfant de huit ans et un de douze ne lisent pas la meme page.
 *
 * Katzir, Hershko & Halamish (2013) : reduire la taille de police de 20 %
 * fait chuter la comprehension des jeunes lecteurs et ameliore celle des
 * plus ages — l'interaction avec l'age est significative. Allonger la ligne
 * de 20 % fait chuter les jeunes lecteurs, sans effet chez les plus ages.
 *
 * CE QUE L'ETUDE NE DONNE PAS : aucune valeur absolue. Elle compare deux
 * references differentes (20 pt et 13 pt), en hebreu, sur 90 enfants, sans
 * discuter la transferabilite a une autre ecriture. Les valeurs posees dans
 * style.css sont donc des CHOIX qui suivent une direction, pas des mesures.
 * Voir CLM-TYP-001 et CLM-TYP-002.
 */
export function appliqueCycle(niveau) {
  const c = PRIMAIRE.includes(niveau) ? 'primaire' : 'college';
  document.documentElement.setAttribute('data-cycle', c);
  return c;
}

export function niveauxDeclares(programme) {
  const vus = [];
  (programme && programme.disciplines || []).forEach(d => {
    (d.niveaux || []).forEach(n => { if (!vus.includes(n.niveau)) vus.push(n.niveau); });
  });
  // Une annee scolaire a un ordre, et ce n'est pas celui du fichier. Un niveau
  // inconnu de la liste passe a la fin, dans l'ordre ou la carte l'a declare.
  return vus.sort((a, b) => {
    const ia = ORDRE_SCOLAIRE.indexOf(a), ib = ORDRE_SCOLAIRE.indexOf(b);
    if (ia === -1 && ib === -1) return vus.indexOf(a) - vus.indexOf(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

/**
 * Faut-il PROPOSER d'aller au-dela ?
 *
 * Condition : avoir termine tout ce qui existe a son niveau, et avoir fait au
 * moins un rappel differe — parce qu'enchainer des modules sans jamais les
 * reactiver ne montre pas qu'on a retenu, seulement qu'on a avance.
 *
 * Ce n'est jamais un verrou : le niveau superieur reste accessible sans cela.
 * C'est une proposition, calculee, et qui disparait si les faits changent.
 */
function tourFait(a) {
  return a.disponibles > 0 && a.acheves === a.disponibles && a.rappelsFaits >= 1;
}

export function proposerAuDela(disc, niveau, ecrits) {
  return tourFait(avancement(disc, niveau, ecrits));
}

/** La meme regle, mais sur l'annee entiere plutot que sur une seule matiere. */
export function proposerAuDelaNiveau(programme, niveau, ecrits) {
  return tourFait(avancementNiveau(programme, niveau, ecrits));
}

/**
 * Quelle entree de differenciation proposer EN PREMIER dans un module.
 * Recalculee a partir des modules deja acheves — jamais enregistree, jamais
 * affichee comme un jugement, et les trois entrees restent ouvertes.
 */
export function entreeProposee(ecrits) {
  const p = progres();
  const acheves = [...ecrits.keys()].filter(i => (p[i] || {}).fait);
  const avecRappel = acheves.filter(i => (p[i] || {}).rappelJ1);
  if (acheves.length >= 2 && avecRappel.length >= 1) return 'approfondissement';
  if (acheves.length === 0) return 'guidee';
  return 'guidee';
}

/* --- Rappels differes ----------------------------------------------------- */

const HEURES_AVANT_RAPPEL = 20;   // « demain », sans exiger 24 h pile

export function rappelsDus(ecrits) {
  const p = progres();
  return [...ecrits.values()].filter(m => {
    const e = p[m.id];
    return e && e.fait && !e.rappelJ1 && m.rappelJ1
        && heuresDepuis(e.fait) >= HEURES_AVANT_RAPPEL;
  });
}

/** Le bloc de rappel, identique dans tous les hubs : l'indice seul. */
export function poserRappels(zone, ecrits, apres) {
  zone.innerHTML = '';
  rappelsDus(ecrits).forEach(m => {
    const bloc = document.createElement('div');
    bloc.className = 'avis';
    bloc.innerHTML = `
      <h2>Un rappel vous attend</h2>
      <p class="fine">${esc(m.id)} — ${esc(m.titre)}. Répondez de mémoire :
      c'est l'effort de retrouver qui fait tenir, pas la relecture.</p>
      <p class="scene" style="margin-top:.8rem"><strong>${esc(m.rappelJ1)}</strong></p>
      <div class="question" style="border:0;padding:0;margin-top:.6rem">
        <textarea aria-label="Votre réponse au rappel"></textarea>
        <button class="bouton" type="button">J'ai répondu</button>
        <button class="bouton discret" type="button">Plus tard</button>
      </div>`;
    const [valider, plusTard] = bloc.querySelectorAll('.question button');
    const texte = bloc.querySelector('textarea');
    valider.addEventListener('click', () => {
      if (!texte.value.trim()) { texte.focus(); return; }
      majEtat(m.id, {
        rappelJ1: new Date().toISOString(),
        rappelJ1Reponse: texte.value.trim().slice(0, 600)
      });
      bloc.innerHTML = `<h2>Rappel fait</h2>
        <p class="fine">Votre réponse est gardée dans ce navigateur. La prochaine
        réactivation viendra dans un autre module, sur une autre matière — c'est
        là qu'on verra si l'outil sert vraiment.</p>`;
      if (apres) setTimeout(apres, 1600);
    });
    plusTard.addEventListener('click', () => bloc.remove());
    zone.appendChild(bloc);
  });
}

/* --- Niveau choisi -------------------------------------------------------- */

export function niveauChoisi() {
  try { return localStorage.getItem('ci_niveau') || ''; } catch (e) { return ''; }
}
export function choisirNiveau(n) {
  try { n ? localStorage.setItem('ci_niveau', n) : localStorage.removeItem('ci_niveau'); } catch (e) {}
}

/* --- Contraste ------------------------------------------------------------ */

/**
 * La voie « Pas a pas ».
 *
 * Un bouton, ouvert a tout le monde, reversible a tout instant. Ce n'est PAS
 * un mode attribue a certains eleves : le site ne devine jamais qui en aurait
 * besoin, ne le propose a personne en particulier, et n'enregistre rien
 * d'autre qu'une preference d'affichage dans ce navigateur — exactement comme
 * le contraste.
 *
 * Le contenu ne change pas : meme piece, meme pari, meme verdict, meme
 * exigence. Ce qui change est la presentation et le rythme.
 *
 * Aucun nom de trouble n'apparait ici, ni dans la classe CSS, ni dans la clef
 * de stockage. Voir knowledge-base/pedagogie/voie-adaptee-tdah-dyslexie.md.
 */
export function voieActive() {
  try { return localStorage.getItem('ci_voie') === 'pasapas'; } catch (e) { return false; }
}

export function appliqueVoie() {
  const on = voieActive();
  document.documentElement.setAttribute('data-voie', on ? 'pasapas' : 'normale');
  return on;
}

export function poserVoie(bouton, apres) {
  function applique() {
    bouton.setAttribute('aria-pressed', String(appliqueVoie()));
  }
  bouton.addEventListener('click', () => {
    try { localStorage.setItem('ci_voie', voieActive() ? 'normale' : 'pasapas'); } catch (e) {}
    applique();
    if (apres) apres(voieActive());
  });
  try { applique(); } catch (e) {}
}

export function poserContraste(bouton) {
  function applique() {
    const t = localStorage.getItem('ci_theme');
    if (t) document.documentElement.setAttribute('data-theme', t);
    bouton.setAttribute('aria-pressed', String(t === 'sombre'));
  }
  bouton.addEventListener('click', () => {
    const actuel = document.documentElement.getAttribute('data-theme');
    const neuf = actuel === 'sombre' ? 'clair' : 'sombre';
    try { localStorage.setItem('ci_theme', neuf); } catch (e) {}
    applique();
  });
  try { applique(); } catch (e) {}
}

/* Favicon. Aucune page n'en declarait ; le navigateur demandait alors
 * /favicon.ico et recevait un 404 a chaque visite. Le glyphe est celui de la
 * balise du site : un jalon, trait d'appui sur fond de papier. */
(function () {
  if (typeof document === 'undefined' || document.querySelector('link[rel~="icon"]')) return;
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">'
    + '<rect width="32" height="32" rx="6" fill="#faf7f0"/>'
    + '<circle cx="16" cy="16" r="11" fill="none" stroke="#2f4858" stroke-width="2.5"/>'
    + '<path d="M16 9v14M11 14l5-5 5 5" fill="none" stroke="#2f4858" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
    + '</svg>';
  const l = document.createElement('link');
  l.rel = 'icon';
  l.type = 'image/svg+xml';
  l.href = 'data:image/svg+xml,' + encodeURIComponent(svg);
  document.head.appendChild(l);
})();

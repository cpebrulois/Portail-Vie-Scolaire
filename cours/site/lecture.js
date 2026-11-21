/* Lecture à voix haute et compagnon d'étude.
 *
 * LECTURE — la synthèse du navigateur, pas un fichier audio. C'est gratuit,
 * hors ligne, sans clef, et le texte lu reste à l'écran : la transcription est
 * donc intégrale par construction, ce qu'exige la charte d'accessibilité.
 * Jamais de lecture automatique. Toujours pause, reprise et vitesse.
 * Le jour où une narration enregistrée existera, il suffira de renseigner un
 * fichier dans le module : la fonction ci-dessous le prendra en priorité.
 *
 * MARGE — le compagnon. Le navigateur n'envoie qu'un identifiant de module,
 * une étape et une question. Aucun contenu de cours ne transite : le serveur
 * va chercher l'autorité dans ses propres fichiers, et il en retire les
 * réponses attendues avant de parler au modèle.
 */

/* ═══════════════════════ LECTURE À VOIX HAUTE ═══════════════════════════ */

const SYNTH = window.speechSynthesis || null;
let voixFr = null;
let enCours = null;      // { bouton, texte }

function choisirVoix() {
  if (!SYNTH) return;
  const v = SYNTH.getVoices();
  voixFr = v.find(x => /^fr/i.test(x.lang) && /female|femme|amelie|audrey/i.test(x.name))
        || v.find(x => /^fr/i.test(x.lang)) || null;
}
if (SYNTH) {
  choisirVoix();
  SYNTH.addEventListener('voiceschanged', choisirVoix);
}

function vitesse() {
  const v = parseFloat(localStorage.getItem('ci_vitesse') || '1');
  return isFinite(v) ? Math.min(1.5, Math.max(0.7, v)) : 1;
}

function texteLisible(section) {
  // On lit ce qui est écrit, dans l'ordre où c'est écrit — sans les commandes.
  const copie = section.cloneNode(true);
  copie.querySelectorAll('button, .duree, .etiquette, textarea, .lecture').forEach(e => e.remove());
  return copie.textContent.replace(/\s+/g, ' ').trim().slice(0, 4000);
}

function arreter() {
  if (SYNTH) SYNTH.cancel();
  if (enCours) { enCours.bouton.textContent = 'Écouter'; enCours.bouton.setAttribute('aria-pressed', 'false'); }
  enCours = null;
}

export function poserLecture(section, jalon) {
  if (!SYNTH) return;                      // navigateur sans synthèse : on n'affiche rien
  const zone = document.createElement('span');
  zone.className = 'lecture';

  const bouton = document.createElement('button');
  bouton.type = 'button';
  bouton.className = 'mini';
  bouton.textContent = 'Écouter';
  bouton.setAttribute('aria-pressed', 'false');

  const debit = document.createElement('select');
  debit.className = 'mini';
  debit.setAttribute('aria-label', 'Vitesse de lecture');
  [['0.8', 'lent'], ['1', 'normal'], ['1.2', 'rapide']].forEach(([v, l]) => {
    const o = document.createElement('option');
    o.value = v; o.textContent = l;
    if (String(vitesse()) === v) o.selected = true;
    debit.appendChild(o);
  });
  debit.addEventListener('change', () => {
    try { localStorage.setItem('ci_vitesse', debit.value); } catch (e) {}
    if (enCours && enCours.bouton === bouton) { arreter(); bouton.click(); }
  });

  bouton.addEventListener('click', () => {
    if (enCours && enCours.bouton === bouton) { arreter(); return; }
    arreter();
    const u = new SpeechSynthesisUtterance(texteLisible(section));
    u.lang = 'fr-FR';
    if (voixFr) u.voice = voixFr;
    u.rate = vitesse();
    u.onend = arreter;
    u.onerror = arreter;
    enCours = { bouton, texte: u };
    bouton.textContent = 'Arrêter';
    bouton.setAttribute('aria-pressed', 'true');
    SYNTH.speak(u);
  });

  zone.appendChild(bouton);
  zone.appendChild(debit);
  jalon.appendChild(zone);
}

// Quitter la page ne doit pas laisser une voix parler dans le vide.
window.addEventListener('pagehide', arreter);

/* ═══════════════════════════ MARGE ═════════════════════════════════════ */

export function poserMarge(hote, idModule, etapeCourante) {
  const bloc = document.createElement('aside');
  bloc.className = 'marge';
  bloc.innerHTML = `
    <button type="button" class="marge-onglet" aria-expanded="false" aria-controls="margePanneau">
      Demander à Marge
    </button>
    <div class="marge-panneau" id="margePanneau" hidden>
      <p class="fine">Marge reformule, explique un mot, découpe une idée. Elle ne donnera pas
      la réponse d'une question : elle ne l'a pas. C'est un programme, pas une personne.</p>
      <div class="marge-fil" id="margeFil"></div>
      <label class="fine" for="margeQ">Votre question</label>
      <textarea id="margeQ" rows="2" placeholder="Par exemple : que veut dire « rapporté » ?"></textarea>
      <button type="button" class="bouton discret" id="margeEnvoi">Envoyer</button>
      <div id="margeErr"></div>
    </div>`;
  hote.appendChild(bloc);

  const onglet = bloc.querySelector('.marge-onglet');
  const panneau = bloc.querySelector('.marge-panneau');
  const fil = bloc.querySelector('#margeFil');
  const champ = bloc.querySelector('#margeQ');
  const envoi = bloc.querySelector('#margeEnvoi');
  const err = bloc.querySelector('#margeErr');

  onglet.addEventListener('click', () => {
    const ouvert = panneau.hidden;
    panneau.hidden = !ouvert;
    onglet.setAttribute('aria-expanded', String(ouvert));
    if (ouvert) champ.focus();
  });

  function dire(qui, texte) {
    const d = document.createElement('div');
    d.className = 'marge-bulle ' + qui;
    d.innerHTML = `<span class="qui">${qui === 'moi' ? 'Vous' : 'Marge'}</span><span class="dit"></span>`;
    d.querySelector('.dit').textContent = texte;
    fil.appendChild(d);
    fil.scrollTop = fil.scrollHeight;
    return d;
  }

  envoi.addEventListener('click', async () => {
    const q = champ.value.trim();
    if (q.length < 3) { champ.focus(); return; }
    err.innerHTML = '';
    dire('moi', q);
    champ.value = '';
    envoi.disabled = true;
    const attente = dire('marge', '…');
    try {
      const r = await fetch('/api/marge', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: idModule, etape: etapeCourante(), question: q })
      });
      const j = await r.json().catch(() => null);
      attente.remove();
      if (!r.ok || !j || j.error) throw new Error((j && j.error) || ('Erreur ' + r.status));
      dire('marge', j.reponse);
    } catch (e) {
      attente.remove();
      err.innerHTML = `<p class="fine" style="color:var(--accent)">${e.message}</p>`;
    }
    envoi.disabled = false;
  });

  champ.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) envoi.click();
  });
}

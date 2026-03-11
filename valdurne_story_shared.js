const CFG = window.VALDURNE_CONFIG || {};
const STORY_KEY = CFG.storyKey || 'ave6e_valdurne_story_v1';
const TOTAL_MAIN_SCENES = CFG.totalScenes || 1;
const IMAGE_EXTENSIONS = ['jpg','jpeg','png','webp'];
const AUDIO_EXTENSIONS = ['mp3','ogg','wav'];

function assetSources(stems, preferred='jpg'){
  const base = (Array.isArray(stems) ? stems : [stems]).filter(Boolean);
  const seen = new Set();
  const exts = [preferred].concat(IMAGE_EXTENSIONS).filter(ext => {
    const key = String(ext || '').toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return base.flatMap(stem => exts.map(ext => `${stem}.${ext}`));
}

function audioSources(stems, preferred='mp3'){
  const base = (Array.isArray(stems) ? stems : [stems]).filter(Boolean);
  const seen = new Set();
  const exts = [preferred].concat(AUDIO_EXTENSIONS).filter(ext => {
    const key = String(ext || '').toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return base.flatMap(stem => exts.map(ext => `${stem}.${ext}`));
}

function bindOptionalImage(imgEl, src, alt, fallbackEl, extras = {}){
  if(!imgEl) return;
  const sources = Array.isArray(src) ? src.filter(Boolean) : (src ? [src] : []);
  let index = 0;
  function showFallback(){
    imgEl.style.display = 'none';
    if (fallbackEl) fallbackEl.style.display = 'flex';
    if (extras.container) extras.container.hidden = true;
    if (extras.captionEl) extras.captionEl.textContent = '';
  }
  if (!sources.length) { showFallback(); return; }
  function load(){
    if (index >= sources.length) { showFallback(); return; }
    imgEl.src = sources[index];
  }
  imgEl.onload = () => {
    imgEl.style.display = 'block';
    if (fallbackEl) fallbackEl.style.display = 'none';
    if (extras.container) extras.container.hidden = false;
    if (extras.captionEl) extras.captionEl.textContent = extras.captionText || '';
  };
  imgEl.onerror = () => { index += 1; load(); };
  imgEl.alt = alt || '';
  load();
}

function defaultState(){
  return {
    currentScene: CFG.firstScene,
    cleared: [],
    completed: false,
    audioEnabled: true,
    audioVolume: typeof CFG.defaultVolume === 'number' ? CFG.defaultVolume : 0.85
  };
}

function getState(){
  try {
    const data = JSON.parse(localStorage.getItem(STORY_KEY) || '{}');
    return Object.assign(defaultState(), data && typeof data === 'object' ? data : {});
  } catch (e) {
    return defaultState();
  }
}

function saveState(state){
  localStorage.setItem(STORY_KEY, JSON.stringify(state));
}

function sceneOrder(){ return CFG.sceneOrder || []; }
function currentScene(){ const state = getState(); return CFG.scenes[state.currentScene] || CFG.scenes[CFG.firstScene]; }
function percentDone(state){ const done = Math.min((state.cleared || []).length, TOTAL_MAIN_SCENES); return Math.round((done / TOTAL_MAIN_SCENES) * 100); }
function markCleared(sceneId){ const state = getState(); if (!state.cleared.includes(sceneId) && sceneOrder().includes(sceneId)) state.cleared.push(sceneId); saveState(state); }
function gotoScene(sceneId){ const state = getState(); state.currentScene = sceneId; if (sceneId === CFG.epilogueId) state.completed = true; saveState(state); renderScene(); }
function closeModal(){ const modal = document.getElementById('restartModal'); modal.classList.remove('show'); modal.setAttribute('aria-hidden','true'); }
function restartStory(){ const fresh = defaultState(); const prev = getState(); fresh.audioEnabled = prev.audioEnabled; fresh.audioVolume = prev.audioVolume; saveState(fresh); closeModal(); renderScene(); }
function openHub(){ window.location.href = CFG.hubFile || 'hub_liam_eystieval.html'; }
function openBonus(){ if (CFG.bonusFile) window.location.href = CFG.bonusFile; }

function openRestartModal(fail){
  document.getElementById('restartIcon').textContent = (fail && fail.icon) || '🛞';
  document.getElementById('restartTitle').textContent = (fail && fail.title) || 'La route se referme';
  document.getElementById('restartText').textContent = (fail && fail.text) || CFG.failDefault || "Cette piste n'était pas la bonne. Le voyage repart depuis l'aube.";
  const modal = document.getElementById('restartModal');
  modal.classList.add('show');
  modal.setAttribute('aria-hidden','false');
}

function stopSceneAudio(updateStatus = true){
  const audio = document.getElementById('sceneAudio');
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  if (updateStatus) document.getElementById('audioStatus').textContent = "Narration arrêtée. Tu peux la relancer quand tu veux.";
}

function updateAudioControls(){
  const state = getState();
  document.getElementById('audioToggleBtn').textContent = state.audioEnabled ? '🔊 Couper la narration' : '🔈 Remettre la narration';
}

function playSceneAudio(autoAttempt = false){
  const state = getState();
  const scene = currentScene();
  const audio = document.getElementById('sceneAudio');
  const status = document.getElementById('audioStatus');
  if (!audio || !status) return;
  stopSceneAudio(false);
  audio.volume = state.audioVolume;
  if (!state.audioEnabled) {
    status.textContent = "Narration coupée. Les commandes audio restent disponibles dans la colonne de gauche.";
    return;
  }
  const sources = Array.isArray(scene.audio) ? scene.audio : [];
  let index = 0;
  function trySource(){
    if (index >= sources.length) {
      audio.removeAttribute('src');
      audio.load();
      status.textContent = "Aucun enregistrement détecté pour cette scène. Dépose le MP3 correspondant puis recharge la page.";
      return;
    }
    audio.src = sources[index];
    audio.load();
  }
  audio.onloadeddata = () => {
    const promise = audio.play();
    if (promise && typeof promise.catch === 'function') {
      promise.then(() => { status.textContent = `Narration active : ${scene.title}.`; })
      .catch(() => {
        status.textContent = autoAttempt
          ? "Le navigateur a bloqué le lancement automatique. Utilise Réécouter la scène."
          : "Le navigateur a bloqué la lecture. Réessaie avec le bouton audio.";
      });
      return;
    }
    status.textContent = `Narration active : ${scene.title}.`;
  };
  audio.onerror = () => { index += 1; trySource(); };
  trySource();
}

function toggleAudio(){ const state = getState(); state.audioEnabled = !state.audioEnabled; saveState(state); updateAudioControls(); if (state.audioEnabled) playSceneAudio(false); else stopSceneAudio(true); }
function setAudioVolume(value){ const state = getState(); state.audioVolume = Math.min(1, Math.max(0, Number(value || 85) / 100)); saveState(state); const audio = document.getElementById('sceneAudio'); if (audio) audio.volume = state.audioVolume; }
function choiceClicked(choice){ if (choice.next) { markCleared(currentScene().id); gotoScene(choice.next); return; } if (choice.action === 'restart') { restartStory(); return; } if (choice.action === 'hub') { openHub(); return; } if (choice.action === 'bonus') { openBonus(); return; } openRestartModal(choice.fail); }

function renderScene(){
  const state = getState();
  const scene = currentScene();
  const progress = Math.max(0, percentDone(state));
  const sceneIdx = sceneOrder().includes(scene.id) ? sceneOrder().indexOf(scene.id) + 1 : TOTAL_MAIN_SCENES;
  document.getElementById('chapterPill').textContent = scene.chapter;
  document.getElementById('locationPill').textContent = scene.location;
  document.getElementById('sceneTag').textContent = scene.subject;
  document.getElementById('sceneTitle').textContent = scene.title;
  document.getElementById('sceneText').textContent = scene.text;
  document.getElementById('scenePrompt').textContent = scene.prompt;
  document.getElementById('sceneArt').textContent = scene.icon;
  document.getElementById('backdrop').style.background = scene.background;
  document.getElementById('resumeHint').textContent = scene.id === CFG.epilogueId ? (CFG.epilogueHint || 'Fin de chapitre') : (CFG.runningHint || 'Une erreur renvoie au départ');
  bindOptionalImage(document.getElementById('sceneBgImg'), scene.bg, scene.alt, null);
  bindOptionalImage(document.getElementById('sceneCardImg'), scene.card, scene.alt, null, { container:document.getElementById('sceneMedia'), captionEl:document.getElementById('sceneCaption'), captionText: scene.card ? `Illustration de scène : ${scene.title}` : '' });
  document.getElementById('progressLabel').textContent = `${Math.min(state.cleared.length, TOTAL_MAIN_SCENES)}/${TOTAL_MAIN_SCENES}`;
  document.getElementById('progressFill').style.width = `${progress}%`;
  document.getElementById('sceneNumber').textContent = String(sceneIdx);
  document.getElementById('subjectLabel').textContent = scene.subject;
  const choices = document.getElementById('choices');
  choices.innerHTML = '';
  scene.choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'choice';
    btn.innerHTML = `<div class="choice-badge">${choice.badge}</div><div class="choice-title">${choice.title}</div><div class="choice-sub">${choice.sub}</div>`;
    btn.addEventListener('click', () => choiceClicked(choice));
    choices.appendChild(btn);
  });
  updateAudioControls();
  playSceneAudio(true);
}

function applyStaticTexts(){
  document.title = CFG.pageTitle || document.title;
  document.getElementById('topPill').textContent = CFG.topPill || 'Voyage vers Valdurne';
  document.getElementById('sideTitle').innerHTML = CFG.sideTitle || 'Voyage';
  document.getElementById('sideIntro').textContent = CFG.sideIntro || '';
  document.getElementById('audioStatus').textContent = CFG.audioIntro || "La narration enregistrée est prête. Le navigateur tentera de la lancer automatiquement.";
  document.getElementById('progressCardTitle').textContent = CFG.progressCardTitle || 'Progression';
  document.getElementById('volumeCardTitle').textContent = CFG.volumeCardTitle || 'Volume de la narration';
  document.getElementById('ruleText').textContent = CFG.ruleText || '';
  document.getElementById('backToHub').setAttribute('href', CFG.hubFile || 'hub_liam_eystieval.html');
  document.getElementById('backToHubInline').setAttribute('href', CFG.hubFile || 'hub_liam_eystieval.html');
  document.getElementById('liamReferenceImg').alt = CFG.portraitAlt || 'Portrait de Liam';
  bindOptionalImage(document.getElementById('liamReferenceImg'), CFG.referencePortrait, CFG.portraitAlt || 'Portrait', document.getElementById('liamReferenceFallback'));
}

document.getElementById('audioToggleBtn').addEventListener('click', toggleAudio);
document.getElementById('replayBtn').addEventListener('click', () => playSceneAudio(false));
document.getElementById('stopAudioBtn').addEventListener('click', () => stopSceneAudio(true));
document.getElementById('restartBtn').addEventListener('click', restartStory);
document.getElementById('restartNowBtn').addEventListener('click', restartStory);
document.getElementById('closeRestartBtn').addEventListener('click', closeModal);
document.getElementById('restartModal').addEventListener('click', (ev) => { if (ev.target === ev.currentTarget) closeModal(); });
document.getElementById('audioVolume').addEventListener('input', (ev) => setAudioVolume(ev.target.value));
window.addEventListener('beforeunload', () => stopSceneAudio(false));

applyStaticTexts();
const params = new URLSearchParams(window.location.search);
if (params.get('restart') === '1') restartStory();
else {
  const state = getState();
  document.getElementById('audioVolume').value = String(Math.round(state.audioVolume * 100));
  renderScene();
}

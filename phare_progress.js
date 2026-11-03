/* Local certificates are a per-player projection of the hub's saved results.
 * Restoring this projection never awards XP or publishes completion events. */
(function () {
  'use strict';
  const OWNER = 'pvs_phare_cert_owner_v1';
  const CACHE = 'pvs_phare_certificates_v1';
  const ACTIVE = 'pvs_current_player';
  const BUSY = 'pvs_phare_projection_busy_v1';
  const MODULE = /^(GROUPE|HISTOIRE|JURIDIQUE|NEURO|NUMERIQUE|VEA)_(0[1-9]|10)$/;
  const EXTRA = /^CERT_(JDR|METACOG)_[A-Z0-9_]+$/;
  const DEFAULT_URL = 'https://zmeicqjkylxdaldiovxg.supabase.co';
  const DEFAULT_KEY = 'sb_publishable_fvY1_6Pu7lMTNNBeBvI7Dw_jXLjv4oH';
  let request = 0;
  function code(value) { return String(value || '').normalize('NFC').trim().toUpperCase(); }
  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback; }
    catch (_) { return fallback; }
  }
  function managed(key) {
    return (key.startsWith('CERT_PHARE_') && MODULE.test(key.slice(11)))
      || (key.startsWith('PIXHARE_INDEX_SYNC_') && MODULE.test(key.slice(19)))
      || /^CERT_(GRP|HIS|JUR|NUM|NEU|VEA)_\d+$/.test(key)
      || EXTRA.test(key) || key === 'CERT_PROTOCOLE_VALDURNE_01';
  }
  function snapshot() {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (managed(key)) out[key] = localStorage.getItem(key);
    }
    return out;
  }
  function remember(player) {
    if (!player) return;
    const cache = read(CACHE, {});
    cache[player] = snapshot();
    localStorage.setItem(CACHE, JSON.stringify(cache));
  }
  function activate(player, profile) {
    player = code(player);
    if (!player) return false;
    let changed = false;
    const token = String(Date.now()) + Math.random();
    try {
      const busy = read(BUSY, {});
      if (busy.until > Date.now()) return false;
      localStorage.setItem(BUSY, JSON.stringify({token,until:Date.now()+10000}));
      const owner = code(localStorage.getItem(OWNER));
      const previous = owner || code(localStorage.getItem(ACTIVE));
      if (owner !== player) {
        // Migrate legacy certificates to their previous active player before
        // changing the projection. Keep unattributed legacy data recoverable.
        remember(previous || '__unattributed__');
        const keys = Object.keys(snapshot());
        keys.forEach(key => localStorage.removeItem(key));
        const saved = read(CACHE, {})[player] || {};
        Object.keys(saved).filter(managed).forEach(key => localStorage.setItem(key, saved[key]));
        ['pvs_phare_pending', 'pvs_jdr_pending', 'pvs_metacog_pending'].forEach(key => localStorage.removeItem(key));
        localStorage.setItem(OWNER, player);
        changed = true;
      }
      localStorage.setItem(ACTIVE, player);
      localStorage.setItem('pvs_phare_player', player);
      if (profile && (!profile.code || code(profile.code) === player)) {
        const done = profile.pixhareDone || {};
        function restore(key, id, date) {
          if (!date) return;
          if (!localStorage.getItem(key)) {
            localStorage.setItem(key, JSON.stringify({v:1,m:id,d:typeof date === 'string' ? date : null,f:true,player,restored:true}));
            changed = true;
          }
          // The server has already credited this validation. Do not re-emit it.
          if (MODULE.test(id)) localStorage.setItem('PIXHARE_INDEX_SYNC_' + id, localStorage.getItem(key));
        }
        Object.keys(done).forEach(id => {
          if (MODULE.test(id)) restore('CERT_PHARE_' + id, id, done[id]);
          else if (EXTRA.test(id) || id === 'CERT_PROTOCOLE_VALDURNE_01') restore(id, id, done[id]);
        });
        ['jdrDone','metacogDone'].forEach(field => {
          Object.entries(profile[field] || {}).forEach(([id,date]) => {
            const key = id.startsWith('CERT_') ? id : 'CERT_' + id;
            if (EXTRA.test(key)) restore(key, key, date);
          });
        });
      }
      remember(player);
      localStorage.removeItem(BUSY);
      if (changed) window.dispatchEvent(new CustomEvent('pvs:phare-restored', {detail:{player}}));
      return changed;
    } catch (_) { return false; }
    finally {
      try { if (read(BUSY, {}).token === token) localStorage.removeItem(BUSY); } catch (_) {}
    }
  }
  function restoreLocal(player) {
    player = code(player || localStorage.getItem(ACTIVE));
    const state = read('pvs_hof_v2', {});
    return activate(player, (state.players || {})[player]);
  }
  async function pull(player) {
    player = code(player || localStorage.getItem(ACTIVE));
    if (!player || player === 'ADMIN' || player.startsWith('VISITEUR')) return false;
    const ticket = ++request;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const base = String(localStorage.getItem('pvs_supabase_url') || DEFAULT_URL).replace(/\/+$/, '');
      const key = localStorage.getItem('pvs_supabase_publishable_key') || DEFAULT_KEY;
      const url = new URL(base + '/rest/v1/pvs_sync');
      url.searchParams.set('select','player_id,full_state');
      url.searchParams.set('player_id','eq.' + player);
      const response = await fetch(url, {headers:{apikey:key},signal:controller.signal});
      if (!response.ok) return false;
      const rows = await response.json();
      if (ticket !== request || code(localStorage.getItem(ACTIVE)) !== player) return false;
      const row = Array.isArray(rows) && rows.find(row => code(row.player_id) === player);
      if (!row || !row.full_state) return false;
      activate(player, row.full_state);
      return true;
    } catch (_) { return false; }
    finally { clearTimeout(timer); }
  }
  function ready(player) {
    return !player || (code(localStorage.getItem(OWNER)) === code(player) && !(read(BUSY, {}).until > Date.now()));
  }
  window.PVSPhareProgress = {activate, restoreLocal, pull, ready};
  // Runs before module prerequisites and before page-specific player setup.
  try {
    const player = new URLSearchParams(location.search).get('player') || localStorage.getItem(ACTIVE);
    if (player) restoreLocal(player);
  } catch (_) {}
  window.addEventListener('pagehide', () => {
    try { if (!(read(BUSY, {}).until > Date.now())) remember(code(localStorage.getItem(OWNER))); } catch (_) {}
  });
}());

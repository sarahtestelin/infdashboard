'use strict';
/* Miahso_ Dashboard — extras : synchro Supabase, YouTube, import CSV, réglages */
const APP_VERSION = '8';
const SESS = 'miahso-session', CFGK = 'miahso-cfg', YTLAST = 'miahso-yt-last', SYNCED = 'miahso-synced';
const lsGet = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
const lsSet = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } };
const CFG = () => {
  const l = lsGet(CFGK) || {}, g = window.MIAHSO_CONFIG || {};
  return { SUPABASE_URL: l.SUPABASE_URL || g.SUPABASE_URL || '', SUPABASE_ANON_KEY: l.SUPABASE_ANON_KEY || g.SUPABASE_ANON_KEY || '' };
};
const isYT = a => /^yt/.test(a.id) || /youtube/i.test(a.name);
const val = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };

/* =====================  SYNCHRO SUPABASE  ===================== */
const Sync = { busy: false, error: '', last: null, timer: null, dirty: false };

async function sb(path, opt) {
  const o = opt || {}, c = CFG();
  const headers = Object.assign({ apikey: c.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' }, o.token ? { Authorization: 'Bearer ' + o.token } : {}, o.headers || {});
  const r = await fetch(c.SUPABASE_URL.replace(/\/+$/, '') + path, { method: o.method || 'GET', headers, body: o.body ? JSON.stringify(o.body) : undefined });
  const txt = await r.text();
  let j = null;
  try { j = txt ? JSON.parse(txt) : null; } catch (e) { /* ignore */ }
  if (!r.ok) {
    let m = (j && (j.msg || j.message || j.error_description || j.error)) || ('Erreur ' + r.status);
    if (/invalid login/i.test(m)) m = 'E-mail ou mot de passe incorrect.';
    if (/already registered/i.test(m)) m = 'Cet e-mail a déjà un compte : connecte-toi.';
    if (/relation .* does not exist|dashboards/i.test(m) && r.status === 404) m = 'Table « dashboards » introuvable : exécute supabase.sql (voir SETUP.md).';
    const err = new Error(m); err.status = r.status; throw err;
  }
  return j;
}
const sessionOk = () => !!(CFG().SUPABASE_URL && CFG().SUPABASE_ANON_KEY && lsGet(SESS));
function storeSession(r) {
  const s = { access_token: r.access_token, refresh_token: r.refresh_token, expires_at: r.expires_at || (Math.floor(Date.now() / 1000) + (r.expires_in || 3600)), user: { id: r.user.id, email: r.user.email } };
  lsSet(SESS, s);
  return s;
}
async function token() {
  let s = lsGet(SESS);
  if (!s) throw new Error('Non connectée');
  if (s.expires_at - Date.now() / 1000 < 90) {
    try { s = storeSession(await sb('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: s.refresh_token } })); }
    catch (e) { if (e.status === 400 || e.status === 401) lsSet(SESS, null); throw e; }
  }
  return s.access_token;
}
const signIn = async (email, password) => storeSession(await sb('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } }));
async function signUp(email, password) {
  const r = await sb('/auth/v1/signup', { method: 'POST', body: { email, password } });
  if (r && r.access_token) { storeSession(r); return true; }
  return false;
}

async function syncNow(manual) {
  if (Sync.busy || !sessionOk()) return;
  Sync.busy = true; Sync.error = ''; Sync.dirty = false; updateSyncUI();
  try {
    const tk = await token(), userId = lsGet(SESS).user.id;
    const rows = await sb('/rest/v1/dashboards?select=data,updated_at&limit=1', { token: tk });
    const remote = rows && rows[0];
    const lt = state.updatedAt ? Date.parse(state.updatedAt) : 0, rt = remote ? Date.parse(remote.updated_at) : 0;
    const localHasData = !!(state.items.length || state.trends.length || state.creators.length || state.inspirations.length || lt);
    let pull = false, push = false;
    if (!remote) push = true;
    else if (!lsGet(SYNCED)) {
      if (localHasData) { pull = confirm('Des données existent déjà dans le cloud.\n\nOK = utiliser celles du cloud (remplace cet appareil)\nAnnuler = garder celles de cet appareil (remplace le cloud)'); push = !pull; }
      else pull = true;
    } else if (rt > lt) pull = true;
    else if (lt > rt) push = true;
    if (pull) { state = migrate(remote.data); state.updatedAt = remote.updated_at; save(false); }
    if (push) {
      if (!state.updatedAt) state.updatedAt = new Date().toISOString();
      save(false);
      await sb('/rest/v1/dashboards?on_conflict=user_id', { method: 'POST', token: tk, headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: { user_id: userId, data: state, updated_at: state.updatedAt } });
    }
    lsSet(SYNCED, true); Sync.last = new Date();
    if (pull) { if (!acc(platTab)) platTab = state.accounts[0].id; render(); }
  } catch (e) {
    Sync.error = e.message || 'Erreur de synchro';
    if (manual) toast('Synchro : ' + Sync.error);
  }
  Sync.busy = false; updateSyncUI();
  if (Sync.dirty) afterSave();
}
function afterSave() {
  if (!sessionOk()) return;
  Sync.dirty = true;
  if (Sync.busy) return;
  clearTimeout(Sync.timer);
  Sync.timer = setTimeout(() => syncNow(), 1500);
}
function syncStatusHtml() {
  const c = CFG(), s = lsGet(SESS);
  let cls = 'off', txt = 'Synchro non configurée';
  if (c.SUPABASE_URL && !s) txt = 'Non connectée';
  else if (s) {
    if (Sync.busy) { cls = 'busy'; txt = 'Synchronisation…'; }
    else if (Sync.error) { cls = 'err'; txt = 'Erreur de synchro'; }
    else if (Sync.last) { cls = 'ok'; txt = 'Synchronisé à ' + Sync.last.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); }
    else { cls = 'busy'; txt = 'En attente'; }
  }
  return `<button class="sync ${cls}" data-action="nav" data-id="settings" title="${esc(txt)}"><span class="sdot"></span><span class="lbl">${esc(txt)}</span></button>`;
}
function updateSyncUI() {
  const el = document.querySelector('#side .sync');
  if (el) el.outerHTML = syncStatusHtml();
}

/* =====================  YOUTUBE  ===================== */
const YT = { busy: false, msg: '' };
function parseYtRef(h) {
  h = (h || '').trim();
  let m = h.match(/youtube\.com\/channel\/(UC[\w-]{20,})/i); if (m) return { id: m[1] };
  m = h.match(/youtube\.com\/(@[\w.\-%]+)/i); if (m) return { handle: m[1] };
  if (/^UC[\w-]{20,}$/.test(h)) return { id: h };
  if (h) return { handle: h.startsWith('@') ? h : '@' + h };
  return null;
}
async function ytFetch(path, params) {
  const u = new URL('https://www.googleapis.com/youtube/v3/' + path);
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
  u.searchParams.set('key', (state.settings || {}).ytKey || '');
  const r = await fetch(u.toString());
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    let m = (j.error && j.error.message) || ('Erreur ' + r.status);
    if (/quota/i.test(m)) m = 'Quota YouTube dépassé pour aujourd\'hui, réessaie demain.';
    if (/API key not valid|API_KEY_INVALID/i.test(m)) m = 'Clé API YouTube invalide.';
    throw new Error(m);
  }
  return j;
}
async function ytSyncAccount(a) {
  const ref = parseYtRef(a.ytHandle);
  if (!ref) return null;
  const ch = await ytFetch('channels', Object.assign({ part: 'statistics,contentDetails' }, ref.id ? { id: ref.id } : { forHandle: ref.handle }));
  const c = ch.items && ch.items[0];
  if (!c) throw new Error('chaîne introuvable (' + (ref.id || ref.handle) + ')');
  let subs = null;
  if (!c.statistics.hiddenSubscriberCount) {
    subs = Number(c.statistics.subscriberCount);
    if (subs !== a.followers || !state.history.some(h => h.accountId === a.id && h.date === today())) {
      state.history = state.history.filter(h => !(h.accountId === a.id && h.date === today()));
      state.history.push({ date: today(), accountId: a.id, followers: subs });
    }
    a.followers = subs;
  }
  const pl = await ytFetch('playlistItems', { part: 'contentDetails', playlistId: c.contentDetails.relatedPlaylists.uploads, maxResults: 30 });
  const ids = (pl.items || []).map(x => x.contentDetails.videoId);
  let n = 0;
  if (ids.length) {
    const vids = await ytFetch('videos', { part: 'snippet,statistics', id: ids.join(',') });
    (vids.items || []).forEach(v => {
      const st = v.statistics || {}, id = 'yt-' + v.id;
      let it = state.items.find(x => x.id === id);
      if (!it) {
        it = { id, title: v.snippet.title, category: 'Autre', accountId: a.id, status: 'publié', date: iso(new Date(v.snippet.publishedAt)), note: '', moved: today(), source: 'youtube' };
        state.items.push(it);
      }
      it.views = Number(st.viewCount) || 0; it.likes = Number(st.likeCount) || 0; it.comments = Number(st.commentCount) || 0;
      n++;
    });
  }
  return `${a.name} : ${subs == null ? 'abonnés masqués' : fmt(subs) + ' abonnés'}, ${n} vidéo${n > 1 ? 's' : ''} à jour`;
}
async function ytSyncAll(manual) {
  if (YT.busy) return;
  if (!(state.settings || {}).ytKey) { if (manual) toast('Ajoute d\'abord ta clé API YouTube.'); return; }
  const list = state.accounts.filter(a => isYT(a) && parseYtRef(a.ytHandle));
  if (!list.length) { if (manual) toast('Ajoute le @nom de ta chaîne YouTube.'); return; }
  YT.busy = true; YT.msg = 'Synchronisation en cours…'; if (page === 'settings') render();
  const out = [];
  for (const a of list) {
    try { const m = await ytSyncAccount(a); if (m) out.push(m); }
    catch (e) { out.push(a.name + ' : ' + e.message); }
  }
  YT.busy = false; YT.msg = out.join('\n');
  lsSet(YTLAST, Date.now());
  save(); render();
  if (manual) toast('YouTube synchronisé');
}
function ytAuto() {
  const last = lsGet(YTLAST) || 0;
  if ((state.settings || {}).ytKey && Date.now() - last > 6 * 3600e3) return ytSyncAll(false);
}

/* =====================  IMPORT CSV  ===================== */
function parseCSV(text) {
  text = text.replace(/^﻿/, '');
  const first = text.split(/\r?\n/, 1)[0];
  const delim = [',', ';', '\t'].map(d => [d, first.split(d).length]).sort((a, b) => b[1] - a[1])[0][0];
  const rows = []; let row = [], cur = '', q = false;
  const endRow = () => { row.push(cur); cur = ''; if (row.some(c => c.trim() !== '')) rows.push(row); row = []; };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true;
    else if (ch === delim) { row.push(cur); cur = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; endRow(); }
    else cur += ch;
  }
  if (cur !== '' || row.length) endRow();
  return rows;
}
function parseNum(s) {
  s = String(s == null ? '' : s).trim().replace(/[\s ]/g, '');
  if (!s) return 0;
  let mult = 1;
  const m = s.match(/([kKmM])$/);
  if (m) { mult = /k/i.test(m[1]) ? 1e3 : 1e6; s = s.slice(0, -1); }
  if (/^\d{1,3}([.,]\d{3})+$/.test(s)) s = s.replace(/[.,]/g, '');
  else s = s.replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : Math.round(n * mult);
}
const MOIS = [['janv', 1], ['jan', 1], ['fevr', 2], ['fev', 2], ['feb', 2], ['mars', 3], ['mar', 3], ['avr', 4], ['apr', 4], ['mai', 5], ['may', 5], ['juin', 6], ['jun', 6], ['juil', 7], ['jul', 7], ['aout', 8], ['aug', 8], ['sept', 9], ['sep', 9], ['oct', 10], ['nov', 11], ['dec', 12]];
const moisNum = w => { w = String(w).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f.]/g, ''); const f = MOIS.find(x => w.startsWith(x[0])); return f ? f[1] : 0; };
const ymd = (y, mo, d) => (mo < 1 || mo > 12 || d < 1 || d > 31) ? '' : `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
/* Ordre des dates 12/05/2026 : « dmy » (France) ou « mdy » (export Instagram en anglais), deviné d'après les valeurs. */
function detectOrder(values) {
  let dmy = 0, mdy = 0;
  values.forEach(v => { const m = String(v || '').trim().match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-]\d{2,4}/); if (m) { if (+m[1] > 12) dmy++; if (+m[2] > 12) mdy++; } });
  return mdy > dmy ? 'mdy' : 'dmy';
}
function parseDate(s, order) {
  s = String(s || '').trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return ymd(m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/);
  if (m) {
    let d = +m[1], mo = +m[2], y = +m[3];
    if (order === 'mdy') { const t = d; d = mo; mo = t; }
    if (y < 100) y += 2000;
    if (mo > 12 && d <= 12) { const t = d; d = mo; mo = t; }
    return ymd(y, mo, d);
  }
  /* « 23 novembre », « 23 novembre 2026 », « nov. 23, 2026 » (sans année : l'année en cours, ou la précédente si la date serait dans le futur) */
  m = s.match(/^(\d{1,2})(?:er)?\s+([A-Za-zÀ-ÿ.]{3,})\s*,?\s*(\d{4})?/);
  let d2, mo2, y2;
  if (m) { d2 = +m[1]; mo2 = moisNum(m[2]); y2 = m[3] ? +m[3] : 0; }
  else { m = s.match(/^([A-Za-zÀ-ÿ.]{3,})\s+(\d{1,2})\s*,?\s*(\d{4})?/); if (m) { mo2 = moisNum(m[1]); d2 = +m[2]; y2 = m[3] ? +m[3] : 0; } }
  if (m && mo2) {
    if (!y2) { const now = new Date(); y2 = now.getFullYear(); if (new Date(y2, mo2 - 1, d2) > new Date(now.getTime() + 864e5)) y2--; }
    return ymd(y2, mo2, d2);
  }
  const t = Date.parse(s);
  return isNaN(t) ? '' : iso(new Date(t));
}
const hash = str => { let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
function guessColumns(head, data) {
  data = data || [];
  const used = new Set(), find = (re, not) => { const i = head.findIndex((h, k) => !used.has(k) && re.test(h) && !(not && not.test(h))); if (i >= 0) used.add(i); return i; };
  const g = {};
  const sample = i => data.slice(0, 40).map(r => String(r[i] == null ? '' : r[i]).trim()).filter(Boolean);
  const dateLike = v => /\d{1,4}[\/.\-]\d{1,2}[\/.\-]\d{1,4}/.test(v) || /^\d{1,2}(er)?\s+[A-Za-zÀ-ÿ.]{3,}/.test(v) || /^[A-Za-zÀ-ÿ.]{3,}\s+\d{1,2}/.test(v);
  const order = i => detectOrder(sample(i));
  const dateScore = i => { const s = sample(i); return s.length ? s.filter(v => dateLike(v) && parseDate(v, order(i))).length / s.length : 0; };
  const prio = i => /heure de publi|date de publi|published|posted|post time|^time$/i.test(head[i]) ? 0 : /date|heure|time|publi/i.test(head[i]) ? 1 : 2;
  const cands = head.map((h, i) => i).filter(i => dateScore(i) >= 0.6).sort((a, b) => prio(a) - prio(b) || a - b);
  g.date = cands.length ? cands[0] : -1;
  if (g.date >= 0) used.add(g.date); else g.date = find(/^date$|heure|posted|time/i, /identifiant|\bid\b/i);
  g.views = find(/^(vues|views|video views|total views|lectures|plays)$/i);
  if (g.views < 0) g.views = find(/vues|views|lectures|plays|impressions|reach|port[ée]e/i, /moyen|average|avg|dur[ée]e|duration|watch|temps|%/i);
  g.likes = find(/j.?aime|likes|r[ée]actions/i);
  g.comments = find(/^commentaires?$|^comments?$|total comments/i);
  if (g.comments < 0) g.comments = find(/comment/i, /donn[ée]es|data/i);
  g.title = find(/^description$|titre|title|caption|l[ée]gende|texte/i);
  if (g.title < 0) g.title = find(/vid[ée]o|post/i, /identifiant|\bid\b|permalien|url|lien|type|dur[ée]e/i);
  return g;
}
function startCsv(file) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const rows = parseCSV(String(r.result));
      if (rows.length < 2) throw new Error('vide');
      const head = rows[0].map(h => h.trim()), data = rows.slice(1), g = guessColumns(head, data);
      const opts = [['-1', '— aucune —']].concat(head.map((h, i) => [String(i), h || 'Colonne ' + (i + 1)]));
      const guess = k => String(g[k]);
      const cell = (x, k) => (g[k] >= 0 ? String(x[g[k]] || '').replace(/\s+/g, ' ').trim() : '');
      const preview = data.slice(0, 4).map(x => [cell(x, 'date'), cell(x, 'title').slice(0, 45), cell(x, 'views') + ' vues'].join(' | ')).join('\n');
      const profCol = head.findIndex(h => /nom de profil|nom d.utilisateur|username|profile name/i.test(h));
      let mainProfile = '';
      if (profCol >= 0) { const cnt = {}; data.forEach(x => { const v = (x[profCol] || '').trim(); if (v) cnt[v] = (cnt[v] || 0) + 1; }); mainProfile = Object.keys(cnt).sort((p, q) => cnt[q] - cnt[p])[0] || ''; }
      const accs = state.accounts.map(a => [a.id, a.name]);
      const txt = data.slice(0, 5).map(x => x.join(' ')).join(' ') + ' ' + head.join(' ') + ' ' + file.name;
      const kind = /instagram\.com|reel ig|carrousel ig|instagram/i.test(txt) ? /insta/i : /tiktok\.com|tiktok/i.test(txt) ? /tiktok/i : /youtube|youtu\.be/i.test(txt) ? /youtube/i : null;
      const defAcc = ((kind && state.accounts.find(a => kind.test(a.name))) || state.accounts[0]).id;
      form(`Importer ${data.length} lignes`, [
        { name: 'acc', label: 'Compte concerné', type: 'select', options: accs },
        { name: 'title', label: 'Colonne du titre / description', type: 'select', options: opts },
        { name: 'date', label: 'Colonne de la date de publication', type: 'select', options: opts },
        { name: 'views', label: 'Colonne des vues', type: 'select', options: opts },
        { name: 'likes', label: 'Colonne des likes', type: 'select', options: opts },
        { name: 'comments', label: 'Colonne des commentaires', type: 'select', options: opts },
        { name: 'preview', label: 'Aperçu des premières lignes (lecture seule)', type: 'textarea' }
      ], { acc: defAcc, title: guess('title'), date: guess('date'), views: guess('views'), likes: guess('likes'), comments: guess('comments'), preview }, out => {
        const col = k => Number(out[k]);
        let added = 0, updated = 0, skipped = 0, others = 0;
        const order = col('date') >= 0 ? detectOrder(data.map(x => x[col('date')])) : 'dmy';
        data.forEach(row => {
          if (mainProfile && (row[profCol] || '').trim() !== mainProfile) { others++; return; }
          const date = col('date') >= 0 ? parseDate(row[col('date')], order) : '';
          if (!date) { skipped++; return; }
          const title = (col('title') >= 0 && (row[col('title')] || '').replace(/\s+/g, ' ').trim()) || 'Sans titre';
          const id = 'csv-' + hash(out.acc + '|' + date + '|' + title.slice(0, 80));
          const stats = { views: col('views') >= 0 ? parseNum(row[col('views')]) : '', likes: col('likes') >= 0 ? parseNum(row[col('likes')]) : '', comments: col('comments') >= 0 ? parseNum(row[col('comments')]) : '' };
          const it = state.items.find(x => x.id === id);
          if (it) { Object.assign(it, stats); updated++; }
          else { state.items.push(Object.assign({ id, title: title.slice(0, 140), category: 'Autre', accountId: out.acc, status: 'publié', date, note: '', moved: today(), source: 'csv' }, stats)); added++; }
        });
        setTimeout(() => toast(`Import : ${added} nouveau${added > 1 ? 'x' : ''}, ${updated} mis à jour, ${skipped} ignoré${skipped > 1 ? 's' : ''}${others ? ` (+ ${others} d'un autre compte)` : ''}`), 50);
      });
    } catch (e) { toast('Fichier CSV illisible.'); }
  };
  r.readAsText(file);
}

/* =====================  PAGE RÉGLAGES  ===================== */
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; if (page === 'settings') render(); });

function settings() {
  const c = CFG(), s = lsGet(SESS), st = state.settings || {};
  let syncBody;
  if (!c.SUPABASE_URL || !c.SUPABASE_ANON_KEY) {
    syncBody = `<p class="muted">Pour retrouver les mêmes données sur ton téléphone, ta tablette et ton ordinateur, crée un projet Supabase gratuit (guide <b>SETUP.md</b>, 5 minutes) puis colle ici ses deux informations :</p>
      <label>URL du projet<input id="cfg-url" type="url" placeholder="https://xxxx.supabase.co" value="${esc(c.SUPABASE_URL)}"></label>
      <label>Clé « anon » (publique)<input id="cfg-key" type="text" placeholder="eyJ… ou sb_publishable_…" value="${esc(c.SUPABASE_ANON_KEY)}"></label>
      <div class="actions" style="justify-content:flex-start"><button class="btn" data-action="cfg-save">Enregistrer</button></div>`;
  } else if (!s) {
    syncBody = `<p class="muted">Connecte-toi avec le même e-mail sur chaque appareil. Première fois ? Clique sur « Créer le compte ».</p>
      <label>E-mail<input id="au-mail" type="email" autocomplete="username"></label>
      <label>Mot de passe (6 caractères minimum)<input id="au-pw" type="password" autocomplete="current-password"></label>
      <div class="actions" style="justify-content:flex-start"><button class="btn" data-action="au-in">Se connecter</button><button class="btn ghost" data-action="au-up">Créer le compte</button><button class="btn ghost sm" data-action="cfg-reset">Changer de projet</button></div>`;
  } else {
    syncBody = `<p>Connectée en tant que <b>${esc(s.user.email)}</b>.<br><small class="muted">${Sync.error ? 'Erreur : ' + esc(Sync.error) : Sync.last ? 'Dernière synchro à ' + Sync.last.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'Pas encore synchronisée sur cet appareil.'} Tes changements partent automatiquement dans le cloud.</small></p>
      <div class="actions" style="justify-content:flex-start"><button class="btn" data-action="sync-now">Synchroniser maintenant</button><button class="btn ghost" data-action="au-out">Se déconnecter</button></div>`;
  }
  const ytAccs = state.accounts.filter(isYT).map(a => `<label>${accDot(a.id)} ${esc(a.name)} : @nom ou lien de la chaîne<input id="yt-h-${esc(a.id)}" type="text" placeholder="@mon_pseudo" value="${esc(a.ytHandle || '')}"></label>`).join('');
  const ytBody = `<p class="muted">Récupère automatiquement tes abonnés et les stats de tes 30 dernières vidéos. Il faut une clé API Google gratuite (voir <b>SETUP.md</b>).</p>
    <label>Clé API YouTube Data v3<input id="yt-key" type="text" placeholder="AIza…" value="${esc(st.ytKey || '')}"></label>${ytAccs}
    <div class="actions" style="justify-content:flex-start"><button class="btn" data-action="yt-save">Enregistrer</button><button class="btn ghost" data-action="yt-sync">${YT.busy ? 'En cours…' : 'Synchroniser maintenant'}</button></div>
    ${YT.msg ? `<pre class="log">${esc(YT.msg)}</pre>` : ''}`;
  const csvBody = `<p class="muted">TikTok et Instagram ne se connectent pas à l'app : exporte tes statistiques en CSV (TikTok Studio > Analytics > Contenu > Télécharger les données ; Meta Business Suite > Insights > Contenu > Exporter les données), puis importe le fichier ici. Les colonnes sont reconnues automatiquement et tu peux les corriger avant de valider. Réimporter le même fichier met à jour les chiffres sans doublon.</p>
    <div class="actions" style="justify-content:flex-start"><button class="btn" data-action="csv-pick">${icon('up')} Choisir un fichier CSV</button><button class="btn ghost sm" data-action="csv-clear">Effacer les imports CSV</button></div>
    <p class="muted"><small>Pense à bien choisir le compte (TikTok, Instagram…) dans la fenêtre d'import. « Effacer les imports CSV » supprime seulement les posts venus d'un CSV, pour pouvoir les réimporter proprement.</small></p>`;
  const installBody = `${deferredPrompt ? `<div class="actions" style="justify-content:flex-start;margin:0 0 10px"><button class="btn" data-action="install-app">Installer l'app</button></div>` : ''}
    <div class="inst"><div><b>iPhone / iPad</b><p>Ouvre le lien dans <b>Safari</b> > Partager > « Sur l'écran d'accueil ».</p></div>
    <div><b>Android</b><p>Chrome > menu ⋮ > « Installer l'application ».</p></div>
    <div><b>Ordinateur</b><p>Chrome ou Edge > icône d'installation dans la barre d'adresse.</p></div></div>`;
  const card = (t, body) => `<section class="card"><h3>${t}</h3>${body}</section>`;
  return head('Réglages', 'Synchro entre appareils, YouTube automatique, import de tes stats et installation.', '') +
    card('Synchronisation entre appareils', syncBody) + card('YouTube automatique', ytBody) + card('Importer des stats TikTok / Instagram (CSV)', csvBody) +
    card('Installer l\'application', installBody) +
    card('Mise à jour de l\'app', `<p class="muted">Version ${APP_VERSION}. Si une nouveauté n'apparaît pas, recharge la dernière version : tes données ne sont pas touchées.</p><div class="actions" style="justify-content:flex-start"><button class="btn ghost" data-action="app-update">Recharger la dernière version</button></div>`) +
    card('Sauvegarde', `<p class="muted">Une copie de tes données au format JSON, à garder en lieu sûr.</p><div class="actions" style="justify-content:flex-start"><button class="btn ghost" data-action="export">Exporter</button><button class="btn ghost" data-action="import">Importer</button></div>`) +
    `<p class="muted" style="text-align:center">Miahso_ Dashboard · version ${APP_VERSION}</p>`;
}

function extraAction(a, el) {
  switch (a) {
    case 'cfg-save': {
      const u = val('cfg-url'), k = val('cfg-key');
      if (!/^https:\/\//i.test(u) || !k) return toast('Renseigne l\'URL (https://…) et la clé.');
      lsSet(CFGK, { SUPABASE_URL: u, SUPABASE_ANON_KEY: k }); toast('Enregistré. Connecte-toi maintenant.'); render(); break;
    }
    case 'cfg-reset': lsSet(CFGK, null); render(); break;
    case 'au-in': case 'au-up': {
      const email = val('au-mail'), pw = document.getElementById('au-pw').value;
      if (!email || !pw) return toast('Renseigne l\'e-mail et le mot de passe.');
      (async () => {
        try {
          lsSet(SYNCED, null);
          if (a === 'au-in') await signIn(email, pw);
          else if (!(await signUp(email, pw))) { toast('Compte créé. Confirme ton e-mail puis connecte-toi.'); return; }
          toast('Connectée'); render(); await syncNow(true); render();
        } catch (e) { toast(e.message); }
      })();
      break;
    }
    case 'au-out': lsSet(SESS, null); lsSet(SYNCED, null); Sync.last = null; Sync.error = ''; render(); toast('Déconnectée. Tes données restent sur cet appareil.'); break;
    case 'sync-now': syncNow(true).then(() => { if (page === 'settings') render(); }); break;
    case 'yt-save': {
      state.settings = Object.assign({}, state.settings, { ytKey: val('yt-key') });
      state.accounts.filter(isYT).forEach(x => { x.ytHandle = val('yt-h-' + x.id); });
      save(); toast('YouTube enregistré'); break;
    }
    case 'yt-sync': {
      state.settings = Object.assign({}, state.settings, { ytKey: val('yt-key') || (state.settings || {}).ytKey || '' });
      state.accounts.filter(isYT).forEach(x => { const v = val('yt-h-' + x.id); if (v) x.ytHandle = v; });
      save(); ytSyncAll(true); break;
    }
    case 'csv-pick': document.getElementById('csvFile').click(); break;
    case 'csv-clear': {
      const n = state.items.filter(i => i.source === 'csv').length;
      if (!n) { toast('Aucun import CSV à effacer.'); break; }
      if (!confirm(`Supprimer les ${n} posts importés depuis un CSV ? Tes autres posts (YouTube, ajoutés à la main) restent.`)) break;
      state.items = state.items.filter(i => i.source !== 'csv'); save(); render(); toast(`${n} posts effacés. Tu peux réimporter tes CSV.`); break;
    }
    case 'app-update':
      (async () => {
        try { (await navigator.serviceWorker.getRegistrations()).forEach(r => r.unregister()); (await caches.keys()).forEach(k => caches.delete(k)); } catch (e) { /* ignore */ }
        location.reload();
      })();
      break;
    case 'install-app':
      if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt.userChoice.finally(() => { deferredPrompt = null; render(); }); }
      break;
  }
}

/* =====================  DÉMARRAGE  ===================== */
ICONS.gear = '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>';
NAV.push(['Compte', [['settings', 'Réglages & synchro', 'Réglages', 'gear']]]);
PAGES.settings = settings;
document.getElementById('csvFile').addEventListener('change', e => { const f = e.target.files[0]; if (f) startCsv(f); e.target.value = ''; });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncNow(); });
window.addEventListener('online', () => syncNow());
/* Revenir sur la dernière page ouverte après un rechargement */
try { const p = localStorage.getItem('miahso-page'); if (p && PAGES[p]) page = p; } catch (e) { /* ignore */ }
render();
(async () => { await syncNow(); await ytAuto(); })();

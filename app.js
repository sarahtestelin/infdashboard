'use strict';
/* Miahso_ Dashboard — V2 design (données stockées sur l'appareil, sans serveur) */
const KEY = 'miahso-dashboard-v1';
let CATS = ['ASMR', 'Lifestyle', 'Pop culture', 'Skincare / Maquillage', 'Humour', 'Autre'];
const STATUS = ['idée', 'écriture', 'à tourner', 'montage', 'planifié', 'publié'];
const DAY_ABBR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const DAY_LONG = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const TREND_PLATFORMS = ['TikTok', 'Instagram', 'YouTube', 'Autre'];

/* ---------- utilitaires ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Number(n || 0).toLocaleString('fr-FR');
const uid = () => Math.random().toString(36).slice(2, 9);
const iso = d => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); };
const today = () => iso(new Date());
const at = s => new Date(s + 'T12:00:00');
const addDays = (s, n) => { const d = at(s); d.setDate(d.getDate() + n); return iso(d); };
const mondayOf = s => { const d = at(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d); };
const daysBetween = (a, b) => Math.round((at(b) - at(a)) / 864e5);
const dateFR = s => at(s).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
const rel = s => {
  if (!s) return 'Sans date';
  const d = daysBetween(today(), s);
  if (d === 0) return "Aujourd'hui";
  if (d === 1) return 'Demain';
  if (d === -1) return 'Hier';
  if (d > 1 && d <= 14) return 'Dans ' + d + ' j';
  if (d < -1 && d >= -14) return 'Il y a ' + (-d) + ' j';
  return dateFR(s);
};

const ICONS = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  layers: '<path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="m3 13 9 5 9-5"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3Z"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  flame: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9Z"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  heart: '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11Z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6"/><path d="M16 5a3.5 3.5 0 0 1 0 7M18 14c2.5.6 4 2.5 4 6"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  down: '<path d="M12 4v12m0 0-5-5m5 5 5-5M5 20h14"/>',
  up: '<path d="M12 20V8m0 0-5 5m5-5 5 5M5 4h14"/>',
  chevL: '<path d="m15 6-6 6 6 6"/>',
  chevR: '<path d="m9 6 6 6-6 6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="m3.5 6 1 1 2-2M3.5 12l1 1 2-2M3.5 18l1 1 2-2"/>'
};
const icon = n => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[n] || ''}</svg>`;

/* ---------- données ---------- */
const defaults = () => ({
  v: 2,
  accounts: [
    { id: 'tiktok', name: 'TikTok', followers: 8500, goal: 10000, weekly: 2, color: '#26302a' },
    { id: 'instagram', name: 'Instagram', followers: 230, goal: 10000, weekly: 2, color: '#c9748a' },
    { id: 'yt1', name: 'YouTube · chaîne 1', followers: 800, goal: 10000, weekly: 1, color: '#c0a24a' },
    { id: 'yt2', name: 'YouTube · chaîne 2', followers: 45, goal: 10000, weekly: 1, color: '#8a9a5b' }
  ],
  items: [],
  trends: [],
  history: [],
  creators: [],
  inspirations: [],
  lastReview: '',
  hideStart: false,
  settings: {},
  updatedAt: ''
});

function migrate(s) {
  const o = Object.assign(defaults(), s || {});
  const base = defaults().accounts;
  o.accounts = (o.accounts || []).map(a => Object.assign({ color: (base.find(b => b.id === a.id) || {}).color || '#7d8577' }, a));
  if (!Array.isArray(o.items)) o.items = [];
  if (!Array.isArray(o.trends)) o.trends = [];
  if (!Array.isArray(o.history)) o.history = [];
  if (!o.settings || typeof o.settings !== 'object') o.settings = {};
  if (!Array.isArray(o.creators)) o.creators = [];
  if (!Array.isArray(o.inspirations)) o.inspirations = [];
  o.trends.forEach(t => { if (!t.status) t.status = 'à tester'; if (t.changed == null) t.changed = ''; });
  if (Array.isArray(s && s.posts) || Array.isArray(s && s.ideas)) {
    const map = { 'tournage': 'à tourner', 'montage': 'montage', 'idée': 'idée', 'publié': 'publié' };
    (s.ideas || []).forEach(i => o.items.push({ id: i.id, title: i.text, category: i.category, accountId: i.accountId || '', status: map[i.status] || 'idée', date: '', views: '', likes: '', comments: '' }));
    (s.posts || []).forEach(p => o.items.push({ id: p.id, title: p.title, category: p.category, accountId: p.accountId, status: p.status === 'published' ? 'publié' : 'planifié', date: p.date, views: p.views, likes: p.likes, comments: p.comments }));
  }
  delete o.posts; delete o.ideas;
  o.v = 2;
  o.accounts.forEach(a => {
    if (!o.history.some(h => h.accountId === a.id)) o.history.push({ date: today(), accountId: a.id, followers: a.followers });
  });
  return o;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch (e) { /* stockage indisponible */ }
  return migrate(defaults());
}
function save(touch) {
  if (touch !== false) state.updatedAt = new Date().toISOString();
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  if (touch !== false && typeof afterSave === 'function') afterSave();
}

let state = load();
const SAVED_PAGE = (() => { try { return localStorage.getItem('miahso-page'); } catch (e) { return null; } })();
let page = 'overview';
let period = 30;
let platTab = state.accounts[0].id;
let ovTab = 'all';
let calView = 'month';
let monthOff = 0;
let sideOpen = false;
let sideCollapsed = false;
try { sideCollapsed = localStorage.getItem('miahso-side') === '1'; } catch (e) { /* ignore */ }
const isMobile = () => window.matchMedia('(max-width:900px)').matches;
let trendFilter = 'all';
let fabOpen = false;
const safeUrl = u => /^https?:\/\//i.test(u || '') ? u : '';
const reviewDue = () => !state.lastReview || daysBetween(state.lastReview, today()) >= 7;
const badgeFor = (id, n) => id === 'bank' && n ? `<span class="badge">${n}</span>` : id === 'review' && reviewDue() ? '<span class="badge warn">!</span>' : '';
function toast(msg) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove('show'), 2800);
}

/* Shorts / vidéos longues : une chaîne YouTube se découpe en deux « comptes virtuels » (id = chaîne:short ou chaîne:long) */
const FMT_LABEL = { short: 'Shorts', long: 'Vidéos longues' };
const splitOn = a => typeof isYT === 'function' && isYT(a);
const itemFmt = i => i.fmt === 'short' ? 'short' : 'long';
function virt(a, f) {
  const w = f === 'short' ? (a.weekly_short != null ? a.weekly_short : a.weekly) : a.weekly_long;
  const v = f === 'short' ? (a.viewsGoal_short != null ? a.viewsGoal_short : a.viewsGoal) : a.viewsGoal_long;
  return Object.assign({}, a, { id: a.id + ':' + f, base: a.id, fmt: f, name: a.name + ' · ' + FMT_LABEL[f], weekly: Number(w) || 0, viewsGoal: Number(v) || 0 });
}
const acc = id => { const p = String(id).split(':'), a = state.accounts.find(x => x.id === p[0]); return a && p[1] ? virt(a, p[1]) : a; };
const viewAccs = () => state.accounts.flatMap(a => splitOn(a) ? [virt(a, 'short'), virt(a, 'long')] : [a]);
const matchAcc = (i, id) => { const p = String(id).split(':'); return i.accountId === p[0] && (!p[1] || itemFmt(i) === p[1]); };
const accName = id => (acc(id) || { name: 'Non défini' }).name;
const accColor = id => (acc(id) || { color: '#b8b3a3' }).color;

/* ---------- calculs ---------- */
const published = () => state.items.filter(i => i.status === 'publié' && i.date);
function periodItems(days, offset, accId) {
  const to = addDays(today(), -(offset || 0)), from = addDays(to, -days + 1);
  return published().filter(i => i.date >= from && i.date <= to && (!accId || matchAcc(i, accId)));
}
const withViews = a => a.filter(i => Number(i.views) > 0);
const sumViews = a => a.reduce((s, i) => s + (Number(i.views) || 0), 0);
function engagement(a) {
  const v = withViews(a), views = sumViews(v);
  if (!views) return null;
  return v.reduce((s, i) => s + (Number(i.likes) || 0) + (Number(i.comments) || 0), 0) / views * 100;
}
function followersAt(accId, date) {
  const h = state.history.filter(x => x.accountId === accId).sort((a, b) => a.date.localeCompare(b.date));
  if (!h.length) return null;
  let r = h[0].followers;
  h.forEach(x => { if (x.date <= date) r = x.followers; });
  return r;
}
function netFollowers(days, onlyAcc) {
  const start = addDays(today(), -days);
  let tot = 0; const parts = [];
  state.accounts.filter(a => !onlyAcc || a.id === String(onlyAcc).split(':')[0]).forEach(a => {
    const f0 = followersAt(a.id, start);
    if (f0 == null) return;
    const g = a.followers - f0;
    tot += g;
    if (g) parts.push(a.name.replace('YouTube · ', 'YT ') + ' ' + (g > 0 ? '+' : '') + fmt(g));
  });
  return { tot, parts };
}
function weeklyViews(n, accId) {
  const m0 = mondayOf(today()), out = [];
  for (let k = n - 1; k >= 0; k--) {
    const s = addDays(m0, -7 * k), e = addDays(s, 6);
    out.push({ s, v: sumViews(published().filter(i => i.date >= s && i.date <= e && (!accId || matchAcc(i, accId)))) });
  }
  return out;
}
function dayAverages(items) {
  const m = {};
  withViews(items).forEach(i => { const d = at(i.date).getDay(); (m[d] = m[d] || []).push(Number(i.views)); });
  return DAY_ORDER.map(d => ({ d, n: (m[d] || []).length, avg: m[d] ? m[d].reduce((a, b) => a + b, 0) / m[d].length : 0 }));
}
function insights(accId) {
  const out = { working: [], notw: [] };
  const weekly = accId ? (Number(acc(accId).weekly) || 0) : state.accounts.reduce((x, y) => x + (Number(y.weekly) || 0), 0);
  const all = periodItems(period, 0, accId), its = withViews(all);
  const exp = weekly * period / 7, cnt = all.length;
  if (exp >= 1) {
    if (cnt >= exp) out.working.push({ t: 'Rythme tenu', d: `${cnt} post${cnt > 1 ? 's' : ''} publié${cnt > 1 ? 's' : ''} pour ${Math.round(exp)} visés sur ${period} jours.` });
    else if (cnt < exp * 0.7) out.notw.push({ t: 'Rythme de publication', d: `${cnt} post${cnt > 1 ? 's' : ''} publié${cnt > 1 ? 's' : ''} pour ${Math.round(exp)} visés sur ${period} jours.` });
  }
  if (its.length < 3) return out;
  const overall = sumViews(its) / its.length;
  const grp = fn => {
    const m = {};
    its.forEach(i => { const k = fn(i); (m[k] = m[k] || []).push(i); });
    return Object.entries(m).filter(([, v]) => v.length >= 2).map(([k, v]) => ({ k, n: v.length, avg: sumViews(v) / v.length }));
  };
  grp(i => i.category).forEach(g => {
    const r = g.avg / overall, pct = Math.round(Math.abs(r - 1) * 100);
    const base = `${g.n} posts · ${fmt(Math.round(g.avg))} vues en moyenne`;
    if (r >= 1.15) out.working.push({ t: g.k, d: `${base}, ${pct} % au-dessus de ta moyenne (${fmt(Math.round(overall))}).` });
    else if (r <= 0.85) out.notw.push({ t: g.k, d: `${base}, ${pct} % en dessous de ta moyenne (${fmt(Math.round(overall))}).` });
  });
  grp(i => DAY_LONG[at(i.date).getDay()]).forEach(g => {
    if (g.avg / overall >= 1.15) out.working.push({ t: 'Publier le ' + g.k, d: `${g.n} posts · ${fmt(Math.round(g.avg))} vues en moyenne ce jour-là.` });
  });
  return out;
}

/* ---------- composants ---------- */
const chipPct = (cur, prev) => {
  if (!prev) return '';
  const p = (cur - prev) / prev * 100;
  return `<span class="chip ${p >= 0 ? 'up' : 'down'}">${p >= 0 ? '↑' : '↓'} ${Math.abs(p).toFixed(1).replace('.', ',')} %</span>`;
};
const tile = (cls, label, ic, value, chip, sub, action) =>
  `<div class="tile ${cls}" ${action || ''}><div class="tile-top"><span>${label}</span>${icon(ic)}</div><div class="num">${value}</div>${chip ? `<div>${chip}</div>` : ''}<small>${sub}</small></div>`;

function lineChart(arr) {
  const W = 300, H = 100, p = 6, max = Math.max(1, ...arr.map(x => x.v));
  const pts = arr.map((x, i) => [(p + i * (W - 2 * p) / (arr.length - 1)).toFixed(1), (H - p - (x.v / max) * (H - 2 * p)).toFixed(1)]);
  const line = pts.map(q => q.join(',')).join(' ');
  return `<svg class="line" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><polygon points="${p},${H - p} ${line} ${W - p},${H - p}" fill="rgba(43,58,47,.09)"/><polyline points="${line}" fill="none" stroke="#2b3a2f" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`;
}
function gauge(pct) {
  const len = Math.PI * 50;
  return `<svg class="gauge" viewBox="0 0 120 70"><path d="M10 62 A50 50 0 0 1 110 62" fill="none" stroke="#e7e1d1" stroke-width="10" stroke-linecap="round"/><path d="M10 62 A50 50 0 0 1 110 62" fill="none" stroke="#2b3a2f" stroke-width="10" stroke-linecap="round" stroke-dasharray="${(pct / 100 * len).toFixed(1)} ${len.toFixed(1)}"/><text x="60" y="58" text-anchor="middle" font-family="Fraunces,Georgia,serif" font-size="22" fill="#26302a">${Math.round(pct)} %</text></svg>`;
}
const periodPills = () => `<div class="seg">${[7, 30, 90].map(d => `<button data-action="period" data-id="${d}" class="${period === d ? 'on' : ''}">${d} jours</button>`).join('')}</div>`;
const greeting = () => { const h = new Date().getHours(); return h < 5 || h >= 18 ? 'Bonsoir' : h < 12 ? 'Bonjour' : 'Bon après-midi'; };
const head = (title, sub, right) => `<div class="head"><div><h1>${title}</h1><p class="sub">${sub}</p></div><div>${right || ''}</div></div>`;
const accDot = id => `<span class="dot" style="--c:${accColor(id)}"></span>`;

/* ---------- pages ---------- */
function overview() {
  if (ovTab !== 'all' && !acc(ovTab)) ovTab = 'all';
  const A = ovTab === 'all' ? null : ovTab, who = A ? acc(A).name : 'Miahso_';
  const P = period, cur = periodItems(P, 0, A), prev = periodItems(P, P, A);
  const vC = sumViews(cur), vP = sumViews(prev), eC = engagement(cur), eP = engagement(prev);
  const nf = netFollowers(P, A);
  const byAcc = state.accounts.map(a => ({ n: cur.filter(i => i.accountId === a.id).length, a })).filter(x => x.n).map(x => `${x.n} ${esc(x.a.name.replace('YouTube · ', 'YT '))}`).join(' · ');
  const sub = cur.length ? `${who} a fait ${fmt(vC)} vues sur ${cur.length} post${cur.length > 1 ? 's' : ''} ces ${P} derniers jours. Voici ce qui marche et quoi faire ensuite.`
    : 'Ajoute tes posts publiés et leurs vues dans le calendrier pour voir apparaître tes statistiques.';
  const vGoalTxt = '';
  const tiles = [
    tile('t-pink', `Vues, ${P} derniers jours`, 'eye', fmt(vC), chipPct(vC, vP), (vP ? `vs ${fmt(vP)} les ${P} jours d'avant` : 'Aucune période précédente à comparer') + vGoalTxt),
    tile('t-sage', 'Engagement moyen', 'heart', eC == null ? '—' : eC.toFixed(1).replace('.', ',') + ' %', eC != null && eP != null ? `<span class="chip ${eC >= eP ? 'up' : 'down'}">${eC >= eP ? '↑' : '↓'} ${Math.abs(eC - eP).toFixed(1).replace('.', ',')} pts</span>` : '', 'Likes + commentaires / vues'),
    tile('t-beige', `Abonnés gagnés, ${P} j`, 'users', (nf.tot > 0 ? '+' : '') + fmt(nf.tot), '', nf.parts.length ? esc(nf.parts.join(' · ')) : 'Mets à jour tes abonnés chaque semaine'),
    tile('t-lime', `Posts publiés, ${P} j`, 'video', fmt(cur.length), '', byAcc || 'Aucun post publié sur la période')
  ].join('');

  const wk = weeklyViews(8, A);
  const tot = state.accounts.reduce((s, a) => s + a.followers, 0);
  const topAcc = [...state.accounts].sort((a, b) => b.followers - a.followers)[0];
  const days = dayAverages(cur), maxD = Math.max(1, ...days.map(x => x.avg)), best = days.reduce((b, x) => x.avg > b.avg ? x : b, days[0]);
  const target = state.accounts.reduce((s, a) => s + (Number(a.weekly) || 0), 0) * 4;
  const done = published().filter(i => i.date >= addDays(today(), -27)).length;
  const pct = target ? Math.min(100, done / target * 100) : 0;
  const [w0, w1] = [mondayOf(today()), addDays(mondayOf(today()), 6)];
  const rhythm = viewAccs().map(a => {
    const wkI = state.items.filter(i => matchAcc(i, a.id) && i.date >= w0 && i.date <= w1);
    const pub = wkI.filter(i => i.status === 'publié').length, plan = wkI.filter(i => i.status !== 'publié').length, t = Number(a.weekly) || 0;
    return `<div class="row"><span>${accDot(a.id)} ${esc(a.name)}</span><span><span class="pill ${pub >= t && t > 0 ? 'ok' : ''}">${pub}/${t} publié${pub > 1 ? 's' : ''}</span>${plan ? ` <span class="pill plan">${plan} prévu${plan > 1 ? 's' : ''}</span>` : ''}</span></div>`;
  }).join('');

  const goals = state.accounts.map(a => {
    const p = Math.min(100, a.followers / (a.goal || 1) * 100);
    return `<div class="row" data-action="edit-acc" data-id="${esc(a.id)}" style="cursor:pointer;flex-direction:column;align-items:stretch;gap:6px"><div style="display:flex;justify-content:space-between"><span>${accDot(a.id)} ${esc(a.name)}</span><small class="muted">${fmt(a.followers)} / ${fmt(a.goal)}</small></div><div style="height:8px;background:#e7e1d1;border-radius:99px;overflow:hidden"><i style="display:block;height:100%;width:${p.toFixed(1)}%;background:${a.color};border-radius:99px"></i></div></div>`;
  }).join('');

  const ovPills = `<div class="seg"><button data-action="ovtab" data-id="all" class="${!A ? 'on' : ''}">Toutes</button>${viewAccs().map(x => `<button data-action="ovtab" data-id="${esc(x.id)}" class="${A === x.id ? 'on' : ''}"><span class="dot" style="--c:${x.color}"></span>${esc(x.name.replace('YouTube · ', 'YT ').replace('Vidéos longues', 'Longues'))}</button>`).join('')}</div>`;
  const split = viewAccs().map(x => { const c = periodItems(P, 0, x.id), p = periodItems(P, P, x.id); return { x, n: c.length, v: sumViews(c), vp: sumViews(p), e: engagement(c) }; });
  const maxV = Math.max(1, ...split.map(s => s.v)), totV = split.reduce((s, r) => s + r.v, 0);
  const splitCard = `<section class="card"><h3>Vues par plateforme <small class="muted" style="font:400 .8rem var(--sans)">${P} derniers jours</small></h3>
    ${split.map(r => `<div class="vsplit ${A === r.x.id ? 'on' : ''}" data-action="ovtab" data-id="${esc(r.x.id)}"><div class="vs-h"><span>${accDot(r.x.id)} ${esc(r.x.name)}</span><span><b>${fmt(r.v)}</b>${totV ? ` <small class="muted">${Math.round(r.v / totV * 100)} %</small>` : ''} ${chipPct(r.v, r.vp)}</span></div><div class="vs-bar"><i style="width:${r.v / maxV * 100}%;background:${r.x.color}"></i></div><small class="muted">${r.n} post${r.n > 1 ? 's' : ''}${r.n ? ` · ${fmt(Math.round(r.v / r.n))} vues / post` : ''}${r.e != null ? ` · ${r.e.toFixed(1).replace('.', ',')} % d'engagement` : ''}</small></div>`).join('')}
    <small class="muted" style="display:block;margin-top:8px">Touche une plateforme pour filtrer toute la page.</small></section>`;
  return head(`${greeting()}, Sarah`, sub, `<button class="btn" data-action="export">${icon('down')} Exporter</button>`) +
    startCard() + todoCard() + `<div class="bar-tools">${ovPills}${periodPills()}</div><div class="tiles">${tiles}</div>
    <div class="grid">
      <div>
        ${splitCard}
        <section class="card"><h3>Vues par semaine de publication${A ? ' · ' + esc(who) : ''}</h3>
          <div class="big">${fmt(vC)}</div><small class="muted">sur les ${P} derniers jours</small>${lineChart(wk)}
          <div class="top" style="display:flex;justify-content:space-between;color:#7d8577;font-size:.72rem"><span>${dateFR(wk[0].s)}</span><span>8 dernières semaines</span><span>${dateFR(wk[7].s)}</span></div>
        </section>
        <section class="card"><h3>Audience par plateforme <span class="tag">Plus grosse : ${esc(topAcc.name)}</span></h3>
          <div class="aud-wrap">${state.accounts.map(a => `<div class="aud" style="--c:${a.color}"><b>${fmt(a.followers)}</b><small>${esc(a.name)}</small></div>`).join('')}</div>
          <small class="muted" style="display:block;margin-top:10px">Total : ${fmt(tot)} abonnés</small>
        </section>
        <section class="card"><h3>Objectifs d'abonnés</h3>${goals}</section>
      </div>
      <div>
        <section class="card"><h3>Meilleur jour pour publier</h3><small class="muted">Vues moyennes, ${P} jours</small>
          <div class="days">${days.map(x => `<div class="${x.avg && x === best ? 'hot' : ''}"><i style="height:${Math.max(6, x.avg / maxD * 100)}%"></i>${DAY_ABBR[x.d]}</div>`).join('')}</div>
        </section>
        <section class="card"><h3>Régularité de publication</h3><small class="muted">4 dernières semaines</small>${gauge(pct)}<small class="muted" style="display:block;text-align:center">${done} post${done > 1 ? 's' : ''} publié${done > 1 ? 's' : ''} sur ${target} visés</small></section>
        <section class="card"><h3>Cette semaine</h3>${rhythm}</section>
        <section class="card"><h3>Sauvegarde</h3><small class="muted">Tes données sont sur cet appareil. Exporte-les pour les copier sur un autre (la synchro automatique arrive plus tard).</small>
          <div class="actions" style="justify-content:flex-start"><button class="btn ghost sm" data-action="export">Exporter</button><button class="btn ghost sm" data-action="import">Importer</button></div></section>
      </div>
    </div>`;
}

function platforms() {
  if (!acc(platTab)) platTab = viewAccs()[0].id;
  const a = acc(platTab), P = period;
  const cur = periodItems(P, 0, a.id), prev = periodItems(P, P, a.id), wv = withViews(cur), wvp = withViews(prev);
  const avg = wv.length ? sumViews(wv) / wv.length : 0, avgP = wvp.length ? sumViews(wvp) / wvp.length : 0;
  const e = engagement(cur);
  const f0 = followersAt(a.base || a.id, addDays(today(), -P)), g = f0 == null ? 0 : a.followers - f0;
  const tiles = [
    tile('t-pink', 'Abonnés', 'users', fmt(a.followers), `<span class="chip ${g >= 0 ? 'up' : 'down'}">${g >= 0 ? '+' : ''}${fmt(g)} en ${P} j</span>`, `Objectif : ${fmt(a.goal)} · touche pour modifier`, `data-action="edit-acc" data-id="${esc(a.base || a.id)}" style="cursor:pointer"`),
    tile('t-lime', 'Vues moyennes par post', 'eye', fmt(Math.round(avg)), chipPct(avg, avgP), `${wv.length} post${wv.length > 1 ? 's' : ''} sur ${P} jours`),
    tile('t-beige', 'Engagement moyen', 'heart', e == null ? '—' : e.toFixed(1).replace('.', ',') + ' %', '', 'Likes + commentaires / vues')
  ].join('');
  const top = [...wv].sort((x, y) => Number(y.views) - Number(x.views)).slice(0, 5);
  const rows = top.map((i, k) => {
    const eng = (Number(i.likes || 0) + Number(i.comments || 0)) / Number(i.views) * 100;
    return `<div class="trow" data-action="edit-item" data-id="${esc(i.id)}"><div><b>${esc(i.title)}</b><small>#${k + 1} · ${esc(dateFR(i.date))}</small></div><span class="fmt muted">${esc(i.category)}</span><span class="r"><b>${fmt(i.views)}</b></span><span class="r muted">${eng.toFixed(1).replace('.', ',')} %</span></div>`;
  }).join('');
  const ins = insights(a.id);
  const insCard = (title, list, kind) => `<section class="card ins"><h3>${title}<span class="count ${kind}">${list.length}</span></h3>${list.map(x => `<div class="ins-row"><span class="ins-ic ${kind}">${icon(kind === 'ok' ? 'check' : 'x')}</span><div><b>${esc(x.t)}</b><p>${esc(x.d)}</p></div></div>`).join('') || '<p class="muted pad">Pas encore assez de données : il faut au moins 3 posts publiés avec leurs vues.</p>'}</section>`;
  return head('Plateformes', 'Ce qui marche et ce qui ne marche pas, par plateforme.', '') +
    `<div class="bar-tools"><div class="seg">${viewAccs().map(x => `<button data-action="plat" data-id="${esc(x.id)}" class="${x.id === a.id ? 'on' : ''}"><span class="dot" style="--c:${x.color}"></span>${esc(x.name)}</button>`).join('')}</div>${periodPills()}</div>
    <div class="tiles three">${tiles}</div>
    <div class="grid"><div><section class="card"><h3>Meilleurs posts <small class="muted" style="font:400 .8rem var(--sans)">${P} derniers jours</small></h3>
      <div class="trow h"><span>Contenu</span><span class="fmt">Type</span><span class="r">Vues</span><span class="r">Eng.</span></div>${rows || '<div class="empty">Aucun post publié avec des vues sur cette période.<br><br><button class="btn sm" data-action="add-item" data-status="publié" data-acc="' + esc(a.id) + '">' + icon('plus') + ' Ajouter un post publié</button></div>'}</section></div>
      <div>${insCard('Ce qui marche', ins.working, 'ok')}${insCard('Ce qui ne marche pas', ins.notw, 'no')}</div></div>`;
}

const itemCard = i => `<div class="kcard" data-action="edit-item" data-id="${esc(i.id)}"><b>${esc(i.title)}</b><div class="meta"><span>${accDot(i.accountId)} ${esc(accName(i.accountId).replace('YouTube · ', 'YT '))}</span><span class="cat">${esc(i.category)}</span></div><div class="meta"><span>${esc(rel(i.date))}</span>${i.status !== 'publié' ? `<button class="adv" data-action="advance" data-id="${esc(i.id)}" title="Étape suivante">→</button>` : ''}</div></div>`;

function bank() {
  const ideas = state.items.filter(i => i.status === 'idée');
  const cards = ideas.map(i => `<div class="idea" data-action="edit-item" data-id="${esc(i.id)}"><b>${esc(i.title)}</b>${i.note ? `<small class="muted">${esc(i.note.slice(0, 110))}${i.note.length > 110 ? '…' : ''}</small>` : ''}<div class="meta"><span class="cat">${esc(i.category)}</span><span>${accDot(i.accountId)} ${esc(accName(i.accountId))}</span></div><div><button class="btn sm" data-action="advance" data-id="${esc(i.id)}">Lancer →</button></div></div>`).join('');
  return head("Banque d'idées", 'Tout ce que tu as envie de faire un jour. Quand tu te lances, l\'idée passe dans le calendrier.', `<button class="btn" data-action="add-item" data-status="idée">${icon('plus')} Nouvelle idée</button>`) +
    (cards ? `<div class="cards">${cards}</div>` : '<div class="card empty">Aucune idée pour l\'instant. Ajoute-en une, ou pars des tendances.</div>');
}

function calendar() {
  const G = typeof gcalData === 'function' ? gcalData() : { events: [], at: 0 };
  const evs = G.events, endOf = x => x.end || addDays(x.date, 1);
  const on = ds => evs.filter(x => x.date <= ds && ds < endOf(x)).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const calName = ((state.settings || {}).gcalName || 'réseaux');
  const its = state.items, wk0 = mondayOf(today()), wk1 = addDays(wk0, 6);
  const hhmm = G.at ? new Date(G.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—';
  const pipeTiles = [
    tile('t-pink', 'En préparation', 'bulb', fmt(its.filter(i => ['écriture', 'à tourner', 'montage'].includes(i.status)).length), '', 'Écriture, tournage et montage'),
    tile('t-sage', 'Prévus cette semaine', 'cal', fmt(its.filter(i => i.date >= wk0 && i.date <= wk1 && i.status !== 'publié').length), '', dateFR(wk0) + ' → ' + dateFR(wk1)),
    tile('t-beige', 'Prêts à tourner', 'video', fmt(its.filter(i => i.status === 'à tourner').length), '', 'Scriptés, il ne reste qu\'à filmer'),
    tile('t-lime', 'Publiés', 'check', fmt(its.filter(i => i.status === 'publié').length), '', 'Depuis le début')
  ].join('');
  const gTiles = [
    tile('t-pink', "Aujourd'hui", 'cal', fmt(on(today()).length), '', dateFR(today())),
    tile('t-sage', 'Cette semaine', 'cal', fmt(evs.filter(x => x.date <= wk1 && endOf(x) > wk0).length), '', dateFR(wk0) + ' → ' + dateFR(wk1)),
    tile('t-beige', '30 prochains jours', 'cal', fmt(evs.filter(x => x.date >= today() && x.date <= addDays(today(), 30)).length), '', 'Dans « ' + calName + ' »'),
    tile('t-lime', 'Dernière synchro', 'check', hhmm, '', G.at ? dateFR(iso(new Date(G.at))) : 'Pas encore faite')
  ].join('');
  const chip = x => `<a class="mchip g" href="${esc(x.link || 'https://calendar.google.com')}" target="_blank" rel="noopener" title="${esc(x.title)}">${x.time ? esc(x.time) + ' ' : ''}${esc(x.title)}</a>`;
  let body = '';
  if (calView === 'pipeline') {
    body = `<div class="kanban">${STATUS.map(s => {
      let list = its.filter(i => i.status === s).sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
      if (s === 'publié') list = list.sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 10);
      return `<div class="col"><div class="col-h"><span style="color:var(--ink)">${s[0].toUpperCase() + s.slice(1)}</span><span>${its.filter(i => i.status === s).length}</span></div>${list.map(itemCard).join('') || '<div class="empty" style="padding:14px 4px">Rien ici</div>'}</div>`;
    }).join('')}</div>`;
  } else if (!G.at) {
    body = `<section class="card empty">Ton calendrier affiche ce qu'il y a dans ton agenda Google « ${esc(calName)} ».<br><br><button class="btn" data-action="gcal-sync">${icon('cal')} Connecter et afficher mon agenda</button></section>`;
  } else if (calView === 'month') {
    const first = new Date(); first.setDate(1); first.setMonth(first.getMonth() + monthOff);
    const y = first.getFullYear(), m = first.getMonth(), f = new Date(y, m, 1);
    const start = new Date(f); start.setDate(1 - ((f.getDay() + 6) % 7));
    let cells = '';
    for (let k = 0; k < 42; k++) {
      const d = new Date(start); d.setDate(start.getDate() + k);
      const ds = iso(d), list = on(ds);
      cells += `<div class="cell ${d.getMonth() !== m ? 'out' : ''} ${ds === today() ? 'today' : ''}" style="cursor:default"><span>${d.getDate()}</span>${list.slice(0, 3).map(chip).join('')}${list.length > 3 ? `<span class="mchip">+${list.length - 3}</span>` : ''}</div>`;
    }
    body = `<div class="month-nav"><button class="btn ghost sm" data-action="month" data-id="-1">‹</button>${f.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}<button class="btn ghost sm" data-action="month" data-id="1">›</button></div>
      <div class="month">${['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(x => `<div class="mh">${x}</div>`).join('')}${cells}</div>`;
  } else {
    const list = evs.filter(x => endOf(x) > addDays(today(), -7)).sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
    body = `<section class="card">${list.map(x => `<a class="trow" style="grid-template-columns:minmax(0,1fr) auto;text-decoration:none;color:inherit;${endOf(x) <= today() ? 'opacity:.5' : ''}" href="${esc(x.link || 'https://calendar.google.com')}" target="_blank" rel="noopener"><div><b>${esc(x.title)}</b><small>${esc(rel(x.date))}${x.time ? ' · ' + esc(x.time) : ''}</small></div><span class="pill plan">${esc(dateFR(x.date))}</span></a>`).join('') || '<div class="empty">Rien de prévu dans ton agenda.</div>'}</section>`;
  }
  const acts = calView === 'pipeline'
    ? `<button class="btn" data-action="add-item">${icon('plus')} Nouveau contenu</button>`
    : `<button class="btn ghost" data-action="gcal-sync">${icon('cal')} Actualiser</button> <a class="btn" href="https://calendar.google.com" target="_blank" rel="noopener">Ouvrir Google Agenda</a>`;
  return head('Calendrier de contenu', calView === 'pipeline' ? 'Ton pipeline de l\'idée à la publication. Touche → pour passer à l\'étape suivante.' : 'Ce qui est prévu dans ton agenda Google « ' + calName + ' ». Modifie-le dans Google, il se met à jour ici.', acts) +
    `<div class="tiles">${calView === 'pipeline' ? pipeTiles : gTiles}</div><div class="bar-tools"><div class="seg">${[['month', 'Mois'], ['list', 'Liste'], ['pipeline', 'Pipeline']].map(([v, l]) => `<button data-action="calview" data-id="${v}" class="${calView === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>${body}`;
}

const TREND_STATUS = ['à tester', 'en test', 'ça marche', 'bof', 'trop tard'];
const trendDone = s => ['ça marche', 'bof', 'trop tard'].includes(s);

/* ---------- À faire (rappels intelligents) ---------- */
function todos() {
  const out = [], t = today(), wk0 = mondayOf(t), wk1 = addDays(wk0, 6);
  if (reviewDue()) out.push({ ic: 'check', t: 'Fais ta revue de la semaine', s: state.lastReview ? 'Dernière revue : ' + rel(state.lastReview).toLowerCase() : 'Pas encore de revue : 5 minutes pour faire le point', b: 'Commencer', a: 'nav', id: 'review' });
  const target = state.accounts.reduce((s, a) => s + (Number(a.weekly) || 0), 0);
  const inWeek = state.items.filter(i => i.date >= wk0 && i.date <= wk1 && i.status !== 'idée').length;
  if (target && inWeek < target) out.push({ ic: 'cal', t: `Il te manque ${target - inWeek} contenu${target - inWeek > 1 ? 's' : ''} pour tenir ton rythme`, s: `${inWeek} prévu${inWeek > 1 ? 's' : ''} ou publié${inWeek > 1 ? 's' : ''} sur ${target} visés cette semaine`, b: 'Planifier', a: 'add-item', attrs: 'data-status="planifié"' });
  state.items.filter(i => ['écriture', 'à tourner', 'montage'].includes(i.status) && i.moved && daysBetween(i.moved, t) >= 10).slice(0, 2)
    .forEach(i => out.push({ ic: 'video', t: `« ${i.title} » traîne`, s: `En « ${i.status} » depuis ${daysBetween(i.moved, t)} jours : avance ou abandonne.`, b: 'Ouvrir', a: 'edit-item', id: i.id }));
  const noViews = published().filter(i => i.date <= addDays(t, -2) && !Number(i.views)).length;
  if (noViews) out.push({ ic: 'eye', t: `${noViews} post${noViews > 1 ? 's' : ''} publié${noViews > 1 ? 's' : ''} sans vues`, s: 'Sans les vues, l\'analyse ne peut pas t\'aider.', b: 'Ajouter les vues', a: 'nav', id: 'review' });
  state.accounts.filter(x => !(typeof isYT === 'function' && isYT(x))).forEach(x => {
    const last = ((state.settings || {}).imports || {})[x.id], hasCsv = state.items.some(i => i.accountId === x.id && i.source === 'csv');
    const age = last ? daysBetween(last, t) : null;
    if (age == null && !hasCsv) return;
    if (age == null || age >= 14) out.push({ ic: 'up', t: `Importe tes stats ${x.name}`, s: age == null ? 'Dernier import inconnu : exporte un CSV et importe-le.' : `Dernier import il y a ${age} jours${/tiktok/i.test(x.name) ? ' (TikTok ne garde que 60 jours)' : ''}.`, b: 'Importer', a: 'nav', id: 'settings' });
  });
  const stale = state.accounts.some(a => { const h = state.history.filter(x => x.accountId === a.id).map(x => x.date).sort().pop(); return !h || daysBetween(h, t) >= 7; });
  if (stale) out.push({ ic: 'users', t: 'Mets à jour tes abonnés', s: 'Pas de mise à jour depuis plus d\'une semaine.', b: 'Mettre à jour', a: 'nav', id: 'goals' });
  if (state.items.filter(i => i.status === 'idée').length < 3) out.push({ ic: 'bulb', t: 'Ta banque d\'idées est presque vide', s: 'Va voir tes tendances et tes inspirations, ou note une idée.', b: 'Ajouter une idée', a: 'add-item', attrs: 'data-status="idée"' });
  return out.slice(0, 5);
}
function todoCard() {
  const l = todos();
  return `<section class="card todo"><h3>À faire maintenant <span class="count ${l.length ? 'no' : 'ok'}">${l.length}</span></h3>${l.map(x => `<div class="ins-row todo-row"><span class="ins-ic no">${icon(x.ic)}</span><div style="flex:1;min-width:0"><b>${esc(x.t)}</b><p>${esc(x.s || '')}</p></div><button class="btn sm" data-action="${x.a}" ${x.id ? `data-id="${esc(x.id)}"` : ''} ${x.attrs || ''}>${esc(x.b)}</button></div>`).join('') || '<p class="muted pad">Tout est à jour. Beau travail !</p>'}</section>`;
}
function startCard() {
  if (state.hideStart || state.items.length) return '';
  return `<section class="card start"><h3>Bienvenue Sarah, 3 étapes pour démarrer</h3><div class="steps">
    <div class="step"><b>1. Tes abonnés</b><p>Vérifie tes chiffres de départ.</p><button class="btn sm" data-action="nav" data-id="review">Mettre à jour</button></div>
    <div class="step"><b>2. Un post publié</b><p>Ajoute une vidéo avec ses vues pour voir apparaître tes stats.</p><button class="btn sm" data-action="add-item" data-status="publié">Ajouter</button></div>
    <div class="step"><b>3. Une idée</b><p>Note ce que tu veux tourner bientôt.</p><button class="btn sm" data-action="add-item" data-status="idée">Ajouter</button></div></div>
    <button class="btn ghost sm" data-action="hide-start">Masquer ce guide</button></section>`;
}

/* ---------- Sujets tendance (avec suivi des tests) ---------- */
function trends() {
  const list = state.trends.filter(t => trendFilter === 'all' || (trendFilter === 'done' ? trendDone(t.status) : !trendDone(t.status)));
  const all = withViews(published()), overall = all.length ? sumViews(all) / all.length : 0;
  const cards = list.map(t => {
    const linked = state.items.filter(i => i.trendId === t.id);
    const res = withViews(linked.filter(i => i.status === 'publié'));
    let verdict = '';
    if (res.length && overall) {
      const av = sumViews(res) / res.length, p = Math.round((av / overall - 1) * 100);
      verdict = `<div class="verdict ${p >= 0 ? 'up' : 'down'}">Résultat de tes tests : ${fmt(Math.round(av))} vues en moyenne, ${p >= 0 ? '+' : ''}${p} % par rapport à ta moyenne.</div>`;
    }
    const cls = t.status === 'ça marche' ? 'ok' : (t.status === 'bof' || t.status === 'trop tard') ? 'plan' : '';
    return `<div class="idea" data-action="edit-trend" data-id="${esc(t.id)}"><div class="top-r"><b>${esc(t.topic)}</b><span class="pill ${cls}">${esc(t.status)}</span></div><div class="meta"><span class="cat">${esc(t.platform)}</span><span>${esc(rel(t.date))}</span>${linked.length ? `<span>${linked.length} test${linked.length > 1 ? 's' : ''}</span>` : ''}</div>${t.note ? `<small class="muted">${esc(t.note)}</small>` : ''}${t.changed ? `<small><b>Adapté :</b> ${esc(t.changed)}</small>` : ''}${verdict}${linked.length || trendDone(t.status) ? '' : `<div><button class="btn sm" data-action="trend-test" data-id="${esc(t.id)}">Tester cette tendance</button></div>`}</div>`;
  }).join('');
  const seg = `<div class="bar-tools"><div class="seg">${[['all', 'Toutes'], ['open', 'À explorer'], ['done', 'Terminées']].map(([v, l]) => `<button data-action="trendfilter" data-id="${v}" class="${trendFilter === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>`;
  const empty = state.trends.length ? 'Aucune tendance dans cette catégorie.' : 'Aucune tendance notée. Repère un son, un format ou un sujet qui monte, note-le ici, puis teste-le : l\'app te dira si ça marche pour toi.';
  return head('Sujets tendance', 'Ce qui monte dans ta niche. Note-le, teste-le avec ta touche perso, et vois le résultat.', `<button class="btn" data-action="add-trend">${icon('plus')} Nouvelle tendance</button>`) +
    (state.trends.length ? seg : '') + (cards ? `<div class="cards">${cards}</div>` : `<div class="card empty">${empty}</div>`);
}

/* ---------- Veille : créatrices & inspirations ---------- */
function watch() {
  const creators = state.creators.map(c => {
    const n = state.inspirations.filter(i => i.creatorId === c.id).length, url = safeUrl(c.link);
    return `<div class="idea" data-action="edit-creator" data-id="${esc(c.id)}"><b>${esc(c.name)}</b><div class="meta"><span class="cat">${esc(c.platform)}</span><span>${n} inspiration${n > 1 ? 's' : ''}</span></div>${c.observe ? `<small class="muted">${esc(c.observe)}</small>` : ''}${url ? `<a class="lnk" data-action="open-link" href="${esc(url)}" target="_blank" rel="noopener">Ouvrir le profil ↗</a>` : ''}</div>`;
  }).join('');
  const feed = [...state.inspirations].sort((a, b) => (b.date || '').localeCompare(a.date || '')).map(i => {
    const c = state.creators.find(x => x.id === i.creatorId), url = safeUrl(i.link);
    return `<div class="insp" data-action="edit-insp" data-id="${esc(i.id)}"><div style="min-width:0"><b>${esc(i.title)}</b><div class="meta">${c ? `<span>${esc(c.name)}</span>` : ''}<span class="cat">${esc(i.category)}</span><span>${esc(rel(i.date))}</span>${i.used ? '<span class="pill">Repris</span>' : ''}</div>${i.note ? `<small class="muted">${esc(i.note)}</small>` : ''}</div><div class="insp-btns">${url ? `<a class="btn ghost sm" data-action="open-link" href="${esc(url)}" target="_blank" rel="noopener">Voir ↗</a>` : ''}${i.used ? '' : `<button class="btn sm" data-action="insp-idea" data-id="${esc(i.id)}">→ Idée</button>`}</div></div>`;
  }).join('');
  return head('Veille', 'Les créatrices que tu suis et les vidéos qui t\'inspirent. Note-les en 10 secondes, transforme-les en idées.',
    `<button class="btn ghost" data-action="add-creator">${icon('plus')} Créatrice</button> <button class="btn" data-action="add-insp">${icon('plus')} Inspiration</button>`) +
    `<h3 class="sec-h">Créatrices à suivre <span class="count ok">${state.creators.length}</span></h3>` +
    (creators ? `<div class="cards">${creators}</div>` : '<div class="card empty">Aucune créatrice pour l\'instant. Vise 10 à 15 comptes de ta niche (ASMR, lifestyle, pop culture) et note ce que tu observes chez elles.</div>') +
    `<h3 class="sec-h">Inspirations récentes <span class="count ok">${state.inspirations.length}</span></h3>` +
    (feed ? `<section class="card" style="padding-top:6px;padding-bottom:6px">${feed}</section>` : '<div class="card empty">Aucune inspiration. Quand une vidéo te donne une idée, note-la ici avec son lien.</div>');
}

/* ---------- Revue de la semaine ---------- */
function review() {
  const t = today();
  const rows = published().filter(i => i.date >= addDays(t, -13)).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);
  const ideas = state.items.filter(i => i.status === 'idée').slice(0, 15);
  const wk = periodItems(7), pw = periodItems(7, 7), vC = sumViews(wk), vP = sumViews(pw);
  const best = withViews(wk).sort((a, b) => Number(b.views) - Number(a.views))[0];
  const w = insights(null).working[0];
  const step = (n, title, sub, body) => `<section class="card"><h3><span class="stepn">${n}</span>${title}</h3><p class="muted" style="margin:0 0 10px">${sub}</p>${body}</section>`;
  const num = (key, val, label) => `<label>${label}<input type="number" inputmode="numeric" min="0" data-rv="${key}" value="${esc(val)}"></label>`;
  const s1 = `<div class="rv-grid">${state.accounts.map(a => `<label>${accDot(a.id)} ${esc(a.name)}<input type="number" inputmode="numeric" min="0" data-rv="f:${esc(a.id)}" value="${esc(a.followers)}"></label>`).join('')}</div>`;
  const s2 = rows.length ? rows.map(i => `<div class="rv-row"><div class="rv-t"><b>${esc(i.title)}</b><small class="muted"> · ${esc(accName(i.accountId))} · ${esc(dateFR(i.date))}</small></div>${num('v:' + i.id, i.views, 'Vues')}${num('l:' + i.id, i.likes, 'Likes')}${num('c:' + i.id, i.comments, 'Comm.')}</div>`).join('')
    : '<p class="muted">Aucun post publié ces 14 derniers jours. Ajoute-en un avec le bouton +.</p>';
  const s3 = `<div class="tiles three" style="margin:0">${tile('t-pink', 'Vues, 7 jours', 'eye', fmt(vC), chipPct(vC, vP), vP ? `vs ${fmt(vP)} la semaine d'avant` : 'Pas de semaine précédente')}${tile('t-lime', 'Post star', 'heart', best ? fmt(best.views) : '—', '', best ? esc(best.title) : 'Pas encore de vues saisies')}${tile('t-sage', 'À retenir', 'check', w ? esc(w.t) : '—', '', w ? esc(w.d) : 'Pas encore assez de données')}</div>
    <small class="muted" style="display:block;margin-top:8px">Ce bilan se met à jour avec les chiffres saisis plus haut après l'enregistrement.</small>`;
  const s4 = ideas.length ? ideas.map(i => `<label class="check"><input type="checkbox" data-rv="idea:${esc(i.id)}"><span><b>${esc(i.title)}</b> <small class="muted">${esc(i.category)}</small></span></label>`).join('')
    : '<div class="empty">Ta banque d\'idées est vide. <br><br><button class="btn sm" data-action="add-item" data-status="idée">Ajouter une idée</button></div>';
  return head('Revue de la semaine', 'Cinq minutes pour faire le point. ' + (state.lastReview ? 'Dernière revue : ' + rel(state.lastReview).toLowerCase() + '.' : 'Rien n\'est enregistré avant « Terminer la revue ».'), '') +
    step(1, 'Tes abonnés', 'Recopie les chiffres affichés dans chaque application.', s1) +
    step(2, 'Les stats de tes derniers posts', 'Vues, likes et commentaires : dans les statistiques de chaque vidéo.', s2) +
    step(3, 'Le bilan de la semaine', 'Calculé automatiquement.', s3) +
    step(4, 'Tes idées pour la semaine prochaine', 'Coche 2 idées à lancer : elles passent en « écriture ».', s4) +
    `<div class="actions" style="justify-content:flex-start"><button class="btn" data-action="review-save">Terminer la revue</button></div>`;
}

function saveReview() {
  const t = today(), keys = { v: 'views', l: 'likes', c: 'comments' };
  document.querySelectorAll('[data-rv]').forEach(el => {
    const sep = el.dataset.rv.indexOf(':'), k = el.dataset.rv.slice(0, sep), id = el.dataset.rv.slice(sep + 1);
    if (k === 'f') {
      const a = acc(id);
      if (!a || el.value === '') return;
      a.followers = Number(el.value);
      state.history = state.history.filter(h => !(h.accountId === id && h.date === t));
      state.history.push({ date: t, accountId: id, followers: a.followers });
    } else if (keys[k]) {
      const it = state.items.find(x => x.id === id);
      if (it) it[keys[k]] = el.value === '' ? '' : Number(el.value);
    } else if (k === 'idea' && el.checked) {
      const it = state.items.find(x => x.id === id);
      if (it) { it.status = 'écriture'; it.moved = t; }
    }
  });
  state.lastReview = t;
  save(); page = 'overview'; render(); window.scrollTo(0, 0);
  toast('Revue enregistrée. Bonne semaine !');
}

/* ---------- bouton + rapide ---------- */
function fabHtml() {
  const entries = [['add-item', 'idée', 'bulb', 'Nouvelle idée'], ['add-item', 'planifié', 'cal', 'Contenu planifié'], ['add-item', 'publié', 'video', 'Post publié'], ['add-insp', '', 'star', 'Inspiration'], ['add-trend', '', 'flame', 'Tendance']];
  return `<div id="fabmenu" class="${fabOpen ? 'open' : ''}">${entries.map(([a, s, ic, l]) => `<button data-action="${a}" ${s ? `data-status="${s}"` : ''}>${icon(ic)}<span>${l}</span></button>`).join('')}</div><button class="fab-btn ${fabOpen ? 'on' : ''}" data-action="fab" aria-label="Ajouter">${icon('plus')}</button>`;
}

const PAGES = { overview, platforms, bank, calendar, watch, trends, review };
const NAV = [
  ['Analyse', [['overview', 'Vue d\'ensemble', 'Accueil', 'grid'], ['platforms', 'Plateformes', 'Plateformes', 'layers']]],
  ['Stratégie', [['bank', 'Banque d\'idées', 'Idées', 'bulb'], ['calendar', 'Calendrier de contenu', 'Calendrier', 'cal']]],
  ['Veille', [['watch', 'Créatrices & inspirations', 'Veille', 'star'], ['trends', 'Sujets tendance', 'Tendances', 'flame'], ['review', 'Revue de la semaine', 'Revue', 'list']]]
];

function render() {
  if (state.settings && Array.isArray(state.settings.cats) && state.settings.cats.length) CATS = state.settings.cats;
  try { localStorage.setItem('miahso-page', page); } catch (e) { /* ignore */ }
  const nIdeas = state.items.filter(i => i.status === 'idée').length;
  document.body.classList.toggle('collapsed', sideCollapsed);
  document.body.classList.toggle('side-open', sideOpen);
  const toggleIcon = isMobile() ? 'x' : sideCollapsed ? 'chevR' : 'chevL';
  const toggleTitle = isMobile() ? 'Fermer le menu' : sideCollapsed ? 'Agrandir le menu' : 'Réduire le menu';
  $('#side').innerHTML = `<div class="brand"><div class="avatar">M</div><div class="brand-t"><b>Miahso_</b><small>ASMR &amp; lifestyle</small></div><button class="side-toggle" data-action="side-toggle" title="${toggleTitle}" aria-label="${toggleTitle}">${icon(toggleIcon)}</button></div>` +
    NAV.map(([g, list]) => `<div class="sec">${g}</div>` + list.map(([id, label, , ic]) => `<button class="nav-i ${page === id ? 'on' : ''}" data-action="nav" data-id="${id}" title="${esc(label)}">${icon(ic)}<span class="lbl">${label}</span>${badgeFor(id, nIdeas)}</button>`).join('')).join('') + (typeof syncStatusHtml === 'function' ? syncStatusHtml() : '');
  $('#topbar').innerHTML = `<button data-action="menu" aria-label="Ouvrir le menu">${icon('menu')}</button><b>Miahso_</b>`;
  $('#view').innerHTML = PAGES[page]();
  $('#fab').innerHTML = fabHtml();
}

/* ---------- formulaires ---------- */
function fieldHtml(f, v) {
  const val = v == null ? '' : v;
  const input = f.type === 'select'
    ? `<select name="${f.name}">${f.options.map(([ov, ol]) => `<option value="${esc(ov)}" ${String(ov) === String(val) ? 'selected' : ''}>${esc(ol)}</option>`).join('')}</select>`
    : f.type === 'textarea'
      ? `<textarea name="${f.name}" rows="3">${esc(val)}</textarea>`
      : `<input name="${f.name}" type="${f.type}" value="${esc(val)}" ${f.type === 'number' ? 'inputmode="numeric" min="0"' : ''} ${f.required ? 'required' : ''}>`;
  return `<label>${esc(f.label)}${input}</label>`;
}

function form(title, fields, vals, onSave, onDelete) {
  const d = $('#dlg');
  d.innerHTML = `<form id="f"><h2>${esc(title)}</h2>${fields.map(f => fieldHtml(f, vals[f.name])).join('')}<div class="actions">${onDelete ? '<button type="button" class="btn danger" id="del">Supprimer</button>' : ''}<button type="button" class="btn ghost" id="cancel">Annuler</button><button type="submit" class="btn">Enregistrer</button></div></form>`;
  const f = $('#f', d);
  f.onsubmit = e => {
    e.preventDefault();
    const out = {};
    fields.forEach(fl => {
      const v = f.elements[fl.name].value;
      out[fl.name] = fl.type === 'number' ? (v === '' ? '' : Number(v)) : v.trim();
    });
    onSave(out); save(); d.close(); render();
  };
  $('#cancel', d).onclick = () => d.close();
  if (onDelete) $('#del', d).onclick = () => { if (confirm('Supprimer ?')) { onDelete(); save(); d.close(); render(); } };
  d.showModal();
}

const accOptions = () => [['', 'Non défini']].concat(state.accounts.map(a => [a.id, a.name]));
const catOptions = () => CATS.map(c => [c, c]);

function accountForm(a) {
  form('Modifier le compte', [
    { name: 'name', label: 'Nom', type: 'text', required: true },
    { name: 'followers', label: 'Abonnés actuels', type: 'number', required: true },
    { name: 'goal', label: 'Objectif d\'abonnés', type: 'number', required: true },
    { name: 'weekly', label: 'Posts visés par semaine', type: 'number' }
  ], a, out => {
    const last = state.history.filter(h => h.accountId === a.id).sort((x, y) => x.date.localeCompare(y.date)).pop();
    if (!last || last.followers !== out.followers) {
      state.history = state.history.filter(h => !(h.accountId === a.id && h.date === today()));
      state.history.push({ date: today(), accountId: a.id, followers: out.followers });
    }
    Object.assign(a, out);
  });
}

function itemForm(it, prefill) {
  const isNew = !it;
  it = it || Object.assign({ id: uid(), title: '', category: 'ASMR', accountId: '', status: 'idée', date: '', views: '', likes: '', comments: '', note: '', moved: today() }, prefill || {});
  const before = it.status;
  form(isNew ? 'Nouveau contenu' : 'Modifier le contenu', [
    { name: 'title', label: 'Titre / sujet', type: 'text', required: true },
    { name: 'status', label: 'Étape', type: 'select', options: STATUS.map(s => [s, s[0].toUpperCase() + s.slice(1)]) },
    { name: 'date', label: 'Date prévue ou de publication', type: 'date' },
    { name: 'accountId', label: 'Compte', type: 'select', options: accOptions() },
    { name: 'category', label: 'Type de contenu', type: 'select', options: catOptions() },
    { name: 'fmt', label: 'Format YouTube (laisse vide si ce n\'est pas YouTube)', type: 'select', options: [['', '—'], ['short', 'Short'], ['long', 'Vidéo longue']] },
    { name: 'note', label: 'Notes (accroche, matériel, lien d\'inspiration…)', type: 'textarea' },
    { name: 'views', label: 'Vues (une fois publié)', type: 'number' },
    { name: 'likes', label: 'Likes', type: 'number' },
    { name: 'comments', label: 'Commentaires', type: 'number' }
  ], it, out => {
    if (out.status === 'publié' && !out.date) out.date = today();
    if (out.status !== before) it.moved = today();
    Object.assign(it, out);
    if (out.fmt) it.fmtLocked = true; else delete it.fmtLocked;
    if (isNew) state.items.push(it);
  }, isNew ? null : () => { state.items = state.items.filter(x => x !== it); });
}

function trendForm(t) {
  const isNew = !t;
  t = t || { id: uid(), topic: '', platform: 'TikTok', status: 'à tester', note: '', changed: '', date: today() };
  form(isNew ? 'Nouvelle tendance' : 'Modifier la tendance', [
    { name: 'topic', label: 'Sujet / son / format', type: 'text', required: true },
    { name: 'platform', label: 'Plateforme', type: 'select', options: TREND_PLATFORMS.map(p => [p, p]) },
    { name: 'status', label: 'Statut du test', type: 'select', options: TREND_STATUS.map(s => [s, s[0].toUpperCase() + s.slice(1)]) },
    { name: 'note', label: 'Pourquoi ça marche, comment la reprendre', type: 'textarea' },
    { name: 'changed', label: 'Ce que j\'ai changé / adapté (ta touche perso)', type: 'textarea' }
  ], t, out => { Object.assign(t, out); if (isNew) state.trends.unshift(t); }, isNew ? null : () => { state.trends = state.trends.filter(x => x !== t); });
}

function creatorForm(c) {
  const isNew = !c;
  c = c || { id: uid(), name: '', platform: 'TikTok', link: '', observe: '' };
  form(isNew ? 'Nouvelle créatrice' : 'Modifier la créatrice', [
    { name: 'name', label: 'Nom ou @pseudo', type: 'text', required: true },
    { name: 'platform', label: 'Plateforme principale', type: 'select', options: TREND_PLATFORMS.map(p => [p, p]) },
    { name: 'link', label: 'Lien du profil (facultatif)', type: 'url' },
    { name: 'ytHandle', label: 'Chaîne YouTube pour le suivi automatique (@nom ou lien, facultatif)', type: 'text' },
    { name: 'observe', label: 'Ce que j\'observe chez elle (formats, sons, rythme…)', type: 'textarea' }
  ], c, out => { Object.assign(c, out); if (isNew) state.creators.push(c); },
  isNew ? null : () => { state.creators = state.creators.filter(x => x !== c); state.inspirations.forEach(i => { if (i.creatorId === c.id) i.creatorId = ''; }); });
}

function inspForm(i) {
  const isNew = !i;
  i = i || { id: uid(), title: '', creatorId: '', category: 'ASMR', link: '', note: '', date: today(), used: false };
  form(isNew ? 'Nouvelle inspiration' : 'Modifier l\'inspiration', [
    { name: 'title', label: 'Ce qui t\'inspire (la vidéo, le format, l\'idée)', type: 'text', required: true },
    { name: 'creatorId', label: 'Créatrice', type: 'select', options: [['', 'Autre / non listée']].concat(state.creators.map(c => [c.id, c.name])) },
    { name: 'category', label: 'Type de contenu', type: 'select', options: catOptions() },
    { name: 'link', label: 'Lien de la vidéo (facultatif)', type: 'url' },
    { name: 'note', label: 'Ce que je retiens / comment je le reprends à ma façon', type: 'textarea' }
  ], i, out => { Object.assign(i, out); if (isNew) state.inspirations.unshift(i); },
  isNew ? null : () => { state.inspirations = state.inspirations.filter(x => x !== i); });
}

/* ---------- événements ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-action]');
  if (!t) { if (fabOpen) { fabOpen = false; $('#fab').innerHTML = fabHtml(); } return; }
  const id = t.dataset.id;
  if (t.dataset.action !== 'fab' && fabOpen) { fabOpen = false; $('#fab').innerHTML = fabHtml(); }
  switch (t.dataset.action) {
    case 'open-link': return;
    case 'fab': fabOpen = !fabOpen; $('#fab').innerHTML = fabHtml(); break;
    case 'hide-start': state.hideStart = true; save(); render(); break;
    case 'add-creator': creatorForm(); break;
    case 'edit-creator': creatorForm(state.creators.find(x => x.id === id)); break;
    case 'add-insp': inspForm(); break;
    case 'edit-insp': inspForm(state.inspirations.find(x => x.id === id)); break;
    case 'insp-idea': {
      const i = state.inspirations.find(x => x.id === id), c = state.creators.find(x => x.id === i.creatorId);
      const note = ['Inspiré de ' + (c ? c.name : 'une vidéo vue en ligne'), safeUrl(i.link), i.note].filter(Boolean).join('\n');
      state.items.push({ id: uid(), title: i.title, category: i.category, accountId: '', status: 'idée', date: '', views: '', likes: '', comments: '', note, moved: today() });
      i.used = true; save(); render(); toast('Ajouté à ta banque d\'idées'); break;
    }
    case 'trend-test': {
      const tr = state.trends.find(x => x.id === id);
      state.items.push({ id: uid(), title: 'Test : ' + tr.topic, category: 'Autre', accountId: '', status: 'idée', date: '', views: '', likes: '', comments: '', note: [tr.note, tr.changed].filter(Boolean).join('\n'), trendId: tr.id, moved: today() });
      tr.status = 'en test'; save(); render(); toast('Ajouté à ta banque d\'idées : planifie-le quand tu veux'); break;
    }
    case 'trendfilter': trendFilter = id; render(); break;
    case 'review-save': saveReview(); break;
    case 'nav': page = id; sideOpen = false; render(); window.scrollTo(0, 0); break;
    case 'menu': sideOpen = true; render(); break;
    case 'scrim': sideOpen = false; render(); break;
    case 'side-toggle':
      if (isMobile()) sideOpen = false;
      else { sideCollapsed = !sideCollapsed; try { localStorage.setItem('miahso-side', sideCollapsed ? '1' : '0'); } catch (err) { /* ignore */ } }
      render(); break;
    case 'period': period = Number(id); render(); break;
    case 'plat': platTab = id; render(); break;
    case 'ovtab': ovTab = id; render(); break;
    case 'calview': calView = id; render(); break;
    case 'month': monthOff += Number(id); render(); break;
    case 'edit-acc': accountForm(acc(id)); break;
    case 'add-item': itemForm(null, { status: t.dataset.status || 'idée', date: t.dataset.date || '', accountId: t.dataset.acc || '' }); break;
    case 'edit-item': itemForm(state.items.find(i => i.id === id)); break;
    case 'advance': {
      const i = state.items.find(x => x.id === id);
      i.status = STATUS[Math.min(STATUS.length - 1, STATUS.indexOf(i.status) + 1)];
      if (i.status === 'publié' && !i.date) i.date = today();
      i.moved = today();
      save(); render(); break;
    }
    case 'add-trend': trendForm(); break;
    case 'edit-trend': trendForm(state.trends.find(x => x.id === id)); break;
    case 'export': {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
      a.download = 'miahso-dashboard-' + today() + '.json';
      a.click(); break;
    }
    case 'import': $('#file').click(); break;
    default: if (typeof extraAction === 'function') extraAction(t.dataset.action, t, id);
  }
});

$('#file').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const s = JSON.parse(r.result);
      if (!Array.isArray(s.accounts)) throw new Error('format');
      state = migrate(s); save(); render();
    } catch (err) { alert('Fichier invalide.'); }
  };
  r.readAsText(file);
  e.target.value = '';
});

window.addEventListener('resize', () => { if (!isMobile() && sideOpen) { sideOpen = false; render(); } });
save(false);
render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

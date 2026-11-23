'use strict';
/* Miahso_ Dashboard — V2 design (données stockées sur l'appareil, sans serveur) */
const KEY = 'miahso-dashboard-v1';
const CATS = ['ASMR', 'Lifestyle', 'Pop culture', 'Skincare / Maquillage', 'Humour', 'Autre'];
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
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>'
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
  history: []
});

function migrate(s) {
  const o = Object.assign(defaults(), s || {});
  const base = defaults().accounts;
  o.accounts = (o.accounts || []).map(a => Object.assign({ color: (base.find(b => b.id === a.id) || {}).color || '#7d8577' }, a));
  if (!Array.isArray(o.items)) o.items = [];
  if (!Array.isArray(o.trends)) o.trends = [];
  if (!Array.isArray(o.history)) o.history = [];
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
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } }

let state = load();
let page = 'overview';
let period = 30;
let platTab = state.accounts[0].id;
let calView = 'pipeline';
let monthOff = 0;
let sideOpen = false;
let sideCollapsed = false;
try { sideCollapsed = localStorage.getItem('miahso-side') === '1'; } catch (e) { /* ignore */ }
const isMobile = () => window.matchMedia('(max-width:900px)').matches;

const acc = id => state.accounts.find(a => a.id === id);
const accName = id => (acc(id) || { name: 'Non défini' }).name;
const accColor = id => (acc(id) || { color: '#b8b3a3' }).color;

/* ---------- calculs ---------- */
const published = () => state.items.filter(i => i.status === 'publié' && i.date);
function periodItems(days, offset, accId) {
  const to = addDays(today(), -(offset || 0)), from = addDays(to, -days + 1);
  return published().filter(i => i.date >= from && i.date <= to && (!accId || i.accountId === accId));
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
function netFollowers(days) {
  const start = addDays(today(), -days);
  let tot = 0; const parts = [];
  state.accounts.forEach(a => {
    const f0 = followersAt(a.id, start);
    if (f0 == null) return;
    const g = a.followers - f0;
    tot += g;
    if (g) parts.push(a.name.replace('YouTube · ', 'YT ') + ' ' + (g > 0 ? '+' : '') + fmt(g));
  });
  return { tot, parts };
}
function weeklyViews(n) {
  const m0 = mondayOf(today()), out = [];
  for (let k = n - 1; k >= 0; k--) {
    const s = addDays(m0, -7 * k), e = addDays(s, 6);
    out.push({ s, v: sumViews(published().filter(i => i.date >= s && i.date <= e)) });
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
  const a = acc(accId), all = periodItems(period, 0, accId), its = withViews(all);
  const exp = (Number(a.weekly) || 0) * period / 7, cnt = all.length;
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
  const P = period, cur = periodItems(P), prev = periodItems(P, P);
  const vC = sumViews(cur), vP = sumViews(prev), eC = engagement(cur), eP = engagement(prev);
  const nf = netFollowers(P);
  const byAcc = state.accounts.map(a => ({ n: cur.filter(i => i.accountId === a.id).length, a })).filter(x => x.n).map(x => `${x.n} ${esc(x.a.name.replace('YouTube · ', 'YT '))}`).join(' · ');
  const sub = cur.length ? `Miahso_ a fait ${fmt(vC)} vues sur ${cur.length} post${cur.length > 1 ? 's' : ''} ces ${P} derniers jours. Voici ce qui marche et quoi faire ensuite.`
    : 'Ajoute tes posts publiés et leurs vues dans le calendrier pour voir apparaître tes statistiques.';
  const tiles = [
    tile('t-pink', `Vues, ${P} derniers jours`, 'eye', fmt(vC), chipPct(vC, vP), vP ? `vs ${fmt(vP)} les ${P} jours d'avant` : 'Aucune période précédente à comparer'),
    tile('t-sage', 'Engagement moyen', 'heart', eC == null ? '—' : eC.toFixed(1).replace('.', ',') + ' %', eC != null && eP != null ? `<span class="chip ${eC >= eP ? 'up' : 'down'}">${eC >= eP ? '↑' : '↓'} ${Math.abs(eC - eP).toFixed(1).replace('.', ',')} pts</span>` : '', 'Likes + commentaires / vues'),
    tile('t-beige', `Abonnés gagnés, ${P} j`, 'users', (nf.tot > 0 ? '+' : '') + fmt(nf.tot), '', nf.parts.length ? esc(nf.parts.join(' · ')) : 'Mets à jour tes abonnés chaque semaine'),
    tile('t-lime', `Posts publiés, ${P} j`, 'video', fmt(cur.length), '', byAcc || 'Aucun post publié sur la période')
  ].join('');

  const wk = weeklyViews(8);
  const tot = state.accounts.reduce((s, a) => s + a.followers, 0);
  const topAcc = [...state.accounts].sort((a, b) => b.followers - a.followers)[0];
  const days = dayAverages(cur), maxD = Math.max(1, ...days.map(x => x.avg)), best = days.reduce((b, x) => x.avg > b.avg ? x : b, days[0]);
  const target = state.accounts.reduce((s, a) => s + (Number(a.weekly) || 0), 0) * 4;
  const done = published().filter(i => i.date >= addDays(today(), -27)).length;
  const pct = target ? Math.min(100, done / target * 100) : 0;
  const [w0, w1] = [mondayOf(today()), addDays(mondayOf(today()), 6)];
  const rhythm = state.accounts.map(a => {
    const wkI = state.items.filter(i => i.accountId === a.id && i.date >= w0 && i.date <= w1);
    const pub = wkI.filter(i => i.status === 'publié').length, plan = wkI.filter(i => i.status !== 'publié').length, t = Number(a.weekly) || 0;
    return `<div class="row"><span>${accDot(a.id)} ${esc(a.name)}</span><span><span class="pill ${pub >= t && t > 0 ? 'ok' : ''}">${pub}/${t} publié${pub > 1 ? 's' : ''}</span>${plan ? ` <span class="pill plan">${plan} prévu${plan > 1 ? 's' : ''}</span>` : ''}</span></div>`;
  }).join('');

  const goals = state.accounts.map(a => {
    const p = Math.min(100, a.followers / (a.goal || 1) * 100);
    return `<div class="row" data-action="edit-acc" data-id="${esc(a.id)}" style="cursor:pointer;flex-direction:column;align-items:stretch;gap:6px"><div style="display:flex;justify-content:space-between"><span>${accDot(a.id)} ${esc(a.name)}</span><small class="muted">${fmt(a.followers)} / ${fmt(a.goal)}</small></div><div style="height:8px;background:#e7e1d1;border-radius:99px;overflow:hidden"><i style="display:block;height:100%;width:${p.toFixed(1)}%;background:${a.color};border-radius:99px"></i></div></div>`;
  }).join('');

  return head(`${greeting()}, Sarah`, sub, `<button class="btn" data-action="export">${icon('down')} Exporter</button>`) +
    `<div class="bar-tools">${periodPills()}</div><div class="tiles">${tiles}</div>
    <div class="grid">
      <div>
        <section class="card"><h3>Vues par semaine de publication</h3>
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
  if (!acc(platTab)) platTab = state.accounts[0].id;
  const a = acc(platTab), P = period;
  const cur = periodItems(P, 0, a.id), prev = periodItems(P, P, a.id), wv = withViews(cur), wvp = withViews(prev);
  const avg = wv.length ? sumViews(wv) / wv.length : 0, avgP = wvp.length ? sumViews(wvp) / wvp.length : 0;
  const e = engagement(cur);
  const f0 = followersAt(a.id, addDays(today(), -P)), g = f0 == null ? 0 : a.followers - f0;
  const tiles = [
    tile('t-pink', 'Abonnés', 'users', fmt(a.followers), `<span class="chip ${g >= 0 ? 'up' : 'down'}">${g >= 0 ? '+' : ''}${fmt(g)} en ${P} j</span>`, `Objectif : ${fmt(a.goal)} · touche pour modifier`, `data-action="edit-acc" data-id="${esc(a.id)}" style="cursor:pointer"`),
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
    `<div class="bar-tools"><div class="seg">${state.accounts.map(x => `<button data-action="plat" data-id="${esc(x.id)}" class="${x.id === a.id ? 'on' : ''}"><span class="dot" style="--c:${x.color}"></span>${esc(x.name)}</button>`).join('')}</div>${periodPills()}</div>
    <div class="tiles three">${tiles}</div>
    <div class="grid"><div><section class="card"><h3>Meilleurs posts <small class="muted" style="font:400 .8rem var(--sans)">${P} derniers jours</small></h3>
      <div class="trow h"><span>Contenu</span><span class="fmt">Type</span><span class="r">Vues</span><span class="r">Eng.</span></div>${rows || '<div class="empty">Aucun post publié avec des vues sur cette période.<br><br><button class="btn sm" data-action="add-item" data-status="publié" data-acc="' + esc(a.id) + '">' + icon('plus') + ' Ajouter un post publié</button></div>'}</section></div>
      <div>${insCard('Ce qui marche', ins.working, 'ok')}${insCard('Ce qui ne marche pas', ins.notw, 'no')}</div></div>`;
}

const itemCard = i => `<div class="kcard" data-action="edit-item" data-id="${esc(i.id)}"><b>${esc(i.title)}</b><div class="meta"><span>${accDot(i.accountId)} ${esc(accName(i.accountId).replace('YouTube · ', 'YT '))}</span><span class="cat">${esc(i.category)}</span></div><div class="meta"><span>${esc(rel(i.date))}</span>${i.status !== 'publié' ? `<button class="adv" data-action="advance" data-id="${esc(i.id)}" title="Étape suivante">→</button>` : ''}</div></div>`;

function bank() {
  const ideas = state.items.filter(i => i.status === 'idée');
  const cards = ideas.map(i => `<div class="idea" data-action="edit-item" data-id="${esc(i.id)}"><b>${esc(i.title)}</b><div class="meta"><span class="cat">${esc(i.category)}</span><span>${accDot(i.accountId)} ${esc(accName(i.accountId))}</span></div><div><button class="btn sm" data-action="advance" data-id="${esc(i.id)}">Lancer →</button></div></div>`).join('');
  return head("Banque d'idées", 'Tout ce que tu as envie de faire un jour. Quand tu te lances, l\'idée passe dans le calendrier.', `<button class="btn" data-action="add-item" data-status="idée">${icon('plus')} Nouvelle idée</button>`) +
    (cards ? `<div class="cards">${cards}</div>` : '<div class="card empty">Aucune idée pour l\'instant. Ajoute-en une, ou pars des tendances.</div>');
}

function calendar() {
  const its = state.items, wk0 = mondayOf(today()), wk1 = addDays(wk0, 6);
  const tiles = [
    tile('t-pink', 'En préparation', 'bulb', fmt(its.filter(i => ['écriture', 'à tourner', 'montage'].includes(i.status)).length), '', 'Écriture, tournage et montage'),
    tile('t-sage', 'Prévus cette semaine', 'cal', fmt(its.filter(i => i.date >= wk0 && i.date <= wk1 && i.status !== 'publié').length), '', dateFR(wk0) + ' → ' + dateFR(wk1)),
    tile('t-beige', 'Prêts à tourner', 'video', fmt(its.filter(i => i.status === 'à tourner').length), '', 'Scriptés, il ne reste qu\'à filmer'),
    tile('t-lime', 'Publiés', 'check', fmt(its.filter(i => i.status === 'publié').length), '', 'Depuis le début')
  ].join('');
  let body = '';
  if (calView === 'pipeline') {
    body = `<div class="kanban">${STATUS.map(s => {
      let list = its.filter(i => i.status === s).sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
      if (s === 'publié') list = list.sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 10);
      return `<div class="col"><div class="col-h"><span style="color:var(--ink)">${s[0].toUpperCase() + s.slice(1)}</span><span>${its.filter(i => i.status === s).length}</span></div>${list.map(itemCard).join('') || '<div class="empty" style="padding:14px 4px">Rien ici</div>'}</div>`;
    }).join('')}</div>`;
  } else if (calView === 'month') {
    const first = new Date(); first.setDate(1); first.setMonth(first.getMonth() + monthOff);
    const y = first.getFullYear(), m = first.getMonth(), f = new Date(y, m, 1);
    const start = new Date(f); start.setDate(1 - ((f.getDay() + 6) % 7));
    let cells = '';
    for (let k = 0; k < 42; k++) {
      const d = new Date(start); d.setDate(start.getDate() + k);
      const ds = iso(d), list = its.filter(i => i.date === ds);
      cells += `<div class="cell ${d.getMonth() !== m ? 'out' : ''} ${ds === today() ? 'today' : ''}" data-action="add-item" data-date="${ds}"><span>${d.getDate()}</span>${list.slice(0, 3).map(i => `<span class="mchip ${i.status === 'publié' ? 'pub' : ''}" data-action="edit-item" data-id="${esc(i.id)}">${esc(i.title)}</span>`).join('')}${list.length > 3 ? `<span class="mchip">+${list.length - 3}</span>` : ''}</div>`;
    }
    body = `<div class="month-nav"><button class="btn ghost sm" data-action="month" data-id="-1">‹</button>${f.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}<button class="btn ghost sm" data-action="month" data-id="1">›</button></div>
      <div class="month">${['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(x => `<div class="mh">${x}</div>`).join('')}${cells}</div>`;
  } else {
    const list = [...its].sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
    body = `<section class="card">${list.map(i => `<div class="trow" style="grid-template-columns:1fr auto" data-action="edit-item" data-id="${esc(i.id)}"><div><b>${esc(i.title)}</b><small>${esc(rel(i.date))} · ${esc(accName(i.accountId))} · ${esc(i.category)}</small></div><span class="pill ${i.status === 'publié' ? 'ok' : i.status === 'idée' ? '' : 'plan'}">${i.status === 'publié' && Number(i.views) ? fmt(i.views) + ' vues' : esc(i.status)}</span></div>`).join('') || '<div class="empty">Aucun contenu.</div>'}</section>`;
  }
  return head('Calendrier de contenu', 'Ton pipeline de l\'idée à la publication. Touche → pour passer à l\'étape suivante.', `<button class="btn" data-action="add-item">${icon('plus')} Nouveau contenu</button>`) +
    `<div class="tiles">${tiles}</div><div class="bar-tools"><div class="seg">${[['pipeline', 'Pipeline'], ['month', 'Mois'], ['list', 'Liste']].map(([v, l]) => `<button data-action="calview" data-id="${v}" class="${calView === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>${body}`;
}

function trends() {
  const cards = state.trends.map(t => `<div class="idea" data-action="edit-trend" data-id="${esc(t.id)}"><b>${esc(t.topic)}</b><div class="meta"><span class="cat">${esc(t.platform)}</span><span>${esc(dateFR(t.date))}</span></div>${t.note ? `<small class="muted">${esc(t.note)}</small>` : ''}<div><button class="btn sm" data-action="trend-idea" data-id="${esc(t.id)}">Ajouter aux idées</button></div></div>`).join('');
  return head('Sujets tendance', 'Note ici ce qui monte dans ta niche (ASMR, lifestyle, pop culture…), puis transforme-le en idée.', `<button class="btn" data-action="add-trend">${icon('plus')} Nouvelle tendance</button>`) +
    (cards ? `<div class="cards">${cards}</div>` : '<div class="card empty">Aucune tendance notée pour l\'instant.</div>');
}

const PAGES = { overview, platforms, bank, calendar, trends };
const NAV = [
  ['Analyse', [['overview', 'Vue d\'ensemble', 'Accueil', 'grid'], ['platforms', 'Plateformes', 'Plateformes', 'layers']]],
  ['Stratégie', [['bank', 'Banque d\'idées', 'Idées', 'bulb'], ['calendar', 'Calendrier de contenu', 'Calendrier', 'cal'], ['trends', 'Sujets tendance', 'Tendances', 'flame']]]
];

function render() {
  const nIdeas = state.items.filter(i => i.status === 'idée').length;
  document.body.classList.toggle('collapsed', sideCollapsed);
  document.body.classList.toggle('side-open', sideOpen);
  const toggleIcon = isMobile() ? 'x' : sideCollapsed ? 'chevR' : 'chevL';
  const toggleTitle = isMobile() ? 'Fermer le menu' : sideCollapsed ? 'Agrandir le menu' : 'Réduire le menu';
  $('#side').innerHTML = `<div class="brand"><div class="avatar">M</div><div class="brand-t"><b>Miahso_</b><small>ASMR &amp; lifestyle</small></div><button class="side-toggle" data-action="side-toggle" title="${toggleTitle}" aria-label="${toggleTitle}">${icon(toggleIcon)}</button></div>` +
    NAV.map(([g, list]) => `<div class="sec">${g}</div>` + list.map(([id, label, , ic]) => `<button class="nav-i ${page === id ? 'on' : ''}" data-action="nav" data-id="${id}" title="${esc(label)}">${icon(ic)}<span class="lbl">${label}</span>${id === 'bank' && nIdeas ? `<span class="badge">${nIdeas}</span>` : ''}</button>`).join('')).join('');
  $('#topbar').innerHTML = `<button data-action="menu" aria-label="Ouvrir le menu">${icon('menu')}</button><b>Miahso_</b>`;
  $('#view').innerHTML = PAGES[page]();
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
  it = it || Object.assign({ id: uid(), title: '', category: 'ASMR', accountId: '', status: 'idée', date: '', views: '', likes: '', comments: '' }, prefill || {});
  form(isNew ? 'Nouveau contenu' : 'Modifier le contenu', [
    { name: 'title', label: 'Titre / sujet', type: 'text', required: true },
    { name: 'status', label: 'Étape', type: 'select', options: STATUS.map(s => [s, s[0].toUpperCase() + s.slice(1)]) },
    { name: 'date', label: 'Date prévue ou de publication', type: 'date' },
    { name: 'accountId', label: 'Compte', type: 'select', options: accOptions() },
    { name: 'category', label: 'Type de contenu', type: 'select', options: catOptions() },
    { name: 'views', label: 'Vues (une fois publié)', type: 'number' },
    { name: 'likes', label: 'Likes', type: 'number' },
    { name: 'comments', label: 'Commentaires', type: 'number' }
  ], it, out => {
    if (out.status === 'publié' && !out.date) out.date = today();
    Object.assign(it, out);
    if (isNew) state.items.push(it);
  }, isNew ? null : () => { state.items = state.items.filter(x => x !== it); });
}

function trendForm(t) {
  const isNew = !t;
  t = t || { id: uid(), topic: '', platform: 'TikTok', note: '', date: today() };
  form(isNew ? 'Nouvelle tendance' : 'Modifier la tendance', [
    { name: 'topic', label: 'Sujet / son / format', type: 'text', required: true },
    { name: 'platform', label: 'Plateforme', type: 'select', options: TREND_PLATFORMS.map(p => [p, p]) },
    { name: 'note', label: 'Note (pourquoi ça marche, comment le reprendre)', type: 'textarea' }
  ], t, out => { Object.assign(t, out); if (isNew) state.trends.unshift(t); }, isNew ? null : () => { state.trends = state.trends.filter(x => x !== t); });
}

/* ---------- événements ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-action]');
  if (!t) return;
  const id = t.dataset.id;
  switch (t.dataset.action) {
    case 'nav': page = id; sideOpen = false; render(); window.scrollTo(0, 0); break;
    case 'menu': sideOpen = true; render(); break;
    case 'scrim': sideOpen = false; render(); break;
    case 'side-toggle':
      if (isMobile()) sideOpen = false;
      else { sideCollapsed = !sideCollapsed; try { localStorage.setItem('miahso-side', sideCollapsed ? '1' : '0'); } catch (err) { /* ignore */ } }
      render(); break;
    case 'period': period = Number(id); render(); break;
    case 'plat': platTab = id; render(); break;
    case 'calview': calView = id; render(); break;
    case 'month': monthOff += Number(id); render(); break;
    case 'edit-acc': accountForm(acc(id)); break;
    case 'add-item': itemForm(null, { status: t.dataset.status || 'idée', date: t.dataset.date || '', accountId: t.dataset.acc || '' }); break;
    case 'edit-item': itemForm(state.items.find(i => i.id === id)); break;
    case 'advance': {
      const i = state.items.find(x => x.id === id);
      i.status = STATUS[Math.min(STATUS.length - 1, STATUS.indexOf(i.status) + 1)];
      if (i.status === 'publié' && !i.date) i.date = today();
      save(); render(); break;
    }
    case 'add-trend': trendForm(); break;
    case 'edit-trend': trendForm(state.trends.find(x => x.id === id)); break;
    case 'trend-idea': {
      const tr = state.trends.find(x => x.id === id);
      state.items.push({ id: uid(), title: tr.topic, category: 'Autre', accountId: '', status: 'idée', date: '', views: '', likes: '', comments: '' });
      save(); page = 'bank'; render(); break;
    }
    case 'export': {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
      a.download = 'miahso-dashboard-' + today() + '.json';
      a.click(); break;
    }
    case 'import': $('#file').click(); break;
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
save();
render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

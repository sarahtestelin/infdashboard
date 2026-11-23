'use strict';
/* Miahso_ Dashboard — V1 (données stockées sur l'appareil, sans serveur) */
const KEY = 'miahso-dashboard-v1';
const CATS = ['ASMR', 'Lifestyle', 'Pop culture', 'Skincare / Maquillage', 'Humour', 'Autre'];
const IDEA_STATUS = ['idée', 'tournage', 'montage', 'publié'];
const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const defaults = () => ({
  accounts: [
    { id: 'tiktok', name: 'TikTok', followers: 8500, goal: 10000, weekly: 2 },
    { id: 'instagram', name: 'Instagram', followers: 230, goal: 10000, weekly: 2 },
    { id: 'yt1', name: 'YouTube · chaîne 1', followers: 800, goal: 10000, weekly: 1 },
    { id: 'yt2', name: 'YouTube · chaîne 2', followers: 45, goal: 10000, weekly: 1 }
  ],
  posts: [],
  ideas: [],
  history: []
});

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return Object.assign(defaults(), JSON.parse(raw));
  } catch (e) { /* stockage indisponible */ }
  return defaults();
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
}

let state = load();
let tab = 'home';

/* ---------- utilitaires ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Number(n || 0).toLocaleString('fr-FR');
const uid = () => Math.random().toString(36).slice(2, 9);
const iso = d => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); };
const today = () => iso(new Date());
const acc = id => state.accounts.find(a => a.id === id);
const accName = id => (acc(id) || { name: '?' }).name;
const dateFR = s => new Date(s + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
function weekBounds() {
  const d = new Date();
  const mon = new Date(d); mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  return [iso(mon), iso(sun)];
}

/* ---------- analyse ---------- */
function stats() {
  const pub = state.posts.filter(p => p.status === 'published' && Number(p.views) > 0);
  const group = keyFn => {
    const m = {};
    pub.forEach(p => {
      const k = keyFn(p);
      m[k] = m[k] || { n: 0, views: 0, eng: 0 };
      m[k].n++;
      m[k].views += Number(p.views);
      m[k].eng += (Number(p.likes || 0) + Number(p.comments || 0)) / Number(p.views);
    });
    return Object.entries(m)
      .map(([key, v]) => ({ key, n: v.n, avg: v.views / v.n, eng: v.eng / v.n * 100 }))
      .sort((a, b) => b.avg - a.avg);
  };
  return {
    n: pub.length,
    byCat: group(p => p.category),
    byDay: group(p => DAYS[new Date(p.date + 'T12:00:00').getDay()]),
    byAcc: group(p => accName(p.accountId))
  };
}
const bars = rows => {
  if (!rows.length) return '<p class="muted">Pas encore de données.</p>';
  const max = rows[0].avg || 1;
  return rows.map(r => `<div class="bar"><div class="bar-top"><span>${esc(r.key)} <small>(${r.n})</small></span><span>${fmt(Math.round(r.avg))} vues · ${r.eng.toFixed(1)} %</span></div><div class="track"><i style="width:${Math.max(4, r.avg / max * 100)}%"></i></div></div>`).join('');
};

/* ---------- vues ---------- */
function home() {
  const [a, b] = weekBounds();
  const cards = state.accounts.map((x, i) => {
    const pct = Math.min(100, x.followers / (x.goal || 1) * 100);
    const hist = state.history.filter(h => h.accountId === x.id).sort((p, q) => p.date.localeCompare(q.date));
    let delta = '';
    if (hist.length >= 2) {
      const prev = hist[hist.length - 2], g = hist[hist.length - 1].followers - prev.followers;
      delta = `<span class="delta ${g >= 0 ? 'up' : 'down'}">${g >= 0 ? '+' : ''}${fmt(g)} depuis le ${dateFR(prev.date)}</span>`;
    }
    return `<article class="card ${i % 2 ? 'pink' : ''}" data-action="edit-acc" data-id="${esc(x.id)}">
      <div class="top"><span class="name">${esc(x.name)}</span>${delta}</div>
      <div class="big">${fmt(x.followers)}</div>
      <div class="track"><i style="width:${pct.toFixed(1)}%"></i></div>
      <small>${pct.toFixed(1)} % de l'objectif (${fmt(x.goal)}) · encore ${fmt(Math.max(0, x.goal - x.followers))}</small>
    </article>`;
  }).join('');

  const rhythm = state.accounts.map(x => {
    const wk = state.posts.filter(p => p.accountId === x.id && p.date >= a && p.date <= b);
    const pub = wk.filter(p => p.status === 'published').length;
    const plan = wk.filter(p => p.status === 'planned').length;
    const t = Number(x.weekly) || 0;
    return `<div class="row"><span>${esc(x.name)}</span><span><span class="pill ${pub >= t && t > 0 ? 'ok' : ''}">${pub}/${t} publié${pub > 1 ? 's' : ''}</span>${plan ? ` <span class="pill plan">${plan} prévu${plan > 1 ? 's' : ''}</span>` : ''}</span></div>`;
  }).join('');

  return `<h2>Abonnés &amp; objectifs</h2>${cards}
    <h2>Rythme de la semaine</h2><div class="card">${rhythm}</div>
    <h2>Sauvegarde</h2>
    <div class="card"><small>Tes données sont stockées sur cet appareil. Exporte-les pour les transférer sur un autre appareil (la synchro automatique arrive en V2).</small>
    <div class="actions" style="justify-content:flex-start"><button class="ghost small" data-action="export">Exporter</button><button class="ghost small" data-action="import">Importer</button></div></div>`;
}

function calendar() {
  const t = today();
  const isUp = p => p.date >= t && p.status !== 'published';
  const up = state.posts.filter(isUp).sort((x, y) => x.date.localeCompare(y.date));
  const past = state.posts.filter(p => !isUp(p)).sort((x, y) => y.date.localeCompare(x.date));
  const item = p => `<div class="item" data-action="edit-post" data-id="${esc(p.id)}"><div><b>${esc(p.title || 'Sans titre')}</b><small>${esc(dateFR(p.date))} · ${esc(accName(p.accountId))} · ${esc(p.category)}</small></div><span class="pill ${p.status === 'published' ? 'ok' : 'plan'}">${p.status === 'published' ? (Number(p.views) ? fmt(p.views) + ' vues' : 'publié') : 'prévu'}</span></div>`;
  return `<div class="toolbar"><h2 style="margin:0">Calendrier</h2><button data-action="add-post">+ Post</button></div>
    <h2>À venir</h2>${up.map(item).join('') || '<p class="muted">Rien de prévu. Ajoute un post !</p>'}
    <h2>Passés</h2>${past.map(item).join('') || '<p class="muted">Aucun post pour l\'instant.</p>'}`;
}

function ideas() {
  const list = state.ideas.map(i => `<div class="item">
    <div data-action="edit-idea" data-id="${esc(i.id)}" style="flex:1"><b>${esc(i.text)}</b><small>${esc(i.category)}${i.accountId ? ' · ' + esc(accName(i.accountId)) : ''}</small></div>
    <div style="display:flex;gap:6px;align-items:center"><button class="ghost small" data-action="cycle-idea" data-id="${esc(i.id)}">${esc(i.status)}</button><button class="small" data-action="plan-idea" data-id="${esc(i.id)}">Planifier</button></div></div>`).join('');
  return `<div class="toolbar"><h2 style="margin:0">Banque d'idées</h2><button data-action="add-idea">+ Idée</button></div>${list || '<p class="muted">Aucune idée pour l\'instant.</p>'}`;
}

function analysis() {
  const s = stats();
  let insights = '';
  const cats = s.byCat.filter(r => r.n >= 2);
  if (cats.length >= 2) {
    insights += `<div class="insight good"><b>Ce qui marche :</b> ${esc(cats[0].key)} (${fmt(Math.round(cats[0].avg))} vues en moyenne).</div>`;
    insights += `<div class="insight"><b>À retravailler :</b> ${esc(cats[cats.length - 1].key)} (${fmt(Math.round(cats[cats.length - 1].avg))} vues en moyenne).</div>`;
  }
  const days = s.byDay.filter(r => r.n >= 2);
  if (days.length) insights += `<div class="insight good"><b>Meilleur jour pour publier :</b> ${esc(days[0].key)}.</div>`;
  if (!insights) insights = `<p class="muted">Les conseils apparaîtront quand tu auras au moins 2 posts publiés par catégorie avec leurs vues renseignées (${s.n} post${s.n > 1 ? 's' : ''} pour l'instant).</p>`;
  return `<h2>Ce qui marche</h2>${insights}
    <h2>Par type de contenu</h2><div class="card">${bars(s.byCat)}</div>
    <h2>Par jour</h2><div class="card">${bars(s.byDay)}</div>
    <h2>Par compte</h2><div class="card">${bars(s.byAcc)}</div>
    <small>Vues moyennes par post · taux d'engagement = (likes + commentaires) / vues.</small>`;
}

function render() {
  $('#view').innerHTML = ({ home, calendar, ideas, analysis })[tab]();
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
}

/* ---------- formulaires ---------- */
function fieldHtml(f, v) {
  const val = v == null ? '' : v;
  let input;
  if (f.type === 'select') {
    input = `<select name="${f.name}">${f.options.map(([ov, ol]) => `<option value="${esc(ov)}" ${String(ov) === String(val) ? 'selected' : ''}>${esc(ol)}</option>`).join('')}</select>`;
  } else {
    input = `<input name="${f.name}" type="${f.type}" value="${esc(val)}" ${f.type === 'number' ? 'inputmode="numeric" min="0"' : ''} ${f.required ? 'required' : ''}>`;
  }
  return `<label>${esc(f.label)}${input}</label>`;
}

function form(title, fields, vals, onSave, onDelete) {
  const d = $('#dlg');
  d.innerHTML = `<form id="f"><h2>${esc(title)}</h2>${fields.map(f => fieldHtml(f, vals[f.name])).join('')}<div class="actions">${onDelete ? '<button type="button" class="danger" id="del">Supprimer</button>' : ''}<button type="button" class="ghost" id="cancel">Annuler</button><button type="submit">Enregistrer</button></div></form>`;
  const f = $('#f', d);
  f.onsubmit = e => {
    e.preventDefault();
    const out = {};
    fields.forEach(fl => {
      const v = f.elements[fl.name].value;
      out[fl.name] = fl.type === 'number' ? (v === '' ? '' : Number(v)) : v.trim();
    });
    onSave(out);
    save();
    d.close();
    render();
  };
  $('#cancel', d).onclick = () => d.close();
  if (onDelete) $('#del', d).onclick = () => { if (confirm('Supprimer ?')) { onDelete(); save(); d.close(); render(); } };
  d.showModal();
}

const accOptions = (withAll) => (withAll ? [['', 'Tous les comptes']] : []).concat(state.accounts.map(a => [a.id, a.name]));
const catOptions = () => CATS.map(c => [c, c]);

function accountForm(a) {
  form('Modifier le compte', [
    { name: 'name', label: 'Nom', type: 'text', required: true },
    { name: 'followers', label: 'Abonnés actuels', type: 'number', required: true },
    { name: 'goal', label: 'Objectif d\'abonnés', type: 'number', required: true },
    { name: 'weekly', label: 'Posts visés par semaine', type: 'number' }
  ], a, out => {
    if (out.followers !== a.followers || !state.history.some(h => h.accountId === a.id)) {
      state.history.push({ date: today(), accountId: a.id, followers: out.followers });
    }
    Object.assign(a, out);
  });
}

function postForm(p, prefill, after) {
  const isNew = !p;
  p = p || Object.assign({ id: uid(), date: today(), accountId: state.accounts[0].id, title: '', category: 'ASMR', status: 'planned', views: '', likes: '', comments: '' }, prefill || {});
  form(isNew ? 'Nouveau post' : 'Modifier le post', [
    { name: 'title', label: 'Titre / sujet', type: 'text', required: true },
    { name: 'date', label: 'Date', type: 'date', required: true },
    { name: 'accountId', label: 'Compte', type: 'select', options: accOptions() },
    { name: 'category', label: 'Type de contenu', type: 'select', options: catOptions() },
    { name: 'status', label: 'Statut', type: 'select', options: [['planned', 'Prévu'], ['published', 'Publié']] },
    { name: 'views', label: 'Vues (une fois publié)', type: 'number' },
    { name: 'likes', label: 'Likes', type: 'number' },
    { name: 'comments', label: 'Commentaires', type: 'number' }
  ], p, out => {
    Object.assign(p, out);
    if (isNew) state.posts.push(p);
    if (after) after();
  }, isNew ? null : () => { state.posts = state.posts.filter(x => x !== p); });
}

function ideaForm(i) {
  const isNew = !i;
  i = i || { id: uid(), text: '', category: 'ASMR', accountId: '', status: IDEA_STATUS[0] };
  form(isNew ? 'Nouvelle idée' : 'Modifier l\'idée', [
    { name: 'text', label: 'Idée', type: 'text', required: true },
    { name: 'category', label: 'Type de contenu', type: 'select', options: catOptions() },
    { name: 'accountId', label: 'Compte visé', type: 'select', options: accOptions(true) }
  ], i, out => { Object.assign(i, out); if (isNew) state.ideas.unshift(i); },
  isNew ? null : () => { state.ideas = state.ideas.filter(x => x !== i); });
}

/* ---------- événements ---------- */
document.addEventListener('click', e => {
  const nav = e.target.closest('#tabs button');
  if (nav) { tab = nav.dataset.tab; render(); window.scrollTo(0, 0); return; }
  const t = e.target.closest('[data-action]');
  if (!t) return;
  const id = t.dataset.id;
  switch (t.dataset.action) {
    case 'edit-acc': accountForm(acc(id)); break;
    case 'add-post': postForm(); break;
    case 'edit-post': postForm(state.posts.find(p => p.id === id)); break;
    case 'add-idea': ideaForm(); break;
    case 'edit-idea': ideaForm(state.ideas.find(i => i.id === id)); break;
    case 'cycle-idea': {
      const i = state.ideas.find(x => x.id === id);
      i.status = IDEA_STATUS[(IDEA_STATUS.indexOf(i.status) + 1) % IDEA_STATUS.length];
      save(); render(); break;
    }
    case 'plan-idea': {
      const i = state.ideas.find(x => x.id === id);
      postForm(null, { title: i.text, category: i.category, accountId: i.accountId || state.accounts[0].id }, () => { i.status = 'tournage'; });
      break;
    }
    case 'export': {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
      a.download = 'miahso-dashboard-' + today() + '.json';
      a.click();
      break;
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
      if (!Array.isArray(s.accounts) || !Array.isArray(s.posts)) throw new Error('format');
      state = Object.assign(defaults(), s);
      save(); render();
    } catch (err) { alert('Fichier invalide.'); }
  };
  r.readAsText(file);
  e.target.value = '';
});

render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

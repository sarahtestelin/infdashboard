/* Miahso_ Dashboard : veille.js
   Veille concurrentielle : ce qui marche chez les autres, tendances qui reviennent, benchmark. */
(function () {
  'use strict';
  const S = { per: 30, busy: false };
  const stg = () => (state.settings = state.settings || {});
  const comp = () => (state.comp && typeof state.comp === 'object' ? state.comp : (state.comp = {}));
  const used = () => (Array.isArray(stg().compUsed) ? stg().compUsed : (stg().compUsed = []));
  const trunc = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; };
  const median = a => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const durFmt = d => { const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(d || ''); return m && ((+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0)) <= 180 ? 'short' : 'long'; };
  const ytLink = id => 'https://www.youtube.com/watch?v=' + id;

  /* ---------- récupération YouTube des créatrices suivies ---------- */
  async function compSync(manual) {
    if (S.busy) return;
    if (!stg().ytKey) { if (manual) toast('Ajoute d\'abord ta clé YouTube dans Réglages.'); return; }
    const list = state.creators.filter(c => c.ytHandle && parseYtRef(c.ytHandle));
    if (!list.length) { if (manual) toast('Ajoute la chaîne YouTube (@nom) dans la fiche d\'une créatrice (page Veille).'); return; }
    S.busy = true; if (manual) { toast('Actualisation des chaînes suivies…'); render(); }
    const errs = []; let n = 0;
    for (const c of list) {
      try {
        const ref = parseYtRef(c.ytHandle);
        const ch = await ytFetch('channels', Object.assign({ part: 'statistics,contentDetails' }, ref.id ? { id: ref.id } : { forHandle: ref.handle }));
        const it = ch.items && ch.items[0];
        if (!it) throw new Error('chaîne introuvable');
        const pl = await ytFetch('playlistItems', { part: 'contentDetails', playlistId: it.contentDetails.relatedPlaylists.uploads, maxResults: 30 });
        const ids = (pl.items || []).map(x => x.contentDetails.videoId);
        let vids = [];
        if (ids.length) {
          const r = await ytFetch('videos', { part: 'snippet,statistics,contentDetails', id: ids.join(',') });
          vids = (r.items || []).map(v => ({ id: v.id, t: trunc(v.snippet.title, 100), v: Number(v.statistics.viewCount) || 0, l: Number(v.statistics.likeCount) || 0, c: Number(v.statistics.commentCount) || 0, d: iso(new Date(v.snippet.publishedAt)), f: durFmt(v.contentDetails.duration) }));
        }
        comp()[c.id] = { at: new Date().toISOString(), subs: it.statistics.hiddenSubscriberCount ? null : Number(it.statistics.subscriberCount), vids };
        n++;
      } catch (e) { errs.push(c.name + ' : ' + e.message); }
    }
    S.busy = false; save(); render();
    toast(errs.length ? 'Veille : ' + errs[0] : `${n} chaîne${n > 1 ? 's' : ''} à jour`);
  }

  /* ---------- analyse ---------- */
  function outliers() {
    const out = [];
    state.creators.forEach(c => {
      const d = comp()[c.id]; if (!d || d.vids.length < 5) return;
      const med = median(d.vids.map(v => v.v));
      d.vids.filter(v => v.v >= 500 && med > 0 && v.v >= 2 * med).forEach(v => out.push({ id: 'yt:' + v.id, title: v.t, creator: c, platform: 'YouTube', fmt: v.f, views: v.v, ratio: v.v / med, date: v.d, link: ytLink(v.id) }));
    });
    state.inspirations.filter(i => Number(i.views) > 0).forEach(i => {
      const c = state.creators.find(x => x.id === i.creatorId) || null;
      out.push({ id: i.id, title: i.title, creator: c, platform: i.platform || (c && c.platform) || '', fmt: '', views: Number(i.views), ratio: null, date: i.date || today(), link: safeUrl(i.link), note: i.note, manual: true });
    });
    return out.sort((a, b) => b.date.localeCompare(a.date));
  }
  const inPeriod = list => { const f = S.per ? addDays(today(), -S.per) : '0000'; return list.filter(x => x.date >= f); };
  const STOP = new Set('avec dans pour mais plus tout tous cette cette ceci cela comme sans sous très tres faire fait être etre avoir elle elles nous vous leur leurs mon mes ton tes son ses une des les aux par sur que qui quoi dont the and for you your with this that from have what asmr shorts short video vidéo vidéos videos youtube tiktok instagram reel'.split(' '));
  function keywords(list) {
    const m = {};
    list.forEach(x => String(x.title || '').toLowerCase().split(/[^a-zàâäçéèêëîïôöùûüœ0-9]+/i).filter(w => w.length >= 4 && !STOP.has(w) && !/^\d+$/.test(w)).forEach(w => { m[w] = (m[w] || 0) + 1; }));
    return Object.entries(m).filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 14);
  }
  function myStats() {
    return state.accounts.filter(isYT).map(a => {
      const its = published().filter(i => i.accountId === a.id && Number(i.views) > 0).sort((x, y) => y.date.localeCompare(x.date)).slice(0, 30);
      return { name: a.name, subs: a.followers, med: median(its.map(i => Number(i.views))), best: Math.max(0, ...its.map(i => Number(i.views))), cadence: its.filter(i => i.date >= addDays(today(), -30)).length };
    }).filter(r => r.med || r.best);
  }
  function lastWatch() {
    const ds = Object.values(comp()).map(d => (d.at || '').slice(0, 10)).concat(state.inspirations.map(i => i.date || '')).filter(Boolean).sort();
    return ds.length ? ds[ds.length - 1] : '';
  }

  /* ---------- page ---------- */
  function competPage() {
    const all = outliers(), list = inPeriod(all), kw = keywords(list.concat(state.inspirations.filter(i => !Number(i.views)).map(i => ({ title: i.title })))), tracked = state.creators.filter(c => comp()[c.id]);
    const ytN = list.filter(x => x.fmt), sh = ytN.filter(x => x.fmt === 'short').length;
    const days = {}; list.forEach(x => { const d = DAY_LONG[at(x.date).getDay()]; days[d] = (days[d] || 0) + 1; });
    const topDay = Object.entries(days).sort((a, b) => b[1] - a[1])[0];
    const last = lastWatch();
    const tiles = [
      tile('t-pink', 'Créatrices suivies', 'users', fmt(state.creators.length), '', `${tracked.length} avec suivi YouTube automatique`),
      tile('t-sage', 'Posts qui cartonnent', 'flame', fmt(list.length), '', S.per ? `Sur ${S.per} jours` : 'Depuis le début'),
      tile('t-beige', 'Mot qui revient', 'star', kw[0] ? esc(kw[0][0]) : '—', '', kw[0] ? `${kw[0][1]} fois dans les titres` : 'Pas assez de données'),
      tile('t-lime', 'Dernière veille', 'check', last ? esc(rel(last)) : '—', '', last ? dateFR(last) : 'Rien noté pour l\'instant')
    ].join('');
    const perPills = `<div class="seg">${[[30, '30 jours'], [90, '90 jours'], [0, 'Tout']].map(([d, l]) => `<button data-action="cp-per" data-id="${d}" class="${S.per === d ? 'on' : ''}">${l}</button>`).join('')}</div>`;
    const row = x => {
      const done = used().includes(x.id) || (x.manual && (state.inspirations.find(i => i.id === x.id) || {}).used);
      return `<div class="ins-row"><span class="ins-ic ok">${icon('flame')}</span><div style="flex:1;min-width:0"><b>${esc(x.title)}</b><p>${x.creator ? esc(x.creator.name) + ' · ' : ''}${esc(x.platform)}${x.fmt ? ' · ' + (x.fmt === 'short' ? 'Short' : 'Vidéo longue') : ''} · ${fmt(x.views)} vues${x.ratio ? ` · <b>×${x.ratio.toFixed(1).replace('.', ',')}</b> sa médiane` : ''} · ${esc(rel(x.date))}${x.note ? '<br>' + esc(trunc(x.note, 140)) : ''}</p></div><span style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">${x.link ? `<a class="btn ghost sm" href="${esc(x.link)}" target="_blank" rel="noopener">Voir</a>` : ''}<button class="btn sm" data-action="cp-use" data-id="${esc(x.id)}" ${done ? 'disabled' : ''}>${done ? 'Repris ✓' : 'Reprendre'}</button></span></div>`;
    };
    const bench = tracked.map(c => {
      const d = comp()[c.id], v = d.vids;
      return { n: c.name, subs: d.subs, med: median(v.map(x => x.v)), best: Math.max(0, ...v.map(x => x.v)), cad: v.filter(x => x.d >= addDays(today(), -30)).length };
    });
    const mine = myStats();
    const brow = (r, me) => `<div class="trow" style="grid-template-columns:minmax(0,1fr) 70px 70px 60px 50px${me ? ';background:rgba(0,0,0,.03)' : ''}"><div><b>${esc(r.n || r.name)}${me ? ' <small class="muted">(toi)</small>' : ''}</b></div><span class="r">${r.subs == null ? '—' : fmt(r.subs)}</span><span class="r">${fmt(Math.round(r.med))}</span><span class="r">${fmt(r.best)}</span><span class="r">${r.cad || r.cadence || 0}</span></div>`;
    const benchCard = (bench.length || mine.length) ? `<section class="card"><h3>Comparaison YouTube <small class="muted" style="font:400 .8rem var(--sans)">30 dernières vidéos</small></h3>
      <div class="trow h" style="grid-template-columns:minmax(0,1fr) 70px 70px 60px 50px"><span>Chaîne</span><span class="r">Abonnés</span><span class="r">Médiane</span><span class="r">Meilleure</span><span class="r">30 j</span></div>
      ${bench.map(r => brow(r, false)).join('')}${mine.map(r => brow(r, true)).join('')}
      <small class="muted" style="display:block;margin-top:8px">Médiane = vues d'une vidéo « normale » (plus fiable que la moyenne). « 30 j » = vidéos publiées sur les 30 derniers jours.</small></section>` : '';
    const insights = [];
    if (ytN.length >= 3) insights.push(`Parmi les vidéos YouTube qui cartonnent, ${Math.round(sh / ytN.length * 100)} % sont des Shorts et ${100 - Math.round(sh / ytN.length * 100)} % des vidéos longues.`);
    if (topDay && list.length >= 4) insights.push(`Jour de publication le plus fréquent : ${topDay[0]} (${topDay[1]} posts).`);
    if (kw.length) insights.push(`Thèmes qui reviennent : ${kw.slice(0, 5).map(k => k[0]).join(', ')}.`);
    const kwCard = `<section class="card"><h3>Ce qui revient dans les contenus qui marchent</h3>${insights.length ? insights.map(t => `<p class="muted" style="margin:6px 0">${esc(t)}</p>`).join('') : '<p class="muted">Pas encore assez de données. Ajoute des créatrices avec leur chaîne YouTube et note les posts TikTok / Instagram qui cartonnent.</p>'}${kw.length ? `<div class="chips">${kw.map(([w, n]) => `<span class="chipb" style="cursor:default">${esc(w)} · ${n}</span>`).join('')}</div>` : ''}</section>`;
    return head('Veille concurrentielle', 'Ce qui marche chez les autres, pour repérer les tendances et t\'en inspirer à ta façon.',
      `<button class="btn ghost" data-action="cp-sync">${icon('up')} ${S.busy ? 'En cours…' : 'Actualiser YouTube'}</button> <button class="btn ghost" data-action="cp-prompt">Résumé pour Claude</button> <button class="btn" data-action="cp-add">${icon('plus')} Post qui cartonne</button>`) +
      `<div class="tiles">${tiles}</div><div class="bar-tools">${perPills}<button class="btn ghost sm" data-action="nav" data-id="watch">Gérer mes créatrices</button></div>` +
      `<section class="card"><h3>Ce qui cartonne en ce moment</h3>${list.slice(0, 15).map(row).join('') || '<div class="empty">Rien pour l\'instant. Pour le suivi automatique YouTube : page Veille → fiche d\'une créatrice → champ « Chaîne YouTube », puis « Actualiser YouTube ». Pour TikTok et Instagram : « Post qui cartonne » (vue + ce qui marche).</div>'}</section>` +
      kwCard + benchCard;
  }

  /* ---------- saisie manuelle (TikTok / Instagram) ---------- */
  function compForm() {
    const p = { creatorId: '', platform: 'TikTok', title: '', category: (CATS[0] || 'ASMR'), link: '', views: '', note: '' };
    form('Post qui cartonne', [
      { name: 'title', label: 'Le post (titre, idée, format)', type: 'text', required: true },
      { name: 'creatorId', label: 'Créatrice', type: 'select', options: [['', 'Autre / non listée']].concat(state.creators.map(c => [c.id, c.name])) },
      { name: 'platform', label: 'Plateforme', type: 'select', options: TREND_PLATFORMS.map(x => [x, x]) },
      { name: 'views', label: 'Vues (environ)', type: 'number' },
      { name: 'category', label: 'Type de contenu', type: 'select', options: catOptions() },
      { name: 'link', label: 'Lien (facultatif)', type: 'url' },
      { name: 'note', label: 'Pourquoi ça marche (accroche, son, format, durée…)', type: 'textarea' }
    ], p, out => { state.inspirations.unshift(Object.assign({ id: uid(), date: today(), used: false }, out)); });
  }
  function reuse(id) {
    const x = outliers().find(o => o.id === id); if (!x) return;
    const cat = x.manual ? ((state.inspirations.find(i => i.id === id) || {}).category || 'Autre') : (CATS.find(c => /asmr/i.test(c)) || CATS[0] || 'Autre');
    state.items.push({ id: uid(), title: 'Ma version : ' + trunc(x.title, 80), category: cat, accountId: '', status: 'idée', date: '', views: '', likes: '', comments: '', note: `Inspiré de ${x.creator ? x.creator.name : 'un post repéré'} (${fmt(x.views)} vues). À refaire à ma façon, sans copier.${x.link ? ' ' + x.link : ''}`, moved: today() });
    if (x.manual) { const i = state.inspirations.find(i => i.id === id); if (i) i.used = true; } else used().push(id);
    save(); render(); toast('Ajoutée à ta banque d\'idées');
  }

  /* ---------- résumé pour Claude ---------- */
  function buildPrompt() {
    const list = inPeriod(outliers()).slice(0, 15), kw = keywords(list);
    if (!list.length) return '';
    const line = x => `- « ${trunc(x.title, 90)} » · ${x.creator ? x.creator.name + ' · ' : ''}${x.platform}${x.fmt ? ' ' + (x.fmt === 'short' ? '(Short)' : '(vidéo longue)') : ''} · ${fmt(x.views)} vues${x.ratio ? ' (×' + x.ratio.toFixed(1).replace('.', ',') + ' sa médiane)' : ''}${x.note ? ' · ' + trunc(x.note, 120) : ''}`;
    const its = withViews(published().filter(i => i.date >= addDays(today(), -90))), byCat = {};
    its.forEach(i => { const k = i.category || 'Autre'; (byCat[k] = byCat[k] || []).push(i); });
    const mine = Object.entries(byCat).map(([k, v]) => `- ${k} : ${v.length} posts, ${fmt(Math.round(sumViews(v) / v.length))} vues en moyenne`).join('\n');
    return `Tu es mon assistante de veille pour Miahso_ (ASMR + lifestyle, pop culture, beauté, gaming ; ambiance cozy et un peu chaotique).
Voici ce qui marche en ce moment chez les créatrices que je suis. Analyse les tendances, puis dis-moi ce que je peux reprendre à ma façon (sans copier) et ce que je devrais éviter. Termine par 8 idées de contenus concrètes (titre, format, plateforme, pourquoi).

## Contenus qui cartonnent chez les autres
${list.map(line).join('\n')}

## Mots et thèmes qui reviennent
${kw.length ? kw.map(k => k[0] + ' (' + k[1] + ')').join(', ') : '(pas assez de données)'}

## Mes résultats sur 90 jours (types de contenu)
${mine || '(pas de données)'}`;
  }
  function copyText(txt) {
    const done = () => toast('Copié !');
    const fb = () => { const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('Copie impossible.'); } ta.remove(); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, fb); else fb();
  }

  /* ---------- branchement ---------- */
  function act(a, el) {
    const id = el.dataset.id;
    switch (a) {
      case 'cp-per': S.per = Number(id); render(); return true;
      case 'cp-sync': compSync(true); return true;
      case 'cp-add': compForm(); return true;
      case 'cp-use': reuse(id); return true;
      case 'cp-prompt': { const p = buildPrompt(); if (!p) toast('Pas encore de posts repérés : ajoute-en d\'abord.'); else { copyText(p); toast('Résumé copié : colle-le dans Claude'); } return true; }
    }
    return false;
  }
  PAGES.compet = competPage;
  NAV[2][1].unshift(['compet', 'Veille concurrentielle', 'Concurrence', 'eye']);
  const prevAction = window.extraAction;
  window.extraAction = function (a, el, id) { if (act(a, el)) return; if (prevAction) prevAction(a, el, id); };
  const prevTodos = window.todos;
  window.todos = function () {
    const base = prevTodos(), last = lastWatch();
    if (state.creators.length && (!last || daysBetween(last, today()) >= 7)) base.splice(Math.min(2, base.length), 0, { ic: 'star', t: 'Fais ta veille de la semaine', s: last ? 'Dernière veille : ' + rel(last).toLowerCase() + '.' : 'Aucune veille notée pour l\'instant.', b: 'Ouvrir', a: 'nav', id: 'compet' });
    return base.slice(0, 6);
  };
  if (typeof SAVED_PAGE !== 'undefined' && SAVED_PAGE === 'compet') { page = 'compet'; }
  render();
})();

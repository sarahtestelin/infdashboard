/* Miahso_ Dashboard : veille.js
   Veille concurrentielle : ce qui marche chez les autres, tendances qui reviennent, benchmark. */
(function () {
  'use strict';
  const S = { per: 30, busy: false, disc: null, discBusy: false, hot: null, hotBusy: false, hotFmt: '' };
  /* Créatrices de ta niche repérées sur le web (handles YouTube à vérifier : « Actualiser » signale ceux qui sont introuvables) */
  const SUGGESTED = [
    { name: 'Alteanne', platform: 'TikTok', ytHandle: '@alteanne', note: 'ASMR lifestyle française, ~3,4 M sur TikTok, 5 vidéos/semaine, objets du quotidien et produits du moment. À vérifier : handle YouTube.' },
    { name: 'ASMR Kali', platform: 'YouTube', ytHandle: '@ASMRKali', note: 'ASMR française, chuchotements et tapping, YouTube + TikTok (~880 k). À vérifier : handle.' },
    { name: 'Vanukee ASMR', platform: 'YouTube', ytHandle: '@VanukeeASMR', note: 'ASMR longue durée avec triggers originaux, rendez-vous fixes (lundi et jeudi), lives TikTok. À vérifier : handle.' },
    { name: 'Dolce Romy ASMR', platform: 'YouTube', ytHandle: '@DolceRomyASMR', note: 'Chaîne ASMR d\'une youtubeuse lifestyle / beauté : bon exemple pour mêler ASMR et lifestyle. À vérifier : handle.' },
    { name: 'Roroow', platform: 'TikTok', ytHandle: '', note: 'ASMR française centrée sommeil et confort, mélange moments lifestyle et ASMR (~150 k sur TikTok).' },
    { name: 'Paris ASMR', platform: 'YouTube', ytHandle: '@ParisASMR', note: 'Spa, massage, cosmétique en ASMR. À vérifier : handle.' },
    { name: 'Roxane ASMR', platform: 'YouTube', ytHandle: '@RoxaneASMR', note: 'Tapping, roleplay, soins. À vérifier : handle.' },
    { name: 'Rikita ASMR Français', platform: 'YouTube', ytHandle: '@RikitaASMR', note: 'ASMR française régulière. À vérifier : handle.' },
    { name: 'Voxil', platform: 'YouTube', ytHandle: '@Voxil', note: 'Angle gaming : parties commentées avec sons de clavier. À vérifier : handle.' },
    { name: 'Kori (koripeluche)', platform: 'TikTok', ytHandle: '', note: 'ASMR + gaming (Twitch / YouTube) : même mélange que toi.' },
    { name: 'noemiemtouch', platform: 'TikTok', ytHandle: '', note: 'ASMR proche du lifestyle, avec chaîne YouTube lifestyle.' },
    { name: 'Evie ASMR', platform: 'TikTok', ytHandle: '', note: 'Micro-créatrice ASMR (~42 k) : FAQ, hauls et storytimes en ASMR.' }
  ];
  const addSuggested = () => {
    const have = new Set(state.creators.map(c => (c.name || '').toLowerCase()));
    let n = 0;
    SUGGESTED.forEach(x => { if (have.has(x.name.toLowerCase())) return; state.creators.push({ id: uid(), name: x.name, platform: x.platform, link: '', ytHandle: x.ytHandle, observe: x.note }); n++; });
    save(); render(); toast(n ? `${n} créatrice${n > 1 ? 's' : ''} ajoutée${n > 1 ? 's' : ''}. Clique sur « Actualiser YouTube » pour récupérer leurs stats.` : 'Elles sont déjà toutes dans ta liste.');
  };
  async function discover(q) {
    if (!stg().ytKey) { toast('Ajoute d\'abord ta clé YouTube dans Réglages.'); return; }
    S.discBusy = true; render();
    try {
      const r = await ytFetch('search', { part: 'snippet', type: 'channel', q, maxResults: 10, regionCode: 'FR', relevanceLanguage: 'fr' });
      const ids = (r.items || []).map(x => x.snippet.channelId || (x.id || {}).channelId).filter(Boolean);
      const st = ids.length ? await ytFetch('channels', { part: 'statistics,snippet', id: ids.join(',') }) : { items: [] };
      S.disc = (st.items || []).map(c => ({ id: c.id, name: c.snippet.title, subs: c.statistics.hiddenSubscriberCount ? null : Number(c.statistics.subscriberCount), vids: Number(c.statistics.videoCount) || 0 })).sort((a, b) => (b.subs || 0) - (a.subs || 0));
    } catch (e) { toast('Recherche impossible : ' + e.message); }
    S.discBusy = false; render();
  }
  async function hotSearch(q, f) {
    if (!stg().ytKey) { toast('Ajoute d\'abord ta clé YouTube dans Réglages.'); return; }
    S.hotBusy = true; S.hotFmt = f || ''; render();
    try {
      const p = { part: 'snippet', type: 'video', q, order: 'viewCount', maxResults: 15, regionCode: 'FR', relevanceLanguage: 'fr', publishedAfter: new Date(Date.now() - 45 * 864e5).toISOString() };
      if (f === 'short') p.videoDuration = 'short';
      const r = await ytFetch('search', p);
      const ids = (r.items || []).map(x => (x.id || {}).videoId).filter(Boolean);
      const v = ids.length ? await ytFetch('videos', { part: 'snippet,statistics,contentDetails', id: ids.join(',') }) : { items: [] };
      S.hot = (v.items || []).map(x => ({ id: x.id, title: x.snippet.title, ch: x.snippet.channelTitle, chId: x.snippet.channelId, views: Number(x.statistics.viewCount) || 0, likes: Number(x.statistics.likeCount) || 0, date: (x.snippet.publishedAt || '').slice(0, 10), fmt: durFmt((x.contentDetails || {}).duration), tags: detectTags(x.snippet.title + ' ' + (x.snippet.description || '').slice(0, 300)) })).sort((a, b) => b.views - a.views);
    } catch (e) { toast('Recherche impossible : ' + e.message); }
    S.hotBusy = false; render();
  }
  const keepHot = id => {
    const x = (S.hot || []).find(h => h.id === id); if (!x) return;
    if (state.inspirations.some(i => i.link === ytLink(id))) { toast('Déjà dans ta veille.'); return; }
    const own = state.creators.find(c => (c.ytHandle || '').includes(x.chId));
    state.inspirations.unshift({ id: uid(), title: x.title, creatorId: own ? own.id : '', category: 'ASMR', platform: 'YouTube', link: ytLink(id), views: x.views, note: `${x.ch}${x.tags.length ? ' · ' + x.tags.join(', ') : ''}`, date: x.date, used: false });
    save(); render(); toast('Ajouté à ta veille.');
  };
  const hotCard = () => `<section class="card"><h3>Ce qui marche en ce moment (toutes chaînes)</h3><p class="muted">Cherche les vidéos YouTube les plus vues des 45 derniers jours sur un sujet, même chez des créatrices que tu ne suis pas. Pour TikTok et Instagram, utilise « Post qui cartonne ».</p><div class="actions" style="justify-content:flex-start"><button class="btn ghost" data-action="cp-hot" data-id="ASMR makeup roleplay">Makeup</button><button class="btn ghost" data-action="cp-hot" data-id="ASMR skincare soin visage">Skincare</button><button class="btn ghost" data-action="cp-hot" data-id="ASMR roleplay français">Roleplay</button><button class="btn ghost" data-action="cp-hot" data-id="ASMR cheveux coiffure">Coiffure</button><button class="btn ghost" data-action="cp-hot" data-id="ASMR gaming jeux vidéo">Gaming</button><button class="btn ghost" data-action="cp-hot" data-id="">Autre sujet</button></div>${S.hotBusy ? '<p class="muted">Recherche…</p>' : ''}${(S.hot || []).map(x => `<div class="ins-row"><div style="flex:1;min-width:0"><b>${esc(x.title)}</b><p>${esc(x.ch)} · ${fmt(x.views)} vues · ${x.fmt === 'short' ? 'Short' : 'Vidéo longue'} · ${esc(rel(x.date))}${x.tags.length ? ' · ' + esc(x.tags.join(', ')) : ''}</p></div><span style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end"><a class="btn ghost sm" href="${ytLink(x.id)}" target="_blank" rel="noopener">Voir</a><button class="btn sm" data-action="cp-keep" data-id="${esc(x.id)}">Garder</button></span></div>`).join('')}</section>`;
  const tagCard = () => {
    const outs = inPeriod(outliers()), m = {};
    outs.forEach(x => detectTags(x.title + ' ' + (x.note || '')).forEach(t => { m[t] = (m[t] || 0) + 1; }));
    const mine = {};
    state.items.filter(i => i.status === 'publié' && Number(i.views) > 0).forEach(i => (i.tags || []).forEach(t => { (mine[t] = mine[t] || []).push(Number(i.views)); }));
    const rows = Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 8);
    if (!rows.length) return '';
    return `<section class="card"><h3>Sous-types qui cartonnent chez les autres</h3>${rows.map(([t, n]) => { const me = mine[t]; return `<div class="trow" style="grid-template-columns:minmax(0,1fr) 90px 150px"><div><b>${esc(t)}</b></div><span class="r">${n} post${n > 1 ? 's' : ''}</span><span class="r muted">${me ? 'toi : ' + fmt(Math.round(me.reduce((a, b) => a + b, 0) / me.length)) + ' vues en moy.' : 'pas encore chez toi'}</span></div>`; }).join('')}<small class="muted" style="display:block;margin-top:8px">Les sous-types sans données chez toi sont des idées à tester.</small></section>`;
  };
  const adviceCard = () => {
    const tracked = state.creators.filter(c => comp()[c.id]);
    if (!tracked.length) return '';
    const mine = myStats(), out = [];
    const cads = tracked.map(c => comp()[c.id].vids.filter(x => x.d >= addDays(today(), -30)).length), avgCad = cads.reduce((a, b) => a + b, 0) / cads.length;
    const myCad = mine.reduce((a, r) => a + (r.cadence || 0), 0);
    if (avgCad >= 1) out.push(myCad < avgCad ? `Elles publient en moyenne ${Math.round(avgCad)} vidéos YouTube par mois, toi ${myCad} : un rythme plus régulier aide l'algorithme.` : `Ton rythme (${myCad} vidéos sur 30 jours) est au niveau des créatrices suivies (${Math.round(avgCad)}).`);
    const meds = tracked.map(c => median(comp()[c.id].vids.map(x => x.v))).filter(Boolean), myMed = mine.length ? Math.max(...mine.map(r => r.med)) : 0;
    if (meds.length && myMed) out.push(`Vues d'une vidéo « normale » : ${fmt(Math.round(median(meds)))} chez elles (médiane), ${fmt(Math.round(myMed))} chez toi.`);
    const mineTitles = state.items.map(i => (i.title || '').toLowerCase()).join(' ');
    const kw = keywords(inPeriod(outliers())).map(k => k[0]).filter(w => !mineTitles.includes(w)).slice(0, 5);
    if (kw.length) out.push(`Thèmes qui marchent chez elles et que tu n'as pas encore traités : ${kw.join(', ')}. Teste-les à ta façon.`);
    const shorts = tracked.reduce((a, c) => a + comp()[c.id].vids.filter(x => x.fmt === 'short').length, 0), tot = tracked.reduce((a, c) => a + comp()[c.id].vids.length, 0);
    if (tot >= 10) out.push(`${Math.round(shorts / tot * 100)} % de leurs vidéos récentes sont des Shorts.`);
    return out.length ? `<section class="card"><h3>Ce que ça change pour toi</h3>${out.map(t => `<p class="muted" style="margin:6px 0">${esc(t)}</p>`).join('')}</section>` : '';
  };
  const discCard = () => `<section class="card"><h3>Découvrir des chaînes</h3><p class="muted">Cherche des chaînes YouTube dans ta niche (une recherche = 100 unités de ton quota YouTube gratuit de 10 000 par jour) et ajoute celles qui t'inspirent.</p><div class="actions" style="justify-content:flex-start"><button class="btn ghost" data-action="cp-disc" data-id="ASMR français">ASMR</button><button class="btn ghost" data-action="cp-disc" data-id="ASMR lifestyle grwm français">ASMR lifestyle</button><button class="btn ghost" data-action="cp-disc" data-id="ASMR gaming français">ASMR gaming</button><button class="btn ghost" data-action="cp-disc" data-id="ASMR skincare maquillage français">ASMR beauté</button><button class="btn ghost" data-action="cp-disc" data-id="">Autre recherche</button></div>${S.discBusy ? '<p class="muted">Recherche…</p>' : ''}${(S.disc || []).map(c => `<div class="ins-row"><div style="flex:1;min-width:0"><b>${esc(c.name)}</b><p>${c.subs == null ? '—' : fmt(c.subs) + ' abonnés'} · ${fmt(c.vids)} vidéos</p></div>${state.creators.some(x => (x.ytHandle || '').includes(c.id)) ? '<span class="muted">Suivie ✓</span>' : `<button class="btn sm" data-action="cp-follow" data-id="${esc(c.id)}">Suivre</button>`}</div>`).join('')}</section>`;
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
      `<button class="btn ghost" data-action="cp-sync">${icon('up')} ${S.busy ? 'En cours…' : 'Actualiser YouTube'}</button> <button class="btn ghost" data-action="cp-prompt">Résumé pour Claude</button> <button class="btn ghost" data-action="cp-sugg">Ajouter les créatrices de ma niche</button> <button class="btn" data-action="cp-add">${icon('plus')} Post qui cartonne (n'importe qui)</button>`) +
      `<div class="tiles">${tiles}</div><div class="bar-tools">${perPills}<button class="btn ghost sm" data-action="nav" data-id="watch">Gérer mes créatrices</button></div>` +
      `<section class="card"><h3>Ce qui cartonne en ce moment</h3>${list.slice(0, 15).map(row).join('') || '<div class="empty">Rien pour l\'instant. Pour le suivi automatique YouTube : page Veille → fiche d\'une créatrice → champ « Chaîne YouTube », puis « Actualiser YouTube ». Pour TikTok et Instagram : « Post qui cartonne » (vue + ce qui marche).</div>'}</section>` +
      hotCard() + kwCard + tagCard() + adviceCard() + benchCard + discCard();
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
      case 'cp-hot': { let q = id; if (!q) q = (prompt('Quel sujet ? (ex : ASMR cozy gaming)') || '').trim(); if (q) hotSearch(q, ''); return true; }
      case 'cp-keep': keepHot(id); return true;
      case 'cp-sugg': addSuggested(); return true;
      case 'cp-disc': { let q = id; if (!q) q = (prompt('Que chercher ? (ex : ASMR cozy gaming)') || '').trim(); if (q) discover(q); return true; }
      case 'cp-follow': { const c = (S.disc || []).find(x => x.id === id); if (c) { state.creators.push({ id: uid(), name: c.name, platform: 'YouTube', link: '', ytHandle: 'https://www.youtube.com/channel/' + c.id, observe: 'Trouvée via « Découvrir des chaînes ».' }); save(); render(); toast(c.name + ' ajoutée. Clique sur « Actualiser YouTube ».'); } return true; }
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
  if (stg().catDetected !== '22' && window.detectAllCats) { const r = detectAllCats(); stg().catDetected = '22'; if (r.n) save(); }
  render();
})();

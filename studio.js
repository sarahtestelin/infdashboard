/* Miahso_ Dashboard : studio.js
   Formats gagnants, rythme de publication, studio créatif (idées + textes), collaborations. */
(function () {
  'use strict';
  const S = { fmtBy: 'tag', sig: '', rejected: null, fmtAcc: 'all', fmtPer: 90, tab: 'claude', ideas: [], gen: { topic: '', cat: '', plat: 'tiktok', out: [], itemId: '' }, copy: [], cFilter: 'active' };
  const stg = () => (state.settings = state.settings || {});
  const slots = () => (Array.isArray(stg().slots) ? stg().slots : []);
  const collabs = () => (Array.isArray(state.collabs) ? state.collabs : (state.collabs = []));
  const shuffle = a => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  const trunc = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; };
  const short = id => (acc(id) || { name: '?' }).name.replace('YouTube · ', 'YT ').replace('Vidéos longues', 'longues');
  const DAYS = [1, 2, 3, 4, 5, 6, 0];

  /* ======================  1. FORMATS GAGNANTS  ====================== */
  const DAYN = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const avgV = a => a.length ? sumViews(a) / a.length : 0;
  function adviceFor(r, overall, rows) {
    const L = [], v = r.v.slice().sort((a, b) => Number(b.views) - Number(a.views)), n = v.length;
    const q = overall ? r.avg / overall : 1;
    const k3 = Math.max(1, Math.ceil(n / 3)), top = v.slice(0, k3), bot = n >= 2 ? v.slice(-k3) : [];
    const tagsOfKey = S.fmtBy === 'tag' ? [r.k] : S.fmtBy === 'combo' ? r.k.split(' + ') : [];
    const wd = {}; v.forEach(i => { const d = at(i.date).getDay(); (wd[d] = wd[d] || []).push(i); });
    const days = Object.entries(wd).filter(([, a]) => a.length >= 1).map(([d, a]) => ({ d: +d, a: avgV(a), n: a.length })).sort((x, y) => y.a - x.a);
    if (days.length >= 2 && days[0].a > days[days.length - 1].a * 1.3) L.push(`Jour : ce contenu marche mieux le ${DAYN[days[0].d]} (${fmt(Math.round(days[0].a))} vues en moy.) que le ${DAYN[days[days.length - 1].d]} (${fmt(Math.round(days[days.length - 1].a))}).`);
    const sh = v.filter(i => itemFmt(i) === 'short'), lg = v.filter(i => itemFmt(i) === 'long');
    if (sh.length && lg.length) L.push(`YouTube : ${fmt(Math.round(avgV(sh)))} vues en moy. en Short contre ${fmt(Math.round(avgV(lg)))} en vidéo longue. Mise sur ${avgV(sh) > avgV(lg) ? 'les Shorts' : 'la vidéo longue'} pour ce contenu.`);
    const part = {}; v.forEach(i => (i.tags || []).forEach(t => { if (!tagsOfKey.includes(t)) (part[t] = part[t] || []).push(i); }));
    const pr = Object.entries(part).filter(([, a]) => a.length >= 2).map(([t, a]) => ({ t, a: avgV(a), n: a.length })).sort((x, y) => y.a - x.a);
    if (pr.length && pr[0].a > r.avg * 1.1) L.push(`Mélange : associé à « ${pr[0].t} », il monte à ${fmt(Math.round(pr[0].a))} vues (${pr[0].n} posts).`);
    const worst = pr[pr.length - 1]; if (pr.length > 1 && worst.a < r.avg * 0.85) L.push(`Mélange : avec « ${worst.t} » ça baisse à ${fmt(Math.round(worst.a))} vues : à repenser ou à éviter.`);
    const alone = v.filter(i => (i.tags || []).length <= 1);
    if (alone.length && alone.length < n && tagsOfKey.length === 1) { const mixed = v.filter(i => (i.tags || []).length > 1); if (mixed.length) L.push(`Seul : ${fmt(Math.round(avgV(alone)))} vues, mélangé à un autre sous-type : ${fmt(Math.round(avgV(mixed)))}.`); }
    if (n >= 3) {
      const len = a => a.reduce((s, i) => s + String(i.title || '').length, 0) / a.length, lt = len(top), lb = len(bot);
      if (Math.abs(lt - lb) > Math.max(8, lb * 0.25)) L.push(`Titre : tes meilleurs posts ont des titres ${lt < lb ? 'plus courts' : 'plus longs'} (~${Math.round(lt)} caractères contre ~${Math.round(lb)}).`);
      const hb = new Set(bot.flatMap(i => i.hashtags || [])), ht = [...new Set(top.flatMap(i => i.hashtags || []))].filter(h => !hb.has(h)).slice(0, 4);
      if (ht.length) L.push(`Hashtags des meilleurs posts absents des moins bons : ${ht.map(h => '#' + h).join(' ')}.`);
    }
    if (q < 0.85 && rows.length > 1 && rows[0].k !== r.k && S.fmtBy !== 'hash') L.push(`Ton format le plus fort est « ${rows[0].k} » (${fmt(Math.round(rows[0].avg))} vues) : essaie de le mélanger à celui-ci pour le relancer.`);
    if (window.compOutliers && tagsOfKey.length) {
      const ext = window.compOutliers().filter(x => tagsOfKey.every(t => detectTags(x.title + ' ' + (x.note || '')).includes(t))).sort((a, b) => b.views - a.views).slice(0, 2);
      ext.forEach(x => L.push(`Chez les autres : « ${trunc(x.title, 70)} » (${fmt(x.views)} vues${x.ratio ? ', ×' + x.ratio.toFixed(1).replace('.', ',') + ' sa médiane' : ''}) : regarde l'accroche et le rythme.`));
    }
    if (!L.length) L.push(n < 3 ? 'Pas encore assez de posts dans ce format pour trouver ce qui change : publies-en 2 ou 3 de plus en variant le jour, le titre et les hashtags.' : 'Rien de net ne ressort : teste un seul changement à la fois (jour, accroche, mélange) pour voir ce qui joue.');
    return L;
  }
  function openBox(r, overall, rows) {
    const q = overall ? r.avg / overall : 1, head2 = r.n < 2 ? 'Pistes' : q >= 1.15 ? 'Pour répéter ce succès' : q <= 0.85 ? 'Pour le repenser' : 'Pour progresser';
    const posts = r.v.slice().sort((a, b) => Number(b.views) - Number(a.views)).slice(0, 8).map(i => `<div style="margin:3px 0"><a href="#" data-action="edit-item" data-id="${esc(i.id)}" style="color:inherit"><b>${esc(trunc(i.title, 60))}</b></a> <small class="muted">${fmt(i.views)} vues · ${esc(dateFR(i.date))}${(i.tags || []).length ? ' · ' + esc(i.tags.join(' + ')) : ''}</small></div>`).join('');
    return `<div style="margin-top:8px;padding:10px;background:rgba(0,0,0,.04);border-radius:10px"><small class="muted">Posts concernés</small>${posts}<div style="margin-top:8px"><b>${head2}</b>${adviceFor(r, overall, rows).map(t => `<p class="muted" style="margin:4px 0">• ${esc(t)}</p>`).join('')}</div></div>`;
  }
  function formatsPage() {
    const from = S.fmtPer ? addDays(today(), -S.fmtPer + 1) : '0000-00-00';
    const its = published().filter(i => i.date >= from && Number(i.views) > 0 && (S.fmtAcc === 'all' || matchAcc(i, S.fmtAcc)));
    const overall = its.length ? sumViews(its) / its.length : 0;
    const m = {};
    const keysOf = i => S.fmtBy === 'tag' ? (i.tags && i.tags.length ? i.tags : ['Sans sous-type'])
      : S.fmtBy === 'combo' ? [(i.tags && i.tags.length) ? i.tags.slice().sort().join(' + ') : 'Sans sous-type']
      : S.fmtBy === 'hash' ? (i.hashtags || []).map(h => '#' + h) : [i.category || 'Autre'];
    its.forEach(i => { keysOf(i).forEach(k => { (m[k] = m[k] || []).push(i); }); });
    const rows = Object.entries(m).filter(([, v]) => S.fmtBy !== 'hash' || v.length >= 2).map(([k, v]) => ({ k, v, n: v.length, avg: sumViews(v) / v.length, eng: engagement(v), best: [...v].sort((a, b) => Number(b.views) - Number(a.views))[0] })).sort((a, b) => b.avg - a.avg);
    const max = Math.max(1, ...rows.map(r => r.avg));
    const byPills = `<div class="seg">${[['tag', 'Sous-types'], ['combo', 'Mélanges'], ['hash', '#Hashtags'], ['cat', 'Types']].map(([k, l]) => `<button data-action="f-by" data-id="${k}" class="${S.fmtBy === k ? 'on' : ''}">${l}</button>`).join('')}</div>`;
    const accPills = `<div class="seg"><button data-action="f-acc" data-id="all" class="${S.fmtAcc === 'all' ? 'on' : ''}">Toutes</button>${viewAccs().map(x => `<button data-action="f-acc" data-id="${esc(x.id)}" class="${S.fmtAcc === x.id ? 'on' : ''}"><span class="dot" style="--c:${x.color}"></span>${esc(short(x.id))}</button>`).join('')}</div>`;
    const perPills = `<div class="seg">${[[30, '30 jours'], [90, '90 jours'], [365, '1 an'], [0, 'Tout']].map(([d, l]) => `<button data-action="f-per" data-id="${d}" class="${S.fmtPer === d ? 'on' : ''}">${l}</button>`).join('')}</div>`;
    const verdict = r => {
      if (r.n < 2 || !overall) return '<span class="pill">Trop peu de posts</span>';
      const q = r.avg / overall;
      return q >= 1.15 ? '<span class="pill ok">Marche bien</span>' : q <= 0.85 ? '<span class="pill plan">À repenser</span>' : '<span class="pill">Dans la moyenne</span>';
    };
    const list = rows.map(r => `<div class="vsplit" style="cursor:pointer" data-action="f-open" data-id="${esc(r.k)}"><div class="vs-h"><span><b>${esc(r.k)}</b> <small class="muted">${r.n} post${r.n > 1 ? 's' : ''}</small></span><span><b>${fmt(Math.round(r.avg))}</b> <small class="muted">vues / post</small></span></div>
      <div class="vs-bar"><i style="width:${r.avg / max * 100}%;background:var(--forest)"></i></div>
      <small class="muted">${r.eng != null ? r.eng.toFixed(1).replace('.', ',') + ' % d\'engagement · ' : ''}${verdict(r)}${r.best ? ` · meilleur : <a href="#" data-action="edit-item" data-id="${esc(r.best.id)}" style="color:inherit">${esc(trunc(r.best.title, 46))}</a> (${fmt(r.best.views)})` : ''}</small>${S.fmtOpen === r.k ? openBox(r, overall, rows) : `<small class="muted" style="display:block;margin-top:4px">Touche pour voir les posts et les conseils</small>`}</div>`).join('');
    let tip = '';
    if (rows.length >= 2 && overall) {
      const w = rows[0], l = rows[rows.length - 1];
      tip = `<p class="muted">Ton format gagnant : <b>${esc(w.k)}</b>, ${fmt(Math.round(w.avg))} vues en moyenne${w.n >= 2 ? `, soit ${Math.round((w.avg / overall - 1) * 100)} % de plus que ta moyenne (${fmt(Math.round(overall))})` : ''}.${l.n >= 2 && l.avg < overall * 0.85 ? ` À repenser : <b>${esc(l.k)}</b>.` : ''}</p>`;
    }
    return head('Formats gagnants', 'Quels types de contenu (ASMR, GRWM, avis, vlog…) marchent le mieux, plateforme par plateforme.', '') +
      `<div class="bar-tools">${byPills}${accPills}${perPills}</div>` +
      `<section class="card"><h3>Classement par ${({ tag: 'sous-type', combo: 'mélange de sous-types', hash: 'hashtag', cat: 'type' })[S.fmtBy] || 'type'}</h3>${tip}${list || '<div class="empty">Aucun post publié avec des vues sur cette période. Importe tes stats ou change la période.</div>'}
      <small class="muted" style="display:block;margin-top:10px">Un post peut avoir plusieurs sous-types (ex : Makeup + Roleplay) : il compte dans chacun. Ils se règlent dans chaque post ou se détectent dans Réglages. Tu peux modifier la liste dans Objectifs &amp; comptes.</small></section>`;
  }

  /* ======================  2. RYTHME DE PUBLICATION  ====================== */
  function slotDate(s) { return addDays(mondayOf(today()), (Number(s.day) + 6) % 7); }
  function slotInfo(s) {
    const d = slotDate(s);
    const it = state.items.find(i => matchAcc(i, s.accId) && i.date === d && i.status !== 'idée' && (!s.cat || i.category === s.cat));
    const st = it ? (it.status === 'publié' ? 'done' : 'plan') : d < today() ? 'late' : d === today() ? 'today' : 'soon';
    return { d, it, st };
  }
  const slotLabel = s => `${short(s.accId)}${s.cat ? ' · ' + s.cat : ''}`;
  function rhythmPage() {
    const sl = slots(), infos = sl.map(s => ({ s, i: slotInfo(s) }));
    const done = infos.filter(x => x.i.st === 'done').length, late = infos.filter(x => x.i.st === 'late').length;
    const days = dayAverages(periodItems(90, 0));
    const bestD = days.reduce((b, x) => x.avg > b.avg ? x : b, days[0]);
    const tiles = [
      tile('t-pink', 'Créneaux par semaine', 'cal', fmt(sl.length), '', 'Ton rythme idéal'),
      tile('t-sage', 'Publiés cette semaine', 'check', `${done}/${sl.length}`, '', 'Créneaux tenus'),
      tile('t-beige', 'En retard', 'x', fmt(late), '', late ? 'À rattraper' : 'Tout est à jour'),
      tile('t-lime', 'Meilleur jour (90 j)', 'eye', bestD && bestD.avg ? DAY_LONG[bestD.d] : '—', '', 'Vues moyennes les plus hautes')
    ].join('');
    const pill = x => x.st === 'done' ? '<span class="pill ok">Publié ✓</span>' : x.st === 'plan' ? '<span class="pill plan">Planifié</span>' : x.st === 'late' ? '<span class="pill" style="background:#f6d9d9;color:#8a2f2f">En retard</span>' : x.st === 'today' ? '<span class="pill plan">Aujourd\'hui</span>' : '<span class="pill">À venir</span>';
    const week = DAYS.map(d => {
      const mine = infos.filter(x => Number(x.s.day) === d);
      return `<div class="row" style="align-items:flex-start;gap:12px"><span style="min-width:84px;text-transform:capitalize"><b>${DAY_LONG[d]}</b></span><span style="flex:1;display:flex;flex-direction:column;gap:6px">${mine.map(x => `<span style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><span>${accDot(x.s.accId)} ${esc(slotLabel(x.s))}</span><span>${pill(x.i)} ${x.i.st === 'late' || x.i.st === 'today' || x.i.st === 'soon' ? `<button class="btn sm" data-action="slot-plan" data-id="${esc(x.s.id)}">Planifier</button>` : ''} <button class="btn ghost sm" data-action="slot-del" data-id="${esc(x.s.id)}" title="Supprimer ce créneau">×</button></span></span>`).join('') || '<small class="muted">Jour off</small>'}</span></div>`;
    }).join('');
    return head('Rythme de publication', 'Fixe tes jours de publication par plateforme et par format. L\'app te prévient quand tu prends du retard.', `<button class="btn" data-action="slot-add">${icon('plus')} Ajouter un créneau</button>`) +
      `<div class="tiles">${tiles}</div>
      <section class="card"><h3>Ma semaine type</h3>${sl.length ? '' : '<p class="muted">Exemple : mardi · YT chaîne 1 · Shorts, vendredi · YT chaîne 1 · longues, samedi · TikTok. Ajoute tes créneaux avec le bouton en haut.</p>'}${week}</section>`;
  }
  function slotForm() {
    const accs = viewAccs();
    form('Nouveau créneau', [
      { name: 'day', label: 'Jour', type: 'select', options: DAYS.map(d => [String(d), DAY_LONG[d][0].toUpperCase() + DAY_LONG[d].slice(1)]) },
      { name: 'accId', label: 'Plateforme / format', type: 'select', options: accs.map(a => [a.id, a.name]) },
      { name: 'cat', label: 'Type de contenu (facultatif)', type: 'select', options: [['', 'Peu importe']].concat(CATS.map(c => [c, c])) }
    ], { day: '2', accId: accs[0].id, cat: '' }, out => {
      stg().slots = slots().concat([{ id: uid(), day: Number(out.day), accId: out.accId, cat: out.cat }]);
    });
  }
  function slotTodos() {
    const out = [];
    slots().map(s => ({ s, i: slotInfo(s) })).filter(x => x.i.st === 'late' || x.i.st === 'today').slice(0, 2).forEach(x => {
      out.push({ ic: 'cal', t: x.i.st === 'late' ? `En retard : ${slotLabel(x.s)} (${DAY_LONG[x.s.day]})` : `Aujourd'hui : ${slotLabel(x.s)}`, s: x.i.st === 'late' ? 'Rien de planifié pour ce créneau : rattrape-le ou déplace-le.' : 'Rien n\'est encore planifié pour aujourd\'hui.', b: 'Planifier', a: 'slot-plan', id: x.s.id });
    });
    return out;
  }

  /* ======================  3. STUDIO CRÉATIF  ====================== */
  const POOLS = {
    asmr: ['ASMR chuchoté : je te raconte ma semaine', 'ASMR tapping sur 10 objets de ma chambre', 'ASMR « je prends soin de toi » (roleplay réconfort)', 'ASMR sons de pages : je feuillette mes livres préférés', 'ASMR clavier et souris, pour travailler ou s\'endormir', 'ASMR rangement de ma collection (unboxing)', 'ASMR lumière tamisée et pluie : s\'endormir en 10 minutes', 'ASMR des triggers que vous m\'avez demandés'],
    beauty: ['GRWM ASMR : je me prépare en chuchotant', 'Routine soin du soir en ASMR (sons de produits)', 'Maquillage ASMR : tapping sur mes pinceaux', 'Je teste un produit viral en ASMR + avis honnête', 'Routine cheveux en ASMR : brossage, huiles, sons de brosse', 'Skincare ASMR : de la peau fatiguée à la peau reposée', 'Mes favoris du mois (beauté) en ASMR', 'Unboxing beauté ASMR (sons de packaging)'],
    pop: ['Avis chuchoté sur le dernier film que j\'ai vu (sans spoil)', 'Je classe mes séries du moment, version ASMR', 'Recommandation film ou livre cozy pour ce soir', 'Résumé de saison en chuchotant', 'Mes personnages préférés expliqués tout doucement', 'Chef-d\'œuvre ou navet ? Avis ASMR'],
    gaming: ['Je joue à un jeu cozy en chuchotant', 'Gaming ASMR : sons de manette et de clavier', 'Première heure sur un nouveau jeu, en mode ASMR', 'Je te raconte l\'histoire d\'un jeu en chuchotant'],
    life: ['Vlog d\'une journée cozy à la maison', 'Ma routine du soir pour bien dormir', 'Ce que je mange en une journée (version ASMR)', 'Je range mon bureau en ASMR', 'Ma routine matinale tout en douceur', 'Vlog chaotique : j\'essaie vos recommandations', 'Mes petits plaisirs cozy du moment'],
    fun: ['Ce que les gens pensent de l\'ASMR vs la réalité', 'Les 5 types de personnes qui regardent de l\'ASMR', 'POV : tu essaies de ne pas rire pendant un ASMR', 'Je réponds à vos commentaires en ASMR'],
    gen: ['Q&R : je réponds à vos questions en chuchotant', 'Ce que vous m\'avez le plus demandé ce mois-ci', 'Mon setup et mon matériel ASMR expliqués', 'Je réagis à mon tout premier ASMR']
  };
  const TWISTS = ['en version Short (moins de 60 s)', 'en version longue (1 h pour dormir)', 'sans parler, sons uniquement', 'en mode GRWM', 'avec les triggers que vous préférez', 'dans un autre décor (lit, bureau, salle de bain)', 'en chuchotant du début à la fin'];
  function poolFor(cat) {
    const c = String(cat || '').toLowerCase();
    if (/asmr/.test(c)) return POOLS.asmr;
    if (/skin|maquill|beaut|soin|cheveu|capill|grwm/.test(c)) return POOLS.beauty;
    if (/pop|film|s[ée]rie|avis|livre|culture/.test(c)) return POOLS.pop;
    if (/jeu|game|gaming/.test(c)) return POOLS.gaming;
    if (/life|vlog|routine/.test(c)) return POOLS.life;
    if (/humo|fun/.test(c)) return POOLS.fun;
    return POOLS.gen;
  }
  function bestAccFor(cat) {
    const m = {};
    withViews(published().filter(i => i.category === cat)).forEach(i => { (m[i.accountId] = m[i.accountId] || []).push(Number(i.views)); });
    const e = Object.entries(m).sort((a, b) => b[1].reduce((x, y) => x + y, 0) / b[1].length - a[1].reduce((x, y) => x + y, 0) / a[1].length)[0];
    return e ? e[0] : '';
  }
  const PLAT_LABEL = { tiktok: 'TikTok', instagram: 'Instagram (Reel)', ytshort: 'YouTube Short', ytlong: 'YouTube vidéo longue' };
  const rejected = () => (Array.isArray(stg().ideasRejected) ? stg().ideasRejected : (stg().ideasRejected = []));
  const norm = t => String(t || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const taken = () => new Set(state.items.filter(i => i.status === 'idée').map(i => norm(i.title)).concat(rejected().map(norm)));
  function platFor(accountId, title) {
    const a = acc(accountId), n = a ? a.name.toLowerCase() : '';
    if (/short/i.test(title)) return 'ytshort';
    if (/longue|1 h/i.test(title)) return 'ytlong';
    if (/instagram/.test(n)) return 'instagram';
    if (/youtube/.test(n)) return 'ytshort';
    return 'tiktok';
  }
  function bestDayName() {
    const d = dayAverages(periodItems(90, 0)), b = d.reduce((m, x) => x.avg > m.avg ? x : m, d[0]);
    return b && b.avg ? DAY_LONG[b.d] : '';
  }
  function ideaStats() {
    const all = withViews(published()), byCat = {};
    all.forEach(i => { const k = i.category || 'Autre'; (byCat[k] = byCat[k] || []).push(i); });
    const cats = Object.entries(byCat).filter(([, v]) => v.length >= 2).map(([k, v]) => ({ k, avg: sumViews(v) / v.length })).sort((a, b) => b.avg - a.avg);
    return { all, favs: cats.length ? cats.slice(0, 3) : CATS.filter(c => c !== 'Autre').map(k => ({ k, avg: 0 })) };
  }
  function newIdea(ex, st, kind) {
    st = st || ideaStats();
    let x = null;
    const remix = kind === 'remix' || (kind == null && st.all.length && Math.random() < 0.4);
    if (remix && st.all.length) {
      const tops = shuffle([...st.all].sort((a, b) => Number(b.views) - Number(a.views)).slice(0, 8));
      for (const it of tops) {
        const title = trunc(it.title, 60) + ' · ' + shuffle(TWISTS)[0];
        if (!ex.has(norm(title))) { x = { title, category: it.category || 'Autre', accountId: it.accountId, why: `Remix de « ${trunc(it.title, 38)} », ${fmt(it.views)} vues.` }; break; }
      }
    }
    if (!x) {
      for (const f of shuffle(st.favs)) {
        const cand = shuffle(poolFor(f.k).concat(POOLS.gen)).find(t => !ex.has(norm(t)));
        if (cand) { x = { title: cand, category: f.k, accountId: bestAccFor(f.k), why: f.avg ? `Ta catégorie « ${f.k} » fait ${fmt(Math.round(f.avg))} vues en moyenne.` : `Une piste pour ta catégorie « ${f.k} ».` }; break; }
      }
    }
    if (!x) return null;
    ex.add(norm(x.title));
    x.plat = platFor(x.accountId, x.title);
    x.blocks = makeTexts(x.title, x.category, x.plat);
    return x;
  }
  function genIdeas() {
    const ex = taken(), st = ideaStats(), out = [];
    S.ideas.forEach(x => ex.add(norm(x.title)));
    S.ideas = [];
    for (let n = 0; n < 6; n++) { const x = newIdea(ex, st, n < 3 ? 'pool' : 'remix'); if (x) out.push(x); }
    S.ideas = out; S.sig = sigNow();
  }
  const sigNow = () => { const p = published(); return p.length + ':' + sumViews(withViews(p)) + ':' + state.items.filter(i => i.status === 'idée').length; };
  function refreshIdeas() {
    const ex = taken();
    const keep = S.ideas.filter(x => !ex.has(norm(x.title)) || x.fresh);
    if (!S.ideas.length || sigNow().split(':').slice(0, 2).join() !== (S.sig || '').split(':').slice(0, 2).join()) { S.ideas = []; genIdeas(); return; }
    const st = ideaStats(), seen = new Set([...ex, ...keep.map(x => norm(x.title))]);
    while (keep.length < 6) { const x = newIdea(seen, st); if (!x) break; keep.push(x); }
    S.ideas = keep; S.sig = sigNow();
  }
  const TAGS = {
    base: ['#asmr', '#asmrfrance', '#asmrfrancais', '#relaxation', '#cozy', '#cozyvibes', '#asmrsleep', '#chuchotement'],
    beauty: ['#grwm', '#skincare', '#skincareroutine', '#maquillage', '#routinesoin', '#beautetok', '#makeuptok'],
    pop: ['#avisfilm', '#filmtok', '#seriestok', '#booktok', '#recommandation', '#cinema'],
    gaming: ['#gaming', '#gamer', '#gamingasmr', '#cozygames', '#jeuxvideo'],
    life: ['#vlog', '#vlogfrance', '#dayinmylife', '#routine', '#lifestyle', '#slowliving'],
    fun: ['#humour', '#pov', '#relatable', '#drole']
  };
  function tagsFor(cat, n, plat) {
    const c = String(cat || '').toLowerCase();
    const extra = /skin|maquill|beaut|soin|cheveu|grwm/.test(c) ? TAGS.beauty : /pop|film|s[ée]rie|avis|livre|culture/.test(c) ? TAGS.pop : /jeu|game/.test(c) ? TAGS.gaming : /life|vlog|routine/.test(c) ? TAGS.life : /humo/.test(c) ? TAGS.fun : [];
    const must = plat === 'tiktok' ? ['#asmr', '#pourtoi'] : ['#asmr'];
    const rest = shuffle(TAGS.base.filter(t => !must.includes(t)).concat(extra));
    return must.concat(rest).slice(0, n);
  }
  function makeTexts(topic, cat, plat) {
    const T = String(topic || '').trim(), t = T.charAt(0).toLowerCase() + T.slice(1), U = T.charAt(0).toUpperCase() + T.slice(1);
    const cta = shuffle(['Dis-moi en commentaire ce que tu veux voir ensuite 💬', 'Abonne-toi si ça t\'a détendue ☁️', 'Enregistre pour ce soir avant de dormir 🌙', 'Partage à quelqu\'un qui a besoin de se détendre 🤍']);
    const day = bestDayName(), out = [];
    const hooks = {
      tiktok: [`POV : ${t} 🎧`, `${U} mais en ASMR ☁️`, `Tu vas t'endormir avant la fin (${t})`, `ASMR : ${t} 🤍`],
      instagram: [`${U} ☾ ASMR pour se détendre`, `Un petit moment cozy : ${t}`, `${U}, version ASMR 🤍`],
      ytshort: [`${U} ASMR`, `ASMR ${t} (très relaxant)`, `${U} 🎧 ASMR`],
      ytlong: [`${U} | ASMR français pour se détendre`, `ASMR ${t} : relaxation & sommeil`, `${U} (ASMR doux, sans musique)`]
    };
    const hs = shuffle(hooks[plat]).slice(0, 3);
    if (plat === 'ytshort' || plat === 'ytlong') out.push({ label: 'Titres (choisis-en un)', text: hs.map(h => trunc(h, 70)).join('\n') });
    else out.push({ label: 'Accroches (texte à l\'écran / début de description)', text: hs.join('\n') });
    if (plat === 'tiktok') out.push({ label: 'Description TikTok', text: `${hs[0]}\n\nASMR ${t} en français 🎧 ${cta[0]}\n\n${tagsFor(cat, 5, 'tiktok').join(' ')}` });
    if (plat === 'instagram') out.push({ label: 'Légende Instagram', text: `${hs[0]}\n\nASMR ${t} en français : installe-toi, mets ton casque et laisse-toi porter. ${cta[0]}\n\nCollabs : lien en bio ✉️\n.\n.\n${tagsFor(cat, 8, 'instagram').join(' ')}` });
    if (plat === 'ytshort') out.push({ label: 'Description YouTube Short', text: `${U} 🎧 ASMR en français\n\n${cta[0]}\n\n${tagsFor(cat, 3, 'yt').join(' ')} #shorts` });
    if (plat === 'ytlong') out.push({ label: 'Description YouTube', text: `${U} : un ASMR français doux pour te détendre, te concentrer ou t'endormir. 🎧 Casque conseillé.\n\n⏱️ Chapitres :\n00:00 Introduction\n00:30 ...\n\n${cta[0]}\n\n📩 Collaborations : lien en bio\n\n${tagsFor(cat, 3, 'yt').join(' ')}` }, { label: 'Tags YouTube (champ « Tags »)', text: tagsFor(cat, 8, 'yt').map(x => x.slice(1)).join(', ') });
    const tips = { tiktok: 'Écris le mot-clé principal à l\'écran dès la 1re seconde et dis-le à l\'oral. 3 à 5 hashtags suffisent. Réponds aux premiers commentaires dans l\'heure.', instagram: 'Mets l\'accroche dans les 125 premiers caractères (le reste est replié). 5 à 8 hashtags. Partage le Reel en story pour lancer la diffusion.', ytshort: 'Mot-clé principal au début du titre. Reste sous 60 secondes et fais en sorte que la fin ramène au début (boucle) : ça pousse le replay.', ytlong: 'Mot-clé principal au début du titre et dans les 2 premières lignes de la description. Miniature lisible avec 3 mots maximum. Ajoute des chapitres.' };
    out.push({ label: 'Conseils pour la visibilité', text: tips[plat] + (day ? `\nD'après tes stats, ton meilleur jour pour publier est le ${day}.` : '') });
    return out;
  }
  const notesFrom = (plat, blocks) => `[${PLAT_LABEL[plat]}]\n` + blocks.map(b => `${b.label} :\n${b.text}`).join('\n\n');
  function genTexts() {
    const g = S.gen;
    if (!g.topic.trim()) { toast('Écris d\'abord ton idée.'); return; }
    g.out = makeTexts(g.topic, g.cat, g.plat); S.copy = g.out.map(o => o.text);
  }
  function buildPrompt() {
    const P = 90, its = withViews(periodItems(P, 0));
    const lab = i => { const a = acc(i.accountId); return (a ? a.name : 'Compte ?') + (a && splitOn(a) ? ' (' + FMT_LABEL[itemFmt(i)] + ')' : ''); };
    const line = i => { const e = engagement([i]); return `- « ${trunc(i.title, 80)} » · ${lab(i)} · ${i.category || 'Autre'} · ${fmt(i.views)} vues${e != null ? ' · ' + e.toFixed(1).replace('.', ',') + ' % d\'engagement' : ''}`; };
    const byCat = {}; its.forEach(i => { const k = i.category || 'Autre'; (byCat[k] = byCat[k] || []).push(i); });
    const cats = Object.entries(byCat).map(([k, v]) => `- ${k} : ${v.length} post${v.length > 1 ? 's' : ''}, ${fmt(Math.round(sumViews(v) / v.length))} vues en moyenne`).join('\n');
    const plats = viewAccs().map(a => { const v = its.filter(i => matchAcc(i, a.id)); return v.length ? `- ${a.name} : ${v.length} post${v.length > 1 ? 's' : ''}, ${fmt(Math.round(sumViews(v) / v.length))} vues en moyenne` : ''; }).filter(Boolean).join('\n');
    const sorted = [...its].sort((a, b) => Number(b.views) - Number(a.views));
    const days = dayAverages(its), bestD = days.reduce((b, x) => x.avg > b.avg ? x : b, days[0]);
    const bank = state.items.filter(i => i.status === 'idée').map(i => '- ' + trunc(i.title, 80)).slice(0, 25).join('\n');
    if (!its.length) return '';
    return `Tu es mon assistante de création de contenu pour Miahso_ (ASMR + lifestyle, pop culture, beauté, gaming ; ambiance cozy et un peu chaotique ; TikTok, Instagram, 2 chaînes YouTube).
Voici mes statistiques des ${P} derniers jours. Propose-moi 10 idées de contenus originales, basées sur ce qui marche vraiment chez moi.

Pour chaque idée, réponds avec ce format : **Titre accrocheur** / Plateforme et format conseillés (TikTok, Reel, Short, vidéo longue) / Pourquoi ça devrait marcher d'après mes chiffres / **Description prête à publier**, optimisée pour la visibilité (mot-clé recherché dès la première ligne, accroche, appel à l'action) / 5 hashtags (mélange larges et de niche) / Idée de miniature ou de texte à l'écran / Meilleur moment pour publier. Ne répète pas mes posts existants ni mes idées déjà en banque. Mélange des idées sûres (dans la lignée de mes meilleurs posts) et 2 ou 3 idées plus risquées pour tester de nouveaux formats.

## Mes types de contenu (vues moyennes)
${cats}

## Par plateforme / format
${plats}

## Mes ${Math.min(8, sorted.length)} meilleurs posts
${sorted.slice(0, 8).map(line).join('\n')}

## Mes ${Math.min(5, Math.max(0, sorted.length - 8))} posts les moins vus
${sorted.length > 8 ? sorted.slice(Math.max(8, sorted.length - 5)).reverse().map(line).join('\n') : '(pas assez de posts)'}

## Meilleur jour pour publier
${bestD && bestD.avg ? DAY_LONG[bestD.d] + ' (' + fmt(Math.round(bestD.avg)) + ' vues en moyenne)' : 'pas assez de données'}

## Mes idées déjà en banque (à ne pas répéter)
${bank || '(aucune)'}`;
  }
  function studioPage() {
    const tab = `<div class="bar-tools"><div class="seg">${[['claude', 'Idées sur mesure (avec Claude)'], ['ideas', 'Idées rapides'], ['texts', 'Ajouter une idée']].map(([v, l]) => `<button data-action="st-tab" data-id="${v}" class="${S.tab === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>`;
    let body = '';
    if (S.tab === 'claude') {
      const p = buildPrompt();
      body = `<section class="card"><h3>Idées sur mesure, d'après tes vrais chiffres</h3>
        <p class="muted">L'app prépare un résumé de ce qui marche chez toi (meilleurs et moins bons posts, types de contenu, plateformes, meilleur jour, idées déjà en banque). Tu le colles dans Claude, qui te propose 10 idées adaptées à tes résultats.</p>
        ${p ? `<ol class="muted"><li>Clique sur <b>Copier mon résumé</b>.</li><li>Ouvre Claude (dans ton projet Miahso_) et colle-le.</li><li>Recopie les idées qui te plaisent dans ta banque d'idées.</li></ol>
        <div class="actions" style="justify-content:flex-start"><button class="btn" data-action="st-copyprompt">${icon('up')} Copier mon résumé</button><a class="btn ghost" href="https://claude.ai/new" target="_blank" rel="noopener">Ouvrir Claude</a></div>
        <details class="howto"><summary>Voir ce qui sera copié</summary><div class="gen">${esc(p)}</div></details>` : '<div class="empty">Pas encore de posts publiés avec des vues sur 90 jours. Synchronise YouTube ou importe tes CSV, puis reviens ici.</div>'}</section>`;
    } else if (S.tab === 'ideas') {
      refreshIdeas();
      body = `<section class="card"><h3>Idées pour toi <small class="muted" style="font:400 .8rem var(--sans)">d'après tes meilleurs posts</small></h3>
        <p class="muted">Pistes tirées de tes stats (catégories qui marchent, remix de tes meilleurs posts). La liste se met à jour toute seule quand tes chiffres changent ou quand tu ajoutes une idée à ta banque. Chaque idée vient avec un titre, une description et des hashtags optimisés pour la visibilité.</p>
        ${S.ideas.map((x, k) => `<div class="ins-row" style="flex-wrap:wrap"><span class="ins-ic ok">${icon('bulb')}</span><div style="flex:1;min-width:200px"><b>${esc(x.title)}</b><p>${esc(x.why)} · ${esc(x.category)} · ${esc(PLAT_LABEL[x.plat])}</p>
          <details class="howto"><summary>Titre, description et hashtags proposés</summary>${x.blocks.map(b => `<small class="muted">${esc(b.label)}</small><div class="gen">${esc(b.text)}</div>`).join('')}</details></div>
          <span style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn sm" data-action="st-add" data-id="${k}">Ajouter à la banque</button><button class="btn ghost sm" data-action="st-drop" data-id="${k}" title="Cette idée ne m'intéresse pas">Abandonner</button></span></div>`).join('') || '<div class="empty">Plus d\'idées à proposer pour l\'instant. Clique sur « Nouvelles idées ».</div>'}
        <div class="actions" style="justify-content:flex-start;margin-top:10px"><button class="btn ghost" data-action="st-regen">${icon('up')} Nouvelles idées</button></div></section>`;
    } else {
      const g = S.gen, bank = state.items.filter(i => i.status === 'idée').slice(0, 8);
      body = `<section class="card"><h3>Ajouter une idée</h3>
        <p class="muted">Note ton idée : l'app prépare un titre, une description et des hashtags optimisés, puis l'enregistre dans ta banque d'idées.</p>
        ${bank.length ? `<p class="muted">Ou complète une idée déjà en banque :</p><div class="chips">${bank.map(i => `<button class="chipb" data-action="st-pick" data-id="${esc(i.id)}">${esc(trunc(i.title, 40))}</button>`).join('')}</div>` : ''}
        <label>Mon idée<input id="st-topic" type="text" placeholder="ex. routine soin du soir" value="${esc(g.topic)}"></label>
        <label>Type de contenu<select id="st-cat">${CATS.map(c => `<option ${c === g.cat ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
        <label>Plateforme<select id="st-plat">${Object.entries(PLAT_LABEL).map(([v, l]) => `<option value="${v}" ${v === g.plat ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <div class="actions" style="justify-content:flex-start"><button class="btn ghost" data-action="st-gen">Préparer titre, description et hashtags</button><button class="btn" data-action="st-addgen">${g.itemId ? 'Enregistrer dans cette idée' : 'Ajouter à la banque d\'idées'}</button></div></section>
        ${g.out.map((o, k) => `<section class="card"><h3>${esc(o.label)}</h3><div class="gen">${esc(o.text)}</div><div class="actions" style="justify-content:flex-start"><button class="btn ghost sm" data-action="st-copy" data-id="${k}">Copier</button><button class="btn ghost sm" data-action="st-gen">Autre version</button></div></section>`).join('')}`;
    }
    return head('Studio créatif', 'Des idées et des textes prêts à copier, à partir de tes stats. Sans IA : des modèles que tu peux retoucher.', '') + tab + body;
  }
  function readGen() {
    const v = id => { const e = document.getElementById(id); return e ? e.value : null; };
    if (v('st-topic') !== null) S.gen.topic = v('st-topic');
    if (v('st-cat') !== null) S.gen.cat = v('st-cat');
    if (v('st-plat') !== null) S.gen.plat = v('st-plat');
  }

  /* ======================  4. COLLABORATIONS  ====================== */
  const CSTAT = ['prospect', 'contacté', 'négociation', 'signé', 'tourné', 'publié', 'payé', 'refusé'];
  const CACTIVE = ['contacté', 'négociation', 'signé', 'tourné'];
  const eur = n => fmt(Math.round(Number(n) || 0)) + ' €';
  function collabsPage() {
    const all = collabs(), yr = today().slice(0, 4);
    const sum = f => all.filter(f).reduce((s, c) => s + (Number(c.fee) || 0), 0);
    const tiles = [
      tile('t-pink', 'En cours', 'users', fmt(all.filter(c => CACTIVE.includes(c.status)).length), '', 'Contactées, négociées, signées'),
      tile('t-sage', 'À encaisser', 'up', eur(sum(c => ['signé', 'tourné', 'publié'].includes(c.status))), '', 'Signées, pas encore payées'),
      tile('t-beige', 'Encaissé ' + yr, 'check', eur(sum(c => c.status === 'payé' && String(c.moved || '').startsWith(yr))), '', 'Collaborations payées cette année'),
      tile('t-lime', 'Prospects', 'star', fmt(all.filter(c => c.status === 'prospect').length), '', 'Marques à contacter')
    ].join('');
    const flt = { active: c => !['payé', 'refusé'].includes(c.status), done: c => c.status === 'payé', all: () => true };
    const list = all.filter(flt[S.cFilter] || flt.all).sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
    const row = c => `<div class="trow" style="grid-template-columns:minmax(0,1fr) auto" data-action="c-edit" data-id="${esc(c.id)}"><div><b>${esc(c.brand)}</b><small>${c.date ? esc(dateFR(c.date)) + ' · ' : ''}${esc(c.platforms || 'Plateforme à préciser')}${c.fee ? ' · ' + eur(c.fee) : ''}</small></div><span><span class="pill ${c.status === 'payé' ? 'ok' : c.status === 'refusé' ? '' : 'plan'}">${esc(c.status)}</span>${!['payé', 'refusé'].includes(c.status) ? ` <button class="adv" data-action="c-adv" data-id="${esc(c.id)}" title="Étape suivante">→</button>` : ''}</span></div>`;
    return head('Collaborations', 'Marques, échéances, statut et tarif : tout au même endroit.', `<button class="btn" data-action="c-add">${icon('plus')} Nouvelle collaboration</button>`) +
      `<div class="tiles">${tiles}</div><div class="bar-tools"><div class="seg">${[['active', 'En cours'], ['done', 'Payées'], ['all', 'Toutes']].map(([v, l]) => `<button data-action="c-flt" data-id="${v}" class="${S.cFilter === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>` +
      `<section class="card">${list.map(row).join('') || '<div class="empty">Aucune collaboration ici. Ajoute une marque qui t\'intéresse (statut « prospect ») ou une collab en cours.</div>'}</section>`;
  }
  function collabForm(c) {
    const isNew = !c;
    c = c || { id: uid(), brand: '', status: 'prospect', date: '', fee: '', platforms: '', contact: '', note: '', moved: today() };
    const before = c.status;
    form(isNew ? 'Nouvelle collaboration' : 'Modifier la collaboration', [
      { name: 'brand', label: 'Marque', type: 'text', required: true },
      { name: 'status', label: 'Statut', type: 'select', options: CSTAT.map(s => [s, s[0].toUpperCase() + s.slice(1)]) },
      { name: 'date', label: 'Échéance ou date de publication', type: 'date' },
      { name: 'fee', label: 'Tarif (€)', type: 'number' },
      { name: 'platforms', label: 'Plateformes / livrables (ex. 1 Reel + 3 stories)', type: 'text' },
      { name: 'contact', label: 'Contact (nom, e-mail)', type: 'text' },
      { name: 'note', label: 'Notes', type: 'textarea' }
    ], c, out => {
      if (out.status !== before) c.moved = today();
      Object.assign(c, out);
      if (isNew) collabs().push(c);
    }, isNew ? null : () => { state.collabs = collabs().filter(x => x !== c); });
  }
  function collabTodos() {
    const out = [], t = today();
    collabs().forEach(c => {
      if (['signé', 'tourné'].includes(c.status) && c.date && daysBetween(t, c.date) <= 3) {
        out.push({ ic: 'users', t: daysBetween(t, c.date) < 0 ? `Collab en retard : ${c.brand}` : `Échéance proche : ${c.brand}`, s: `${dateFR(c.date)} · statut « ${c.status} ».`, b: 'Ouvrir', a: 'c-edit', id: c.id });
      } else if (c.status === 'publié' && c.moved && daysBetween(c.moved, t) >= 7) {
        out.push({ ic: 'users', t: `Paiement à relancer : ${c.brand}`, s: `Publiée depuis ${daysBetween(c.moved, t)} jours, pas encore payée.`, b: 'Ouvrir', a: 'c-edit', id: c.id });
      }
    });
    return out.slice(0, 2);
  }

  /* ======================  ACTIONS  ====================== */
  function copyText(txt) {
    const done = () => toast('Copié !');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, () => fallback());
    else fallback();
    function fallback() { const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('Copie impossible : sélectionne le texte à la main.'); } ta.remove(); }
  }
  function act(a, el) {
    const id = el.dataset.id;
    switch (a) {
      case 'f-by': S.fmtBy = id; S.fmtOpen = ''; render(); return true;
      case 'f-open': S.fmtOpen = S.fmtOpen === id ? '' : id; render(); return true;
      case 'f-acc': S.fmtAcc = id; render(); return true;
      case 'f-per': S.fmtPer = Number(id); render(); return true;
      case 'slot-add': slotForm(); return true;
      case 'slot-del': stg().slots = slots().filter(s => s.id !== id); save(); render(); return true;
      case 'slot-plan': {
        const s = slots().find(x => x.id === id); if (!s) return true;
        const base = String(s.accId).split(':'), d = slotDate(s);
        itemForm(null, { status: 'planifié', date: d < today() ? today() : d, accountId: base[0], fmt: base[1] || '', category: s.cat || (CATS[0] || 'ASMR') });
        return true;
      }
      case 'st-tab': readGen(); S.tab = id; render(); return true;
      case 'st-regen': genIdeas(); render(); return true;
      case 'st-add': {
        const x = S.ideas[Number(id)]; if (!x) return true;
        state.items.push({ id: uid(), title: x.title, category: x.category, accountId: x.accountId || '', status: 'idée', date: '', views: '', likes: '', comments: '', note: x.why + '\n\n' + notesFrom(x.plat, x.blocks), moved: today() });
        S.ideas.splice(Number(id), 1); save(); refreshIdeas(); render(); toast('Ajoutée à ta banque d\'idées'); return true;
      }
      case 'st-drop': {
        const x = S.ideas[Number(id)]; if (!x) return true;
        rejected().push(x.title); if (rejected().length > 300) stg().ideasRejected = rejected().slice(-300);
        S.ideas.splice(Number(id), 1); save(); refreshIdeas(); render(); toast('Idée abandonnée : elle ne reviendra plus'); return true;
      }
      case 'st-pick': { const it = state.items.find(i => i.id === id); if (it) { readGen(); S.gen.topic = it.title; S.gen.cat = it.category || ''; S.gen.itemId = it.id; S.gen.out = []; render(); } return true; }
      case 'st-gen': readGen(); genTexts(); render(); return true;
      case 'st-addgen': {
        readGen(); const g = S.gen;
        if (!g.topic.trim()) { toast('Écris d\'abord ton idée.'); return true; }
        if (!g.out.length) genTexts();
        const note = notesFrom(g.plat, g.out);
        const it = g.itemId && state.items.find(i => i.id === g.itemId);
        if (it) it.note = (it.note ? it.note + '\n\n' : '') + note;
        else state.items.push({ id: uid(), title: g.topic.trim(), category: g.cat || CATS[0] || 'Autre', accountId: g.plat === 'tiktok' ? 'tiktok' : g.plat === 'instagram' ? 'instagram' : '', status: 'idée', date: '', views: '', likes: '', comments: '', note, moved: today() });
        S.gen = { topic: '', cat: g.cat, plat: g.plat, out: [], itemId: '' }; save(); render(); toast(it ? 'Idée complétée' : 'Ajoutée à ta banque d\'idées'); return true;
      }
      case 'st-copyprompt': copyText(buildPrompt()); return true;
      case 'st-copy': copyText(S.copy[Number(id)] || ''); return true;
      case 'c-add': collabForm(); return true;
      case 'c-edit': collabForm(collabs().find(c => c.id === id)); return true;
      case 'c-flt': S.cFilter = id; render(); return true;
      case 'c-adv': {
        const c = collabs().find(x => x.id === id); if (!c) return true;
        const k = CSTAT.indexOf(c.status), nx = CSTAT.slice(k + 1).find(s => s !== 'refusé');
        if (nx) { c.status = nx; c.moved = today(); save(); render(); toast(c.brand + ' : ' + nx); }
        return true;
      }
    }
    return false;
  }

  /* ======================  BRANCHEMENT  ====================== */
  PAGES.formats = formatsPage; PAGES.rhythm = rhythmPage; PAGES.studio = studioPage; PAGES.collabs = collabsPage;
  NAV[0][1].push(['formats', 'Formats gagnants', 'Formats', 'layers']);
  NAV[1][1].push(['rhythm', 'Rythme de publication', 'Rythme', 'cal'], ['studio', 'Studio créatif', 'Studio', 'flame'], ['collabs', 'Collaborations', 'Collabs', 'users']);
  const prevAction = window.extraAction;
  window.extraAction = function (a, el, id) { if (act(a, el)) return; if (prevAction) prevAction(a, el, id); };
  const prevTodos = window.todos;
  window.todos = function () { return slotTodos().concat(collabTodos()).slice(0, 3).concat(prevTodos()).slice(0, 6); };
  if (typeof SAVED_PAGE !== 'undefined' && SAVED_PAGE && PAGES[SAVED_PAGE] && page !== SAVED_PAGE) { page = SAVED_PAGE; }
  render();
})();

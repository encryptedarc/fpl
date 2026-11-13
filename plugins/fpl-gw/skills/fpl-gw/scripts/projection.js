// xPts projection (est.). Model and caveats: references/projection.md
// usage: node projection.js [--gw 10 | --gws 11-13] [--xi "Raya,Konsa,..."] [--bench "Dubravka,Hall,Sangaré,Egan"]
//        [--captain Isak] [--vice Haaland] [--extra "Jackson:AVL"] [--if-starts "Isak,Haaland"] [--minutes "Konsa:60"]
//        [--players "Name:CLUB,..."] [--sims 20000] [--workspace <dir>] [--cache <dir>]
// --sims needs --xi and simulates one score distribution per GW (auto-subs from --bench order, vice if C plays 0′)
const F = require('./lib/fpl');

const GOAL = { 1: 10, 2: 6, 3: 5, 4: 4 };
const CS = { 1: 4, 2: 4, 3: 1, 4: 0 };
const DC_T = { 2: 10, 3: 12, 4: 12 };
const MIN_POS = { 1: 1, 2: 3, 3: 2, 4: 1 };
const HOME_ADV = 0.08;
const fact = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880];
const pois = (l, k) => (Math.exp(-l) * l ** k) / fact[k];
const rpois = (l) => { let k = 0, p = 1; const L = Math.exp(-l); do { k++; p *= Math.random(); } while (p > L); return k - 1; };

(async () => {
  const args = F.parseArgs(process.argv);
  const c = F.ctx(args);
  const list = (k) => (args[k] ? String(args[k]).split(',').map((s) => s.trim()).filter(Boolean) : []);
  const specs = args.players ? list('players') : args.xi ? [...list('xi'), ...list('bench')] : F.readSquad(c, true);
  if (!specs.length && !list('extra').length) throw new Error('Supply --players "Name:CLUB,..." or --xi "..." [--bench "..."] for Quick mode, or --workspace <dir> with a populated Squad.md');
  const bs = await F.bootstrap(c);
  const fx = await F.fixturesAll(c);
  const { T } = F.teamMaps(bs);
  let gws;
  if (args.gws) { const [a, b] = String(args.gws).split('-').map(Number); gws = Array.from({ length: (b || a) - a + 1 }, (_, i) => a + i); }
  else gws = [args.gw ? +args.gw : F.nextEvent(bs).id];
  const { ts, avg } = await F.teamXG(c, bs, fx);
  const squad = [...new Map(specs.map((s) => { const p = F.findPlayer(bs, s); return [p.id, p]; })).values()];
  const extra = [...new Map(list('extra').map((s) => { const p = F.findPlayer(bs, s); return [p.id, p]; })).values()].filter(p => !squad.some(s => s.id === p.id));
  const need = (n) => F.findPlayer({ ...bs, elements: [...squad, ...extra] }, n);
  const xiP = list('xi').map((n) => need(n));
  const xi = new Set(xiP.map((p) => p.id));
  const benchP = list('bench').map((n) => need(n));
  const cap = args.captain && need(args.captain), vice = args.vice && need(args.vice);
  const ifStarts = new Set([...list('if-starts').map((n) => need(n)), cap, vice, ...extra].filter(Boolean).map((p) => p.id));
  const minOv = Object.fromEntries(list('minutes').map((s) => {
    const split = s.lastIndexOf(':');
    const value = s.slice(split + 1).trim(), minutes = Number(value);
    if (split < 1 || !value || !Number.isFinite(minutes) || minutes < 0 || minutes > 90) {
      throw new Error('--minutes requires Name:0-90 or Name:CLUB:0-90');
    }
    return [need(s.slice(0, split)).id, minutes];
  }));
  const sims = +(args.sims || 0);
  if (sims && !xi.size) throw new Error('--sims needs --xi');
  for (const gw of gws) {
    const doubles = [...squad, ...extra].filter(p => F.teamFixtures(fx, p.team, gw).length > 1);
    if (doubles.length) throw new Error(`DGW not supported in GW${gw}: ${doubles.map(p => p.web_name).join(', ')}. No forecast generated; select a single-fixture GW or remove these players.`);
  }

  // GW under way: played fixtures use the real (provisional) live points instead of a projection
  const liveByGw = {};
  for (const gw of gws) {
    const ev = bs.events.find((e) => e.id === gw);
    if (ev && (ev.is_current || ev.finished)) liveByGw[gw] = Object.fromEntries((await F.live(c, gw, ev.finished)).elements.map((e) => [e.id, e.stats]));
  }

  function project(p, es, gw, forceStart) {
    const pos = p.element_type, t = p.team;
    const fs = F.teamFixtures(fx, t, gw);
    if (!fs.length) return { blank: true };
    const f = fs[0];
    const home = f.team_h === t, o = home ? f.team_a : f.team_h;
    const st = F.isDone(f) && liveByGw[gw] && liveByGw[gw][p.id];
    if (st) return { opp: (home ? `${T[o]}(H)` : `${T[o].toLowerCase()}(A)`) + ' ✔actual', t, fid: f.id, pos, fixed: true, em: st.minutes, mins: [st.minutes], x: st.total_points, eG: st.goals_scored, eA: st.assists, pcs: st.clean_sheets ? 1 : 0, lF: NaN, lA: NaN, dcRate: 0 };
    const hist = F.playedHistory(es, fx).filter((h) => h.round < gw);
    const tF = ts[t].f / ts[t].p, oA = ts[o].a / ts[o].p, oF = ts[o].f / ts[o].p, tA = ts[t].a / ts[t].p;
    const lF = (tF * oA) / avg * (home ? 1 + HOME_ADV : 1 - HOME_ADV);
    const lA = (oF * tA) / avg * (home ? 1 - HOME_ADV : 1 + HOME_ADV);
    const h5 = hist.slice(-5);
    let mins = h5.map((h) => h.minutes);
    if (forceStart) { const st = mins.filter((m) => m >= 45); mins = st.length ? st : [85]; }
    if (minOv[p.id] !== undefined) mins = [minOv[p.id]];
    const em = mins.reduce((a, b) => a + b, 0) / Math.max(1, mins.length);
    const pp = mins.filter((m) => m > 0).length / Math.max(1, mins.length);
    const p60 = mins.filter((m) => m >= 60).length / Math.max(1, mins.length);
    const ratio = lF / tF;
    const r90 = (v) => (p.minutes ? (parseFloat(v) / p.minutes) * 90 : 0);
    const g90 = r90(p.expected_goals) * ratio, a90 = r90(p.expected_assists) * ratio;
    const m = em / 90, eG = g90 * m, eA = a90 * m;
    const pcs = Math.exp(-lA);
    let egc = 0; for (let k = 2; k < fact.length; k++) egc += Math.floor(k / 2) * pois(lA, k);
    const played = hist.filter((h) => h.minutes > 0);
    const dcRate = pos > 1 && played.length ? played.filter((h) => h.defensive_contribution >= DC_T[pos]).length / played.length : 0;
    const sv90 = pos === 1 && p.minutes ? (p.saves / p.minutes) * 90 : 0;
    const b90 = p.minutes ? (p.bonus / p.minutes) * 90 : 0;
    const parts = {
      app: pp + p60, goal: eG * GOAL[pos], assist: eA * 3, cs: pcs * p60 * CS[pos],
      gc: pos <= 2 ? -egc * m : 0, saves: Math.max(0, sv90 * m / 3 - 0.33), dc: 2 * dcRate * p60, bonus: b90 * m,
    };
    const x = Object.values(parts).reduce((a, b) => a + b, 0);
    return { opp: home ? `${T[o]}(H)` : `${T[o].toLowerCase()}(A)`, t, fid: f.id, pos, em, pp, lF, lA, pcs, eG, eA, dcRate, x, mins, g90, a90, sv90, b90 };
  }

  // one simulated GW score for the XI: shared goals conceded per team, auto-subs by bench order, vice fallback
  function simulate(R) {
    const conceded = {}, pts = {}, played = {};
    for (const id of [...xi, ...benchP.map((p) => p.id)]) {
      const r = R[id]; if (!r || r.blank) { pts[id] = 0; played[id] = false; continue; }
      if (r.fixed) { played[id] = r.em > 0; pts[id] = r.x; continue; }
      const mn = r.mins[Math.floor(Math.random() * r.mins.length)];
      played[id] = mn > 0;
      if (!mn) { pts[id] = 0; continue; }
      const key = r.fid + ':' + r.t;
      if (conceded[key] === undefined) conceded[key] = rpois(r.lA);
      const share = mn / 90, ga = Math.round(conceded[key] * share);
      let s = mn >= 60 ? 2 : 1;
      s += rpois(r.g90 * share) * GOAL[r.pos] + rpois(r.a90 * share) * 3;
      if (mn >= 60 && conceded[key] === 0) s += CS[r.pos];
      if (r.pos <= 2) s -= Math.floor(ga / 2);
      if (r.pos === 1) s += Math.floor(rpois(r.sv90 * share) / 3);
      if (mn >= 60 && Math.random() < r.dcRate) s += 2;
      s += r.b90 * share;
      pts[id] = s;
    }
    // FPL auto-sub: bench in order, GK only for GK, the 11 after the swap must keep min 1 GK/3 DEF/2 MID/1 FWD
    const lineup = [...xi];
    const posOf = (id) => squad.concat(extra).find((p) => p.id === id).element_type;
    const used = new Set();
    for (const id of [...xi].filter((id) => !played[id])) {
      for (const b of benchP) {
        if (used.has(b.id) || !played[b.id]) continue;
        if ((posOf(id) === 1) !== (b.element_type === 1)) continue;
        const next = lineup.map((x) => (x === id ? b.id : x));
        const cnt = {}; next.forEach((x) => (cnt[posOf(x)] = (cnt[posOf(x)] || 0) + 1));
        if (Object.entries(MIN_POS).some(([pos, min]) => (cnt[pos] || 0) < min)) continue;
        lineup.splice(lineup.indexOf(id), 1, b.id); used.add(b.id); break;
      }
    }
    let total = lineup.reduce((a, id) => a + (pts[id] || 0), 0);
    if (cap && played[cap.id]) total += pts[cap.id];
    else if (vice && played[vice.id]) total += pts[vice.id];
    return total;
  }

  console.log(`# GW${gws.join('–')} projection (est.) — FPL API bootstrap-static/ + fixtures/ + element-summary/ + event/{gw}/live/ — generated ${F.fmtUTC()}; data timestamps below`);
  console.log(`model: λ = team xGF × opp xGA ÷ league avg ${avg.toFixed(2)} (±${HOME_ADV * 100}% H/A) · minutes = last-5 · CS Poisson · DefCon hit-rate · bonus/90 · no cards`);
  const sumX = {}; const summary = [];
  for (const gw of gws) {
    console.log(`\n## GW${gw}\n| role | player | vs | min | λF | λA | CS% | xG | xA | DC% | xPts | if starts |`);
    console.log('|---|---|---|---|---|---|---|---|---|---|---|---|');
    let total = 0; const R = {}, RS = {};
    for (const p of [...squad, ...extra]) {
      const es = await F.summary(c, p.id);
      const r = project(p, es, gw, false);
      R[p.id] = r;
      if (r.blank) { console.log(`| | ${p.web_name} | BLANK | | | | | | | | 0 | |`); continue; }
      const rs = ifStarts.has(p.id) && !r.fixed ? project(p, es, gw, true) : null;
      RS[p.id] = rs;
      sumX[p.id] = (sumX[p.id] || 0) + r.x;
      const role = extra.includes(p) ? 'target' : xi.size ? (xi.has(p.id) ? 'XI' : 'bench') : 'squad';
      const mult = cap && p.id === cap.id ? 2 : 1;
      if (role === 'XI') total += r.x * mult;
      const tag = (cap && p.id === cap.id ? ' (C)' : '') + (vice && p.id === vice.id ? ' (V)' : '');
      if (r.fixed) { console.log(`| ${role} | ${p.web_name}${tag} | ${r.opp} | ${r.em} | — | — | — | G${r.eG} | A${r.eA} | — | **${r.x}**${mult > 1 ? ` ×2 = ${r.x * 2}` : ''} (actual) | |`); continue; }
      console.log(`| ${role} | ${p.web_name}${tag} | ${r.opp} | ${r.em.toFixed(0)} | ${r.lF.toFixed(2)} | ${r.lA.toFixed(2)} | ${(r.pcs * 100).toFixed(0)} | ${r.eG.toFixed(2)} | ${r.eA.toFixed(2)} | ${(r.dcRate * 100).toFixed(0)} | ${r.x.toFixed(1)}${mult > 1 ? ` ×2 = ${(r.x * 2).toFixed(1)}` : ''} | ${rs ? rs.x.toFixed(1) + ` (${rs.em.toFixed(0)}′)` : ''} |`);
    }
    if (xi.size) {
      let line = `XI total ≈ ${total.toFixed(1)}${xi.size !== 11 ? ` ⚠️ XI has ${xi.size} players` : ''}`;
      if (cap && vice && R[cap.id] && R[vice.id] && !R[cap.id].blank && !R[vice.id].blank) {
        line += ` · if C ${vice.web_name} instead ≈ ${(total - R[cap.id].x + R[vice.id].x).toFixed(1)}`;
        if (RS[cap.id]) line += ` · C edge if ${cap.web_name} starts: ${(RS[cap.id].x - R[vice.id].x).toFixed(1)}`;
      }
      console.log(line);
      if (sims) {
        const s = Array.from({ length: sims }, () => simulate(R)).sort((a, b) => a - b);
        const q = (p) => s[Math.floor(p * (s.length - 1))].toFixed(0);
        const mean = s.reduce((a, b) => a + b, 0) / s.length;
        console.log(`Monte Carlo ${sims} runs (est.): mean ${mean.toFixed(1)} · median ${q(0.5)} · p10–p90 ${q(0.1)}–${q(0.9)}${benchP.length ? '' : ' · ⚠️ no --bench, auto-subs off'}`);
      }
      summary.push(total);
    }
  }
  if (gws.length > 1) {
    console.log(`\n## Sum GW${gws[0]}–${gws[gws.length - 1]} (est.)`);
    for (const p of [...squad, ...extra]) if (sumX[p.id] !== undefined) console.log(`${extra.includes(p) ? 'target' : xi.has(p.id) ? 'XI' : 'squad'} | ${p.web_name} | ${sumX[p.id].toFixed(1)}`);
    if (summary.length) console.log(`XI total per GW: ${summary.map((x) => x.toFixed(1)).join(' / ')}`);
  }
  console.log(F.dataSources(c));
})().catch((e) => { console.error(e.message); process.exit(1); });

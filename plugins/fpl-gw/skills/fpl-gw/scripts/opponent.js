// Team form from FPL data: last-N results with team xG for/against, home/away split, league xGA rank.
// usage: node opponent.js --teams NFO,CRY,SUN [--last 5] [--cache <dir>]
const F = require('./lib/fpl');

(async () => {
  const args = F.parseArgs(process.argv);
  if (!args.teams) throw new Error('--teams NFO,CRY required');
  const c = F.ctx(args);
  const bs = await F.bootstrap(c);
  const fx = await F.fixturesAll(c);
  const { T, ID } = F.teamMaps(bs);
  const last = +(args.last || 5);
  const { ts, avg } = await F.teamXG(c, bs, fx);
  console.log(`source: FPL API fixtures/ + event/{gw}/live/ — fetched ${F.fmtUTC()} · team xG = sum of player expected_goals (no own goals) · league avg xG/team/game ${avg.toFixed(2)}`);
  const sum = (rs, k) => rs.reduce((a, r) => a + r[k], 0);
  const wdl = (rs) => `${rs.filter((r) => r.gf > r.ga).length}-${rs.filter((r) => r.gf === r.ga).length}-${rs.filter((r) => r.gf < r.ga).length}`;
  for (const code of args.teams.split(',').map((s) => s.trim().toUpperCase())) {
    const s = ts[ID[code]];
    if (!s) { console.log(`\n${code}: unknown team code`); continue; }
    const rs = s.rows.slice(-last);
    console.log(`\n## ${code} — season P${s.p} GF ${s.gf} GA ${s.ga} xGF ${s.f.toFixed(1)} xGA ${s.a.toFixed(1)} CS ${s.rows.filter((r) => r.ga === 0).length}`);
    rs.forEach((r) => console.log(`GW${r.gw} ${r.h ? 'H' : 'A'} v ${T[r.opp]} ${r.gf}-${r.ga} ${r.gf > r.ga ? 'W' : r.gf < r.ga ? 'L' : 'D'} | xG ${r.xgf.toFixed(2)}-${r.xga.toFixed(2)}`));
    console.log(`L${last}: ${wdl(rs)} · GF ${sum(rs, 'gf')} GA ${sum(rs, 'ga')} · xGF ${sum(rs, 'xgf').toFixed(2)} xGA ${sum(rs, 'xga').toFixed(2)} · CS ${rs.filter((r) => r.ga === 0).length}`);
    for (const [lab, h] of [['Home', true], ['Away', false]]) {
      const v = s.rows.filter((r) => r.h === h);
      console.log(`${lab}: P${v.length} GF ${sum(v, 'gf')} GA ${sum(v, 'ga')} xGF ${sum(v, 'xgf').toFixed(2)} xGA ${sum(v, 'xga').toFixed(2)} CS ${v.filter((r) => r.ga === 0).length}`);
    }
  }
  const rank = (k) => Object.entries(ts).sort((a, b) => b[1][k] / b[1].p - a[1][k] / a[1].p).map(([id, v], i) => `${i + 1}.${T[id]} ${(v[k] / v.p).toFixed(2)}`).join(' ');
  console.log(`\nxGA/game rank (worst first): ${rank('a')}`);
  console.log(`xGF/game rank (best first): ${rank('f')}`);
})().catch((e) => { console.error(e.message); process.exit(1); });

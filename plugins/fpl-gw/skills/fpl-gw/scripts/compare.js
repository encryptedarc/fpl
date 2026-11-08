// Standard transfer/captain comparison table: season rates, last-5 history, next-6 ticker.
// usage: node compare.js --players "Isak:LIV,N.Jackson:AVL,Wissa:NEW" [--n 6] [--from <GW>] [--cache <dir>]
// --from defaults to the next GW whose deadline hasn't passed, so a GW already under way is left out of the ticker
const F = require('./lib/fpl');

(async () => {
  const args = F.parseArgs(process.argv);
  if (!args.players) throw new Error('--players "Name:CLUB,..." required');
  const c = F.ctx(args);
  const bs = await F.bootstrap(c);
  const fx = await F.fixturesAll(c);
  const { T } = F.teamMaps(bs);
  const n = +(args.n || 6);
  const from = +(args.from || F.nextEvent(bs).id);
  console.log(`source: FPL API bootstrap-static/ + element-summary/{id}/ — fetched ${F.fmtUTC()} · ticker from GW${from}`);
  console.log('\n| metric | ' + args.players.split(',').map((s) => s.trim()).join(' | ') + ' |');
  const ps = [];
  for (const s of args.players.split(',')) {
    const p = F.findPlayer(bs, s);
    const es = await F.summary(c, p.id);
    const per90 = (v) => (p.minutes ? (parseFloat(v) / p.minutes) * 90 : 0);
    es.history = F.playedHistory(es, fx);
    const last3 = es.history.slice(-3).map((h) => (+h.expected_goal_involvements).toFixed(2)).join(' / ');
    const next = es.fixtures.filter((f) => f.event >= from).slice(0, n);
    const tick = next.map((f) => `${f.is_home ? T[f.team_a] + '(H)' : T[f.team_h].toLowerCase() + '(A)'}${f.difficulty}`).join(' ');
    const sum = next.reduce((a, f) => a + f.difficulty, 0);
    ps.push({ p, es, per90, last3, tick, sum });
  }
  const row = (label, fn) => console.log(`| ${label} | ${ps.map(fn).join(' | ')} |`);
  console.log('|---|' + ps.map(() => '---').join('|') + '|');
  row('id · pos · club', (x) => `${x.p.id} · ${F.POS[x.p.element_type]} · ${T[x.p.team]}`);
  row('£ · sel%', (x) => `${(x.p.now_cost / 10).toFixed(1)} · ${x.p.selected_by_percent}`);
  row('status', (x) => `${x.p.status}${x.p.news ? ' — ' + x.p.news : ''}`);
  row('starts · min', (x) => `${x.p.starts} · ${x.p.minutes}`);
  row('G (xG)', (x) => `${x.p.goals_scored} (${x.p.expected_goals})`);
  row('A (xA)', (x) => `${x.p.assists} (${x.p.expected_assists})`);
  // compare G+A with xGI so assist over-performance is caught too
  row('G+A vs xGI', (x) => {
    const d = x.p.goals_scored + x.p.assists - parseFloat(x.p.expected_goal_involvements);
    return `${x.p.goals_scored + x.p.assists} vs ${x.p.expected_goal_involvements} (${d >= 0 ? '+' : ''}${d.toFixed(1)})${d >= 2 ? ' ⚠️ over' : d <= -2 ? ' ⚠️ under' : ''}`;
  });
  row('xG/90 · xGI/90', (x) => `${x.per90(x.p.expected_goals).toFixed(2)} · ${x.per90(x.p.expected_goal_involvements).toFixed(2)}`);
  row('pts · pts/90', (x) => `${x.p.total_points} · ${x.per90(x.p.total_points).toFixed(2)}`);
  row('bonus · DC', (x) => `${x.p.bonus} · ${x.p.defensive_contribution}`);
  row('pen order', (x) => x.p.penalties_order ?? '-');
  row('xGI last 3', (x) => x.last3);
  row(`ticker next ${n} (sum)`, (x) => `${x.tick} (**${x.sum}**)`);

  console.log('\n## Last 5 per player');
  for (const x of ps) {
    console.log(`${x.p.web_name}: ` + x.es.history.slice(-5).map((h) => `GW${h.round} ${h.was_home ? 'H' : 'A'}-${T[h.opponent_team]} ${h.minutes}' ${h.total_points}p G${h.goals_scored} A${h.assists} xGI ${h.expected_goal_involvements}`).join(' | '));
  }
})().catch((e) => { console.error(e.message); process.exit(1); });

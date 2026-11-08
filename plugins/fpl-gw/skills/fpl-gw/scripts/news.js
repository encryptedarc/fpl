// Deadline countdown, GW fixtures and status/news for the squad (+ extra players).
// usage: node news.js [--gw 10] [--players "Isak:LIV,Saliba:ARS"] [--vault <FPL dir>] [--cache <dir>] [--fresh]
const F = require('./lib/fpl');

(async () => {
  const args = F.parseArgs(process.argv);
  const c = F.ctx(args);
  const bs = await F.bootstrap(c);
  const { T } = F.teamMaps(bs);
  const ev = args.gw ? bs.events.find((e) => e.id === +args.gw) : F.nextEvent(bs);
  const left = (new Date(ev.deadline_time) - Date.now()) / 60000;
  console.log(`# GW${ev.id} deadline ${ev.deadline_time} (${F.thTime(ev.deadline_time)}) · now ${F.fmtUTC()} · ${left <= 0 ? 'PAST DEADLINE' : left > 2880 ? `เหลือ ${Math.floor(left / 1440)}d ${Math.floor((left % 1440) / 60)}h` : `เหลือ ${Math.floor(left / 60)}h${Math.round(left % 60)}m`}`);
  console.log(`source: FPL API bootstrap-static/ + fixtures/?event=${ev.id} — fetched ${F.fmtUTC()}`);

  const fx = await F.getJSON(c, `fixtures/?event=${ev.id}`, 30);
  console.log('\n## Fixtures (TH)');
  fx.sort((a, b) => a.kickoff_time.localeCompare(b.kickoff_time))
    .forEach((f) => console.log(`${F.thTime(f.kickoff_time)} | ${T[f.team_h]} v ${T[f.team_a]} | FDR ${f.team_h_difficulty}/${f.team_a_difficulty}`));

  const specs = F.readSquad(c).map((s) => ({ s, tag: 'SQ' }))
    .concat((args.players ? args.players.split(',') : []).map((s) => ({ s, tag: 'XT' })));
  console.log('\n## Status (a=available d=doubt i=injured s=suspended u=unavailable)');
  // GW under way: show provisional points of fixtures already played
  const cur = bs.events.find((e) => e.is_current && !e.finished);
  const L = cur ? await F.live(c, cur.id, false) : null;
  const liveOf = (id) => L && L.elements.find((e) => e.id === id);
  console.log(`tag | player | club | £ | Δ£ GW | status | chance | YC | net transfers GW | form${L ? ` | GW${cur.id} live min/pts` : ''} | news (added TH)`);
  for (const { s, tag } of specs) {
    let p;
    try { p = F.findPlayer(bs, s); } catch (e) { console.log(`${tag} | ${s} | NOT FOUND: ${e.message}`); continue; }
    // PL bans at 5 / 10 / 15 yellows (each before its cut-off) — one card away is worth flagging
    const yc = [4, 9, 14].includes(p.yellow_cards) ? `${p.yellow_cards} ⚠️ban-risk` : p.yellow_cards;
    const flag = p.status !== 'a' || p.news ? ' ⚠️' : '';
    const lv = liveOf(p.id);
    console.log([tag, p.web_name + flag, T[p.team], (p.now_cost / 10).toFixed(1), p.cost_change_event / 10, p.status, p.chance_of_playing_next_round ?? '-', yc,
      p.transfers_in_event - p.transfers_out_event, p.form, ...(L ? [lv && lv.stats.minutes ? `${lv.stats.minutes}′/${lv.stats.total_points}` : '-'] : []),
      p.news ? `${p.news} (${F.thTime(p.news_added)})` : '-'].join(' | '));
  }
  if (L) console.log(`\nlive = FPL API event/${cur.id}/live/ (provisional until bonus is confirmed) — fetched ${F.fmtUTC()}`);
})().catch((e) => { console.error(e.message); process.exit(1); });

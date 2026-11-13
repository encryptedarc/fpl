// Shared helpers for fpl-gw scripts: cached FPL API fetch, squad parsing, team xG from live data.
const fs = require('fs');
const path = require('path');
const os = require('os');

const BASE = 'https://fantasy.premierleague.com/api/';
const POS = { 1: 'GK', 2: 'DEF', 3: 'MID', 4: 'FWD' };

function parseArgs(argv) {
  const a = {};
  for (let i = 2; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue;
    const k = argv[i].slice(2);
    const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    a[k] = v;
  }
  return a;
}

function ctx(args) {
  const cache = args.cache || path.join(os.tmpdir(), 'fpl-cache');
  fs.mkdirSync(cache, { recursive: true });
  const workspace = args.workspace || args.vault || process.env.FPL_WORKSPACE || process.env.FPL_VAULT;
  return { cache, vault: workspace || process.cwd(), workspaceExplicit: !!workspace, fresh: !!args.fresh, sources: {} };
}

// maxAgeMin: reuse a cached file younger than this; --fresh forces refetch of volatile data
async function getJSON(c, endpoint, maxAgeMin) {
  const file = path.join(c.cache, endpoint.replace(/[\/?=&]+/g, '_') + '.json');
  if (fs.existsSync(file) && !(c.fresh && maxAgeMin < 1e6)) {
    const stat = fs.statSync(file);
    const age = (Date.now() - stat.mtimeMs) / 60000;
    if (age < maxAgeMin) {
      c.sources[endpoint] = `cached; cache file timestamp ${fmtUTC(stat.mtime)} (retrieval time unverified)`;
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  }
  const res = await fetch(BASE + endpoint, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const text = await res.text();
  if (!res.ok || text.startsWith('"The game is being updated')) throw new Error(`FPL API ${endpoint}: ${res.status} ${text.slice(0, 80)}`);
  fs.writeFileSync(file, text);
  c.sources[endpoint] = `fetched ${fmtUTC()}`;
  return JSON.parse(text);
}

const bootstrap = (c) => getJSON(c, 'bootstrap-static/', 30);
const fixturesAll = (c) => getJSON(c, 'fixtures/', 60);
const summary = (c, id) => getJSON(c, `element-summary/${id}/`, 60);
// finished GWs never change, so cache them for good
const live = (c, gw, finished) => getJSON(c, `event/${gw}/live/`, finished ? 1e9 : 10);

const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ø/g, 'o').replace(/ß/g, 'ss').toLowerCase().replace(/[^a-z]/g, '');

function teamMaps(bs) {
  const T = {}, ID = {};
  bs.teams.forEach((t) => { T[t.id] = t.short_name; ID[t.short_name] = t.id; });
  return { T, ID };
}

// spec "Isak:LIV" or "Isak" — matches web_name, then full name
function findPlayer(bs, spec) {
  const [name, club] = spec.split(':').map((s) => s.trim());
  const { T } = teamMaps(bs);
  const n = norm(name);
  const pool = bs.elements.filter((e) => !club || T[e.team] === club.toUpperCase());
  const hit = pool.filter((e) => norm(e.web_name) === n);
  const res = hit.length ? hit : pool.filter((e) => norm(e.web_name).includes(n) || norm(e.first_name + e.second_name).includes(n));
  if (res.length !== 1) throw new Error(`player "${spec}": ${res.length} matches ${res.slice(0, 5).map((e) => e.web_name + ':' + T[e.team]).join(', ')}`);
  return res[0];
}

// Squad.md table rows: | Pos | Player | Club | note |
function readSquad(c, optional = false) {
  const file = path.join(c.vault, 'Squad.md');
  if (!fs.existsSync(file)) {
    if (optional && !c.workspaceExplicit) return [];
    throw new Error(`Squad.md not found in ${c.vault} — pass --players or --xi for Quick mode, or --workspace <dir> (legacy: --vault / FPL_VAULT)`);
  }
  const md = fs.readFileSync(file, 'utf8');
  return md.split('\n')
    .map((l) => l.split('|').map((s) => s.trim()))
    .filter((r) => r.length > 4 && /^(GK|DEF|MID|FWD)$/.test(r[1]) && r[2])
    .map((r) => `${r[2]}:${r[3]}`);
}

const thTime = (iso) => new Date(new Date(iso).getTime() + 7 * 3600e3).toISOString().slice(5, 16).replace('T', ' ') + ' TH';
const fmtUTC = (d = new Date()) => d.toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
const dataSources = (c) => '\n## Data sources\n' + Object.entries(c.sources).map(([endpoint, source]) => `FPL API ${endpoint} — ${source}`).join('\n');

// Team xG per fixture = sum of player expected_goals (FPL live, own goals excluded)
async function teamXG(c, bs, fx) {
  const team = {};
  bs.elements.forEach((e) => (team[e.id] = e.team));
  const xg = {};
  // include the GW under way so its finished fixtures carry xG too
  const done = bs.events.filter((e) => e.finished || e.is_current);
  for (const ev of done) {
    const L = await live(c, ev.id, ev.finished);
    for (const el of L.elements) {
      for (const ex of el.explain || []) {
        const f = ex.fixture;
        const x = ex.stats.find((s) => s.identifier === 'expected_goals');
        // explain only lists scoring stats; fall back to the element total for single-fixture GWs
        const v = x ? parseFloat(x.value) : (el.explain.length === 1 ? parseFloat(el.stats.expected_goals || 0) : 0);
        xg[f] = xg[f] || {};
        xg[f][team[el.id]] = (xg[f][team[el.id]] || 0) + v;
      }
    }
  }
  const ts = {};
  bs.teams.forEach((t) => (ts[t.id] = { f: 0, a: 0, gf: 0, ga: 0, p: 0, rows: [] }));
  fx.filter(isDone).sort((a, b) => a.event - b.event).forEach((f) => {
    const x = xg[f.id] || {};
    for (const [t, o, gf, ga, h] of [[f.team_h, f.team_a, f.team_h_score, f.team_a_score, true], [f.team_a, f.team_h, f.team_a_score, f.team_h_score, false]]) {
      const s = ts[t];
      s.f += x[t] || 0; s.a += x[o] || 0; s.gf += gf; s.ga += ga; s.p++;
      s.rows.push({ gw: f.event, h, opp: o, gf, ga, xgf: x[t] || 0, xga: x[o] || 0 });
    }
  });
  const avg = Object.values(ts).reduce((s, v) => s + (v.p ? v.f / v.p : 0), 0) / bs.teams.length;
  return { ts, avg };
}

function nextEvent(bs) {
  return bs.events.find((e) => e.is_next) || bs.events.find((e) => !e.finished);
}

const isDone = (f) => f.finished || f.finished_provisional;

// element-summary history also lists GW-under-way fixtures not yet played (0′) — keep only finished ones
function playedHistory(es, fx) {
  const done = new Set(fx.filter(isDone).map((f) => f.id));
  return es.history.filter((h) => done.has(h.fixture));
}

// a team's fixtures in a GW from the season list (element-summary drops fixtures once the GW starts)
const teamFixtures = (fx, team, gw) => fx.filter((f) => f.event === gw && (f.team_h === team || f.team_a === team));

module.exports = { POS, parseArgs, ctx, getJSON, bootstrap, fixturesAll, summary, live, findPlayer, readSquad, teamMaps, thTime, fmtUTC, dataSources, teamXG, nextEvent, norm, isDone, playedHistory, teamFixtures };

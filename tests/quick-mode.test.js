const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const scripts = path.resolve(__dirname, '../plugins/fpl-gw/skills/fpl-gw/scripts');

function setup(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fpl-quick-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const cache = path.join(root, 'cache');
  const cwd = path.join(root, 'empty');
  const workspace = path.join(root, 'plain-markdown');
  for (const dir of [cache, cwd, workspace]) fs.mkdirSync(dir);
  fs.writeFileSync(path.join(workspace, 'Squad.md'), '| MID | Alpha | AAA | |\n');
  const players = [
    { id: 1, web_name: 'Alpha', first_name: 'A', second_name: 'One', team: 1, element_type: 3 },
    { id: 2, web_name: 'Beta', first_name: 'B', second_name: 'Two', team: 2, element_type: 4 },
  ].map(p => ({ ...p, status: 'a', now_cost: 70, cost_change_event: 0, yellow_cards: 0, news: '', transfers_in_event: 0, transfers_out_event: 0, form: '2.0', minutes: 90, expected_goals: '1.0', expected_assists: '0.2', bonus: 0, saves: 0 }));
  const bs = {
    teams: [{ id: 1, short_name: 'AAA' }, { id: 2, short_name: 'BBB' }], elements: players,
    events: [{ id: 1, finished: true }, { id: 2, is_next: true, finished: false, deadline_time: '2099-01-01T00:00:00Z' }],
  };
  const fx = [
    { id: 10, event: 1, finished: true, team_h: 1, team_a: 2, team_h_score: 1, team_a_score: 1 },
    { id: 20, event: 2, finished: false, team_h: 1, team_a: 2, kickoff_time: '2099-01-02T00:00:00Z', team_h_difficulty: 3, team_a_difficulty: 3 },
  ];
  const put = (key, value) => fs.writeFileSync(path.join(cache, key.replace(/[\/?=&]+/g, '_') + '.json'), JSON.stringify(value));
  put('bootstrap-static/', bs);
  put('fixtures/', fx);
  put('fixtures/?event=2', [fx[1]]);
  put('event/1/live/', { elements: players.map(p => ({ id: p.id, stats: { expected_goals: '1.0' }, explain: [{ fixture: 10, stats: [] }] })) });
  for (const p of players) put(`element-summary/${p.id}/`, { history: [{ fixture: 10, round: 1, minutes: 90, defensive_contribution: 0 }], fixtures: [] });
  const run = (script, args = [], env = {}) => spawnSync(process.execPath, [path.join(scripts, script), '--cache', cache, ...args], {
    cwd, encoding: 'utf8', timeout: 10000,
    env: { ...process.env, FPL_WORKSPACE: '', FPL_VAULT: '', ...env },
  });
  return { root, cwd, workspace, run };
}

test('news accepts explicit players without a workspace or note writes', t => {
  const { cwd, run } = setup(t);
  const r = run('news.js', ['--players', 'Alpha:AAA']);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Alpha/);
  assert.deepEqual(fs.readdirSync(cwd), []);
});

test('news without a squad still returns deadline and fixtures', t => {
  const { run } = setup(t);
  const r = run('news.js');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /AAA v BBB/);
  assert.doesNotMatch(r.stdout, /\| Alpha \|/);
});

test('projection accepts players without XI or workspace', t => {
  const { cwd, run } = setup(t);
  const r = run('projection.js', ['--players', 'Alpha:AAA,Beta:BBB', '--gw', '2']);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Alpha/);
  assert.match(r.stdout, /Beta/);
  assert.match(r.stdout, /projection \(est\.\)/);
  assert.doesNotMatch(r.stdout, /NaN/);
  assert.deepEqual(fs.readdirSync(cwd), []);
});

test('projection derives its player pool from XI and ordered bench', t => {
  const { run } = setup(t);
  const r = run('projection.js', ['--xi', 'Alpha:AAA', '--bench', 'Beta:BBB', '--captain', 'Alpha:AAA', '--vice', 'Beta:BBB', '--gw', '2', '--sims', '5']);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /XI \| Alpha/);
  assert.match(r.stdout, /bench \| Beta/);
  assert.match(r.stdout, /Monte Carlo 5 runs/);
  assert.doesNotMatch(r.stdout, /NaN/);
});

test('explicit player input overrides an unrelated squad in cwd or environment', t => {
  const { cwd, workspace, run } = setup(t);
  fs.copyFileSync(path.join(workspace, 'Squad.md'), path.join(cwd, 'Squad.md'));
  const r = run('news.js', ['--players', 'Beta:BBB'], { FPL_WORKSPACE: path.join(cwd, 'does-not-exist') });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Beta/);
  assert.doesNotMatch(r.stdout, /\| Alpha \|/);
});

test('workspace flag and both environment names load a plain Markdown squad', t => {
  const { workspace, run } = setup(t);
  for (const [args, env] of [
    [['--workspace', workspace], {}], [['--vault', workspace], {}],
    [[], { FPL_WORKSPACE: workspace }], [[], { FPL_VAULT: workspace }],
  ]) {
    const r = run('news.js', args, env);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /Alpha/);
  }
});

test('projection retains existing workspace squad behavior', t => {
  const { workspace, run } = setup(t);
  const r = run('projection.js', ['--vault', workspace, '--gw', '2']);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /squad \| Alpha/);
  assert.doesNotMatch(r.stdout, /NaN/);
});

test('missing projection input has actionable guidance and creates no notes', t => {
  const { cwd, run } = setup(t);
  const r = run('projection.js');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /--players/);
  assert.match(r.stderr, /--xi/);
  assert.deepEqual(fs.readdirSync(cwd), []);
});

test('explicit missing workspace is reported rather than silently falling back', t => {
  const { cwd, run } = setup(t);
  const r = run('news.js', ['--workspace', path.join(cwd, 'missing')]);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Squad.md not found/);
});

test('workspace news includes saved squad and explicit extra targets', t => {
  const { workspace, run } = setup(t);
  const r = run('news.js', ['--workspace', workspace, '--extra', 'Beta:BBB']);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /SQ \| Alpha/);
  assert.match(r.stdout, /XT \| Beta/);
});

test('workspace path precedence keeps CLI choices ahead of environment defaults', t => {
  const { root, workspace, run } = setup(t);
  const other = path.join(root, 'other');
  fs.mkdirSync(other);
  fs.writeFileSync(path.join(other, 'Squad.md'), '| FWD | Beta | BBB | |\n');
  for (const [args, env] of [
    [['--workspace', workspace, '--vault', other], { FPL_WORKSPACE: other, FPL_VAULT: other }],
    [['--vault', workspace], { FPL_WORKSPACE: other, FPL_VAULT: other }],
    [[], { FPL_WORKSPACE: workspace, FPL_VAULT: other }],
  ]) {
    const r = run('news.js', args, env);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /SQ \| Alpha/);
    assert.doesNotMatch(r.stdout, /\| Beta \|/);
  }
});

test('optional initialization creates plain Markdown and never overwrites existing squad', t => {
  const { workspace, run } = setup(t);
  const original = fs.readFileSync(path.join(workspace, 'Squad.md'), 'utf8');
  for (let i = 0; i < 2; i++) {
    const r = run('init-vault.js', ['--dir', workspace, '--season', '2026-27']);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(fs.readFileSync(path.join(workspace, 'Squad.md'), 'utf8'), original);
  }
  assert.ok(fs.existsSync(path.join(workspace, 'Season 2026-27.md')));
  assert.ok(fs.existsSync(path.join(workspace, 'Templates/GW Template.md')));
  assert.equal(fs.existsSync(path.join(workspace, '.obsidian')), false);
});

test('copied standalone skill runs outside the plugin without harness environment variables', t => {
  const { root, cwd, workspace, run } = setup(t);
  const standalone = path.join(root, 'any harness skills', 'fpl-gw');
  fs.cpSync(path.dirname(scripts), standalone, { recursive: true });
  const env = { ...process.env, FPL_WORKSPACE: '', FPL_VAULT: '' };
  delete env.CLAUDE_PLUGIN_ROOT;
  delete env.CLAUDE_PROJECT_DIR;
  const cache = path.join(root, 'cache');
  for (const [script, args, expected] of [
    ['news.js', ['--players', 'Alpha:AAA'], /Alpha/],
    ['projection.js', ['--players', 'Alpha:AAA', '--gw', '2'], /Alpha/],
    ['init-vault.js', ['--dir', workspace, '--season', '2026-27'], /created:/],
  ]) {
    const r = spawnSync(process.execPath, [path.join(standalone, 'scripts', script), '--cache', cache, ...args], { cwd, env, encoding: 'utf8', timeout: 10000 });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, expected);
  }
  assert.ok(fs.existsSync(path.join(workspace, 'AGENTS.md')));
  assert.deepEqual(fs.readdirSync(cwd), []);
});

test('initializing a legacy workspace keeps its existing rules as the instruction target', t => {
  const { workspace, run } = setup(t);
  const rules = '# FPL Vault — Agent Protocol\n\nCustom rules that must remain authoritative.\n';
  fs.writeFileSync(path.join(workspace, 'CLAUDE.md'), rules);
  const r = run('init-vault.js', ['--dir', workspace, '--season', '2026-27']);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(fs.readFileSync(path.join(workspace, 'CLAUDE.md'), 'utf8'), rules);
  const entry = fs.readFileSync(path.join(workspace, 'AGENTS.md'), 'utf8');
  const target = entry.match(/\]\(([^)]+)\)/);
  assert.ok(target, 'Generated entry point must link to the existing customized rules');
  assert.equal(fs.readFileSync(path.resolve(workspace, target[1]), 'utf8'), rules);
});

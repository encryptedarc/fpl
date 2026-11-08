// Scaffold a new FPL vault from assets/vault-template. Never overwrites existing files.
// usage: node init-vault.js --dir <path> [--season 2026-27]
const fs = require('fs');
const path = require('path');
const F = require('./lib/fpl');

const args = F.parseArgs(process.argv);
if (!args.dir) { console.error('--dir <path> required'); process.exit(1); }
const now = new Date();
const y = now.getUTCMonth() >= 6 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
const season = args.season || `${y}-${String((y + 1) % 100).padStart(2, '0')}`;
if (!/^\d{4}-\d{2}$/.test(season)) { console.error('--season must look like 2026-27'); process.exit(1); }

const src = path.join(__dirname, '..', 'assets', 'vault-template');
const dst = path.resolve(args.dir);
const created = [], skipped = [];
(function copy(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const name of fs.readdirSync(from)) {
    const s = path.join(from, name), d = path.join(to, name.replace(/\{\{SEASON\}\}/g, season));
    if (fs.statSync(s).isDirectory()) { copy(s, d); continue; }
    if (fs.existsSync(d)) { skipped.push(path.relative(dst, d)); continue; }
    fs.writeFileSync(d, fs.readFileSync(s, 'utf8').replace(/\{\{SEASON\}\}/g, season));
    created.push(path.relative(dst, d));
  }
})(src, dst);
fs.mkdirSync(path.join(dst, 'GW'), { recursive: true });

console.log(`FPL Markdown workspace at ${dst} (season ${season}) — Obsidian optional`);
console.log(`created: ${created.join(', ') || 'none'}`);
if (skipped.length) console.log(`kept existing: ${skipped.join(', ')}`);
console.log('next: fill Squad.md (Pos | Player | Club), set the language line in CLAUDE.md §1, optionally your FPL team_id in §0');

---
name: fpl-gw
description: Run a Fantasy Premier League (FPL) gameweek workflow inside a markdown/Obsidian FPL vault — check team news/injuries/yellow-card bans, compare transfer options with stats, pick captain/vice, analyse opponent defence vs our attack, project xPts (with Monte Carlo ranges) for the XI, then lock the plan into GW notes + Squad.md and close the GW with results. Use this whenever the user talks about FPL / Fantasy Premier League / a gameweek, even in short prompts like "check news", "who to captain", "C ใคร", "check ข่าว", "วิเคราะห์แผน", "เลือกใครดี", "กัปตัน", "คาดการณ์คะแนน", "สถิติคู่แข่ง", "เกมรับ/เกมรุก", "บันทึกแผน", "lock", "ปิด GW", "ผลแต้ม GW", or names players (Haaland, Salah, Palmer…) alongside a GW, transfer, captain or deadline — including follow-ups mid-conversation. Also use it to set up a new FPL vault.
---

# FPL Gameweek workflow

The vault's own rules live in its `CLAUDE.md` (hard rules, GW note schema, Plan → Refine → Lock → Close workflow, FPL API notes). This skill does **not** restate them — it adds *how* to do each step quickly and consistently. Read the vault `CLAUDE.md` first if it isn't already in context; where the two ever disagree, the vault `CLAUDE.md` wins.

**Vault root** — the first that applies:
1. a folder the task names explicitly (e.g. a sandbox copy),
2. the `FPL_VAULT` environment variable,
3. the current working directory, if it holds a `CLAUDE.md` titled "FPL Vault — Agent Protocol".

Use that path for every read, write and `--vault` flag. **No vault yet?** Offer to create one: `node scripts/init-vault.js --dir <path> --season YYYY-YY` copies the starter vault from `assets/vault-template/` (never overwrites existing files), then ask the user for their squad (screenshot is fine) to fill `Squad.md`.

## Every request: start here

1. **Clock first.** Run `node scripts/news.js` (or check `bootstrap-static` `events`) and compare *now (UTC)* with the GW deadline. The user makes changes in the FPL app themselves, so time left decides how deep the analysis can go — open every answer with it. If the deadline has passed, say the team is locked and switch to "what to watch / what the live points say".
2. **Fresh file listing.** `ls GW/` before saying a GW note does or doesn't exist — sync tools (Obsidian Sync, iCloud…) can drop a file in mid-session.
3. **Read in the vault's order**: `Squad.md` → `Lessons.md` (checklist + L-rules) → latest `GW/GWnn.md` → `Season`/`Fixtures` only for the part you need. The latest GW note's *Decision path* is the memory of what was already decided — build on it instead of redoing it.
4. **Pick the step** and read only its reference:

| User intent (examples) | Reference | Script |
|---|---|---|
| check news, ใครเจ็บ, team news | `references/news.md` | `news.js` |
| compare transfers, ซื้อใครดี, A vs B | `references/transfer.md` | `compare.js` + `projection.js --gws` |
| who to captain, C ใคร, vice | `references/captain.md` | `compare.js` + `projection.js` |
| opponent stats, เกมรับ/เกมรุก, matchup | `references/matchup.md` | `opponent.js` (+ xGstat via browser) |
| projected points, คาดการณ์คะแนน, xPts | `references/projection.md` | `projection.js --sims` |
| save plan, lock, close GW, results | `references/lock-close.md` | — |

A question often spans several (e.g. "who to captain" usually needs matchup + projection). Load what the question needs; don't run everything by default.

## Scripts (Node 18+, no other dependencies)

All in `scripts/`; usage is in the header comment of each file. Shared flags: `--vault <dir>` (default: `FPL_VAULT`, then cwd), `--cache <dir>` (default: OS temp `fpl-cache`; pass a session scratch folder when you have one), `--fresh` to refetch volatile data. They print markdown tables plus a `source: … fetched <UTC>` line — copy that line into the note's Sources. Player specs are `Name:CLUB` (e.g. `N.Jackson:AVL`); the squad is read from `Squad.md` automatically.

- `news.js [--gw N] [--players "Saliba:ARS,…"]` — deadline countdown, GW fixtures (local + kickoff), status/news/price change/net transfers, **yellow cards with ban-risk flag**, and live minutes/points while a GW is under way
- `compare.js --players "A:CLB,B:CLB,…" [--n 6] [--from GW]` — standard comparison table (incl. G+A vs xGI over/under flag) + last 5 + fixture ticker from the next GW
- `opponent.js --teams NFO,CRY [--last 5]` — results with team xG for/against, home/away split, league xGA/xGF ranks
- `projection.js --xi "…11…" --bench "…4…" --captain X --vice Y [--sims 20000] [--gw N | --gws A-B] [--extra "Target:CLB"] [--if-starts "…"] [--minutes "Name:0"]` — per-player xPts, XI total, captain swap, "if starts" column, Monte Carlo range with auto-subs, multi-GW sums; fixtures already played use the real live points (`✔actual`)
- `init-vault.js --dir <path> --season YYYY-YY` — scaffold a new vault

Scripts count only finished fixtures, so they stay correct while a GW is under way.

## Answer format

Use this order so the user (often on a phone) can scan it fast:

1. `⏰` time left to the deadline (or "locked" + next kickoffs)
2. Data table(s)
3. Recommendation, labelled as your estimate (the vault defines the label, e.g. `(Claude ประเมิน)` / `(est.)`)
4. `⚠️` anything that **contradicts an earlier answer** in this conversation or an earlier Decision-path item — name the item and what changed. Silent drift between answers is worse than being wrong once.
5. `Sources:` — links for web sources; API lines with fetch time
6. The vault's final-summary block (`Vault updated: …`)
7. One closing question with the concrete choices still open

Write prose in the language the vault `CLAUDE.md` sets; keep FPL/football terms and player names in English.

## Writing to the vault

- **Refine (news, analysis, comparisons, projections)**: append automatically to the current GW note — Team news as dated bullets, Decision path as the next number labelled as an estimate. Never delete or renumber old items; a correction goes in a new item that points back ("⚠️ correction to item 8: …").
- **Lock**: only after the user explicitly confirms the plan. See `references/lock-close.md`.
- Keep the body sections in the schema's order. Put extra material (projection tables, matchup tables) inside Decision path items rather than inventing new `##` sections.
- When writing markdown via shell/node, backticks get eaten by bash — prefer the Edit tool for note text.

## Gotchas (learned the hard way)

1. **Re-list before claiming absence** — `ls GW/` fresh; glob/grep results can be stale after sync.
2. **Vice rule**: FPL applies the vice-captain at the end of the GW regardless of kickoff order. If C plays 0′, V's points double even if V played earlier.
3. **One framework**: projections use FPL-live team xG only. When another source (xGstat, FFS) gives different numbers, show both, say which the projection used, and flag the contradiction — providers rank the same defence differently.
4. **Clock every turn**: compare UTC now vs `deadline_time`; say how long is left or that it has passed.
5. **Symmetric context**: a factor that favours one option ("opponent played midweek", "missing defenders") must be checked for the alternative too.
6. **Search results go stale**: news searches often return last season's articles — check the date before using one, and read the page directly when summaries are thin.
7. **Blocked sources**: Understat, Sofascore, and xGstat via curl return bot pages — don't retry them. xGstat works through an in-app browser if one is available. Shot locations / home-away splits on xGstat are Pro-only.
8. **FPL API quirks** live in the vault `CLAUDE.md` (`ep_next` ≈ form, "The game is being updated", login-only data → ask for a screenshot).

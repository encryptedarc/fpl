# fpl-gw — FPL gameweek co-pilot for Claude Code

A Claude Code plugin that runs your **Fantasy Premier League** week with you: team news, transfer comparisons, captain picks, opponent matchups and expected-points projections — and keeps every decision in a plain markdown (Obsidian-friendly) vault so the next session picks up where the last one stopped.

```
you   > check news before the deadline
agent > ⏰ 54 min to the GW10 deadline · all 15 available · Groß 4 yellows ⚠️ one from a ban · …
you   > who should I captain, Haaland or Isak?
agent > table: xG/90, minutes, pen order, ownership · opponent xGA · xPts 5.6 vs 6.8 if Isak starts · EO trade-off …
you   > projected points for my XI
agent > per-player xPts · XI ≈ 66 · Monte Carlo 20,000 runs: p10–p90 51–82 · auto-subs + vice included
you   > lock it, I'm going with Isak
agent > GW10.md locked · Squad.md updated · remember to make the transfer in the FPL app
```

## What it does

| Ask (English or Thai) | You get |
|---|---|
| "check news" · "check ข่าว" | Deadline countdown, status/news for your 15 + targets, price moves, **yellow-card ban risk**, live points while a GW is under way, press-conference summary |
| "Isak or Jackson?" · "ซื้อใครดี" | Standard comparison table (xG/90, xGI/90, pts/90, minutes, pen order, G+A vs xGI over/under), 6-GW fixture ticker, budget maths with selling prices, multi-GW xPts |
| "who to captain?" · "C ใคร" | Candidate stats, opponent defence, xPts with an "if he starts" column, template-captain ownership trade-off, correct vice-captain rule |
| "how leaky is Palace?" · "สถิติคู่แข่ง" | Last-5 results with team xG for/against, home/away splits, league xGA ranks (+ situational data from xGstat if your session has a browser) |
| "projected points" · "คาดการณ์คะแนน" | Per-player xPts, XI total, Monte Carlo range with FPL auto-subs and vice fallback; played fixtures use real live points |
| "lock the plan" · "บันทึกแผน" / "close GW10" | Fills the GW note, overwrites `Squad.md`, logs results, captain record and new lessons |

Every estimate is labelled as one, every web number carries a source and date, and closed gameweeks are never rewritten without evidence.

## Install

Requires **Claude Code** and **Node.js 18+** (the scripts use only Node built-ins).

```
/plugin marketplace add encryptedarc/fpl
/plugin install fpl-gw@fpl
```

Restart Claude Code (or start a new session) so the skill and command load. Update later with `/plugin marketplace update fpl`.

## Set up your vault (once)

```
/fpl-gw:init ~/Obsidian/FPL 2026-27
```

This creates the starter vault (it never overwrites existing files):

```
FPL/
├── CLAUDE.md            ← rules every agent follows (read order, note schema, workflow, stop conditions)
├── AGENTS.md            ← pointer for non-Claude agents
├── README.md
├── Squad.md             ← your 15 (Pos | Player | Club | buy price) — the scripts read this table
├── Lessons.md           ← pre-deadline checklist + lessons you learn
├── Season 2026-27.md    ← dashboard: GW log, chips, captain record (Dataview table included)
├── Fixtures 2026-27.md  ← fixtures + FDR matrix
├── GW/                  ← one note per gameweek (GW10.md …)
└── Templates/GW Template.md
```

Then send a screenshot of your FPL "Pick Team" page so the agent can fill `Squad.md`, and set your note language in `CLAUDE.md` §1.

Open Claude Code **in the vault folder** — or set `FPL_VAULT=/path/to/FPL` — and start with "check news".

## The weekly loop

1. **Plan** — "plan GW11": creates `GW/GW11.md` from the template.
2. **Refine** — news, comparisons, captain, projections: each answer is appended to the note's *Team news* / *Decision path*, numbered, never deleted. Corrections point back to the item they fix.
3. **Lock** — only when you confirm: transfers, XI, C/V, bench, risks accepted; `Squad.md` rewritten. You still make the moves in the FPL app.
4. **Close** — send your result screenshot: points, ranks, Season log, captain record, new lessons; the projection is compared with what happened.

## Scripts (usable on their own)

All live in `plugins/fpl-gw/skills/fpl-gw/scripts/`. Shared flags: `--vault <dir>` (default `FPL_VAULT`, then the current folder), `--cache <dir>`, `--fresh`.

```bash
node news.js --players "Saliba:ARS,Yarmoliuk:BRE"
node compare.js --players "Manzambi:AVL,Gakpo:LIV,Ødegaard:ARS" --n 6
node opponent.js --teams NFO,CRY --last 5
node projection.js --xi "Raya,Konsa,…" --bench "GK2,Sub1,Sub2,Sub3" --captain Isak --vice Haaland --sims 20000
node projection.js --gws 11-13 --xi "…" --extra "Manzambi:AVL"
node init-vault.js --dir ~/Obsidian/FPL --season 2026-27
```

### How the projection works

- Team expected goals: `team xG for × opponent xG against ÷ league average`, ±8% home/away. Team xG is summed from players' `expected_goals` in the FPL live data.
- Player share: season xG/90 and xA/90 scaled to the fixture, times expected minutes (last 5 games).
- Points: appearance, goals by position, assists, clean sheets (Poisson), goals conceded, saves, DefCon hit-rate, bonus/90.
- `--sims` samples minutes, goals and assists, draws goals conceded once per team (so clean sheets move together), applies FPL auto-subs in your bench order and the vice-captain rule.
- Not modelled: cards, own goals, penalty saves, form trends. It is a consistent yardstick, not an oracle — the GW review compares it with real results.

## Data sources

- **FPL API** (`fantasy.premierleague.com/api/`) — public, no login, unofficial and undocumented; schema can change, and it answers "The game is being updated" around deadlines and match ends. Data that needs your login (selling prices, your team before the deadline) comes from your screenshots.
- **Web search / pages** for press conferences and predicted line-ups (Fantasy Football Scout, club sites). Search results often surface last season's articles; the skill checks dates.
- **xGstat** for situational detail, only through an in-app browser (it blocks scripted requests). Understat and Sofascore block scripted requests too.

## Thai / ภาษาไทย

Plugin สำหรับ Claude Code ช่วยทำ FPL รายสัปดาห์: เช็กข่าว เทียบตัวซื้อขาย เลือกกัปตัน ดูสถิติคู่แข่ง และคาดการณ์คะแนน (มี Monte Carlo) ทุกการตัดสินใจเก็บลง vault markdown/Obsidian เพื่อให้ session ถัดไปทำงานต่อได้

1. ติดตั้ง: `/plugin marketplace add encryptedarc/fpl` แล้ว `/plugin install fpl-gw@fpl`
2. สร้าง vault: `/fpl-gw:init <โฟลเดอร์> 2026-27` แล้วส่ง screenshot หน้า Pick Team ให้ agent กรอก `Squad.md` และตั้งภาษาใน `CLAUDE.md` ข้อ 1.8 เป็น Thai
3. เปิด Claude Code ในโฟลเดอร์ vault แล้วพิมพ์ เช่น "check ข่าว", "C ใคร", "คาดการณ์คะแนน", "บันทึกแผน"

ตัวเลขที่ agent ประเมินเองจะติดป้าย `(est.)` ทุกครั้ง และ agent ไม่แก้ผล GW ที่ปิดแล้วถ้าไม่มีหลักฐาน

---

Not affiliated with the Premier League or Fantasy Premier League.

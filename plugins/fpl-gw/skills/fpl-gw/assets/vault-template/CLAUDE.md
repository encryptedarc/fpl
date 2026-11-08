# FPL Workspace — Agent Protocol

> Rules for every AI agent (Claude / Codex / Cursor / Gemini) working in this workspace.
> Read this file to the end before answering an FPL question or editing any file here.

## 0. Scope
- This is an optional plain Markdown workspace. Obsidian is not required. Outside a selected workspace, the skill works in Quick mode without these files.
- This workspace holds one manager's FPL campaign from season {{SEASON}} onwards.
- Manager / team name: <fill in> · FPL team_id: `unknown` (add it to let agents read your rank and history)
- Source of truth = files in this workspace > memory of the conversation > the model's general knowledge.

## 1. Hard Rules
1. **Read before answering** — before giving FPL advice, read (in order): `CLAUDE.md` → `Squad.md` → `Lessons.md` → the latest GW note in `GW/` → `Season {{SEASON}}.md` (only the relevant part).
2. **Never make data up** — points, ranks, prices or hits without evidence (screenshot / source) are written as `unknown`.
3. **Never rewrite closed results** (`status: closed`) unless the user sends new evidence — then add a line `> correction YYYY-MM-DD: ...` under the changed spot.
4. **Agent estimates** (xPts, projections) are always labelled `(est.)`.
5. **Every number from the web** carries `source + date`, on the same line or in the note's Sources section.
6. **Never delete or rename** existing files — add or edit only.
7. **The checklist in `Lessons.md`** must pass before proposing the final plan for a GW.
8. **Language**: write prose in English <change to your language, e.g. "Thai">; keep FPL/football terms and player names in English.

## 2. File Layout & Naming
```
FPL/
├── CLAUDE.md               ← these rules
├── AGENTS.md               ← pointer to CLAUDE.md for other agents
├── README.md               ← guide for humans
├── Season {{SEASON}}.md       ← dashboard (one per season: "Season YYYY-YY.md")
├── Squad.md                ← current squad (overwritten every GW)
├── Fixtures {{SEASON}}.md     ← fixtures + FDR matrix (one per season) — read before searching fixtures again
├── Lessons.md              ← checklist + lessons (append-only)
├── GW/GWnn.md              ← one file per GW, nn = 2 digits (GW08, GW15)
└── Templates/GW Template.md
```
- New season: put GW notes in `GW/YYYY-YY/GWnn.md` and create `Season YYYY-YY.md` — never overwrite the old season.

## 3. GW Note Schema (frontmatter — keep every key)
```yaml
gw: 8                      # int
season: {{SEASON}}
status: planning           # planning | locked | closed
deadline: 2026-10-24T17:00+07:00
points:                    # int | unknown | empty until the GW ends
avg:                       # int
highest:                   # int
gw_rank:                   # int | unknown
overall_rank:              # int | unknown
transfers: 0               # int | wildcard | free_hit
hit: 0                     # 0 | -4 | -8 | unknown
chip: none                 # none | wildcard | free_hit | bench_boost | triple_captain
captain:
captain_pts:               # captain's points incl. multiplier
vice:
bench_pts:                 # int
tags: [fpl, gw]            # add the chip if one is used
```
**Body sections (in this order, with these headings):**
`## Transfers` → `## XI` → `## Team news` → `## Decision path` → `## Risks accepted` → `## Result` → `## Review` → `## Sources`

## 4. Workflow (4 steps)
| Step | Trigger | Action | Files |
|---|---|---|---|
| 1. Plan | user starts discussing a new GW | create `GW/GWnn.md` from the template, `status: planning` | GWnn |
| 2. Refine | press conferences / news / user changes their mind | append to `Team news` and `Decision path` (keep numbering, never delete) | GWnn |
| 3. Lock | user confirms the plan / after the deadline | fill Transfers + XI + C/V + chip, `status: locked`; overwrite `Squad.md` | GWnn, Squad |
| 4. Close | user sends results | fill Result/Review + frontmatter, `status: closed`; add a row to the Season GW log + captain record; update Chips; new lessons append as `L{n+1}` in Lessons | GWnn, Season, Squad, Lessons |

> How to do each step (data scripts, comparison tables, projections, matchups, lock/close checklist) → skill `fpl-gw`.

## 5. Lessons Format
```markdown
### L15
**One-line rule** — what happened + the points impact → [[GWnn]]
```
- Number lessons after the last one; never renumber.
- If a lesson repeats an old one, append `[[GWnn]]` to the existing lesson instead of adding a new one.

## 6. Stop Conditions — stop and ask the user
- About to write points/ranks without a screenshot or source.
- Vault data contradicts what the user says (e.g. `Squad.md` differs from their latest screenshot).
- About to edit a GW with `status: closed`.
- About to create a file outside the layout in §2.

## 7. Final Summary Contract (every time the workspace is written)
End the answer with:
```
Vault updated:
- <file>: <what changed, one line>
Unknown / pending: <what is still missing, or "none">
```

## 8. Data Source — FPL API (free, no login)
Base: `https://fantasy.premierleague.com/api/` — unofficial/undocumented (the FPL site uses it itself); the schema can change.

| Endpoint | Use |
|---|---|
| `bootstrap-static/` | all players (`elements`: `now_cost`/10, `status`, `chance_of_playing_next_round`, `news`, `news_added`, `transfers_in_event`/`out_event`, `form`, `ep_next`, G/A/CS/xGI/`defensive_contribution`, `yellow_cards`), teams (`teams`), GWs (`events`: `deadline_time` UTC, `finished`) |
| `fixtures/?event={gw}` | fixtures of a GW + FDR (`team_h_difficulty`/`team_a_difficulty`) + results |
| `fixtures/` | the whole season's fixtures → team GF/GA/CS |
| `element-summary/{player_id}/` | a player's match history + remaining fixtures |
| `event/{gw}/live/` | live points per player in a GW |
| `entry/{team_id}/` · `entry/{team_id}/history/` · `entry/{team_id}/event/{gw}/picks/` | the manager's team: rank, history, picks (after the deadline) |

**Fetching**
- Send a browser-like User-Agent (`curl -s -A "Mozilla/5.0" <url>`); bare requests can be blocked.
- The `fpl-gw` skill's node scripts fetch and cache these for you. Keep fetched JSON outside the workspace.

**Watch out**
- `ep_next` ≈ `form` (not fixture-adjusted) — don't use it as the main projection.
- `status`: a=available, d=doubt, i=injured, s=suspended, u=unavailable.
- While FPL updates (after the deadline / after matches) the API answers "The game is being updated" → wait and retry.
- Login-only data (your team before the deadline, selling prices, transfers) is not available → use a screenshot from the user.
- Cite API numbers as: `FPL API <endpoint> — fetched YYYY-MM-DD HH:MM UTC`.

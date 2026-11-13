---
name: fpl-gw
description: Help with Fantasy Premier League gameweek planning — team news, transfers, captain/vice, opponent matchups and xPts projections. Use for FPL questions and follow-ups, including Thai prompts such as "check ข่าว", "C ใคร" and "คาดการณ์คะแนน". Works directly in chat; optionally saves plans and results in a plain Markdown workspace.
metadata:
  author: "Encrypted Arc <36179756+encryptedarc@users.noreply.github.com>"
  tags: "fantasy-premier-league, football, planning"
---

# FPL Gameweek assistant

## Harness capabilities

This is a portable skill folder: keep SKILL.md, scripts/, references/ and assets/ together. It does not require a particular model, plugin system, slash command or vendor environment variable. Resolve resources relative to this skill folder. Use whatever file, execution, HTTP, search and browser tools the host provides. Node.js 18+ and network access are needed to run the bundled data scripts; workspace persistence additionally needs file-write access. Web search and browser access enrich news/matchups but are optional: when unavailable, use supported API data or user-provided evidence and state what could not be checked. Do not invent unavailable tools, delegate to a named agent, or fabricate fresh data. If the host cannot run scripts, explain that limitation and work only from evidence it can access.

## Choose the mode

**Quick mode is the default.** Work from the squad screenshot, player names, budget and decisions provided in this chat. Do not require Obsidian, workspace rule files, `Squad.md`, a team ID or any folder setup. Ask only for missing information needed for the requested analysis. A comparison of two players does not need the full squad; a team projection needs the XI and, for auto-subs, the ordered bench. Do not create notes, initialize folders or claim durable memory. Explain that history is not saved to files when the user asks to save or continue across chats. Scripts may cache API responses outside the workspace.

**Workspace mode is optional.** Use it when the user selects an existing FPL workspace, sets `FPL_WORKSPACE` (legacy: `FPL_VAULT`), or is working in a folder whose shared rules (`AGENTS.md`, or legacy `CLAUDE.md`) have the heading `FPL Workspace — Agent Protocol` or the legacy `FPL Vault — Agent Protocol`. An explicit path wins over environment settings. A random `Squad.md` alone does not authorize note writes. Read the workspace AGENTS.md when present and applicable local instructions before reading or writing workspace content. Existing workspaces may keep their customized legacy CLAUDE.md; read and follow it too, and do not migrate or replace those rules implicitly; apply the baseline rules below in both modes and the workspace's extra conventions when present. If current evidence conflicts with saved data, flag the conflict before updating files.

Resolve the workspace path in this order: the user-named folder, `FPL_WORKSPACE`, `FPL_VAULT`, then the recognized current folder. Use it consistently for file access and `--workspace`. Explicit player inputs override the saved squad for that script invocation; this does not change the saved squad or opt the user into persistence.

No workspace yet? Continue in Quick mode. Only when the user requests persistent history, offer `node "<skill-dir>/scripts/init-vault.js" --dir "<folder>" --season YYYY-YY`. This creates plain Markdown files without overwriting existing ones; Obsidian is optional. The legacy script name is retained for compatibility.

## Rules in both modes

- Check the current UTC time against the requested GW's API deadline before giving time-sensitive advice. Say when it has passed; the user makes all changes in FPL themselves. If live data is unavailable, state what could not be verified rather than inventing a countdown or current news.
- Never invent points, ranks, prices, selling prices, ITB, free transfers or hits. Use `unknown` for missing facts, ask when they gate a recommendation, and distinguish a hypothetical scenario from the user's actual team.
- Label model estimates `(est.)` or the user's chosen equivalent. Cite API endpoint/web source and date for external numbers. Reports distinguish `generated` time from per-endpoint Data sources: `fetched` means a network retrieval, while `cached` gives the cache file timestamp with retrieval time unverified. Preserve that distinction when citing cached data; use `--fresh` for volatile news.
- Check publication date and season for news. Keep player/football terminology in English; otherwise use the user's language, or their workspace preference when provided.
- Before finalizing a transfer or XI, check the available squad, budget/selling prices, positional and club limits, captain/vice, bench order and chip/FT/hit assumptions relevant to that plan. In Workspace mode also run `Lessons.md`'s checklist. Missing lessons are not a prerequisite for Quick mode.
- The user chooses the plan. Do not describe a plan as confirmed before they confirm it, or imply that a saved plan changes their FPL account. Closed recorded results require new evidence and a dated correction; never silently overwrite them.
- Flag changes to earlier advice and explain which new fact or assumption changed the conclusion. Do not guess information from a previous chat that is not available now.
- FPL API is public and undocumented. Login-only/pre-deadline team details and selling prices need user evidence. During API maintenance, report the outage and retry later. Do not use `ep_next` as the main fixture-adjusted projection.

## Start each request

1. Identify the requested GW and check its deadline with `news.js` or API `bootstrap-static/` events. `news.js` without player input can show the deadline and fixtures in Quick mode.
2. In **Quick mode**, use the current chat and gather only the missing inputs. Pass the player pool explicitly to scripts so an unrelated current-folder squad is not read.
3. In **Workspace mode**, read shared workspace rules (`AGENTS.md` plus applicable local/legacy rules) → `Squad.md` → `Lessons.md` → the relevant/latest GW note → relevant Season/Fixtures sections. Re-list `GW/` before claiming a note is absent; follow any season-subfolder convention in local rules. Prior Decision path items are the recorded reasoning.
4. Read only the references needed below. Their `Write` sections apply **only in Workspace mode**. In Quick mode return the same analysis in chat without requiring or creating any notes.

| Intent | Reference | Script |
|---|---|---|
| News, injuries, availability | [news](references/news.md) | `news.js` |
| Compare transfers | [transfer](references/transfer.md) | `compare.js`, `projection.js --gws` |
| Captain / vice | [captain](references/captain.md) | `compare.js`, `projection.js` |
| Opponent defence / attack | [matchup](references/matchup.md) | `opponent.js`, browser if available |
| xPts / projected XI | [projection](references/projection.md) | `projection.js --sims` |
| Confirm/save plan, review results | [lock and close](references/lock-close.md) | Chat summary or workspace updates |

## Scripts: Node 18+, no dependencies

Resolve `scripts/` relative to this installed skill directory, not the user's working directory. Run scripts by absolute path; do not require the user to change directories or install Obsidian.

- `news.js [--gw N] [--players "Name:CLUB,..."] [--extra "Target:CLUB,..."]` — explicit `--players` replaces the saved squad; `--extra` adds targets to that selection or workspace squad. Without players or a squad, returns deadline and fixtures only.
- `compare.js --players "A:CLUB,B:CLUB" [--n 6] [--from GW]` — comparison and fixture ticker, no workspace needed.
- `opponent.js --teams ARS,CHE [--last 5]` — team statistics, no workspace needed.
- `projection.js [--players "A:CLUB,B:CLUB"] [--xi "..."] [--bench "..."] [--captain X] [--vice Y] [--sims 20000] [--gw N | --gws A-B] [--extra "Target:CLUB"] [--if-starts "..."] [--minutes "Name:0"]` — player pool comes from `--players`, otherwise XI + bench, otherwise optional `Squad.md`. `--extra` adds targets. Captain/vice and scenario names must resolve uniquely within that pool; `Name:CLUB` is supported. Minutes accept `Name:0` or `Name:CLUB:0`, with values from 0 to 90. Supply the full 11 and ordered bench for a meaningful team simulation; partial inputs are not a complete team forecast.
- `init-vault.js --dir <folder> [--season YYYY-YY]` — optional Markdown workspace scaffold; never overwrites existing files.

Shared data-script options: `--workspace <dir>` (legacy `--vault`), then `FPL_WORKSPACE` / `FPL_VAULT`, then cwd for reading `Squad.md` if no explicit players. A missing explicitly selected workspace squad is an error; do not silently switch teams. `--cache <dir>` defaults to OS temp `fpl-cache`; `--fresh` refetches volatile data, not finished-GW live caches.

Projection limitations: DGWs are not modelled. If any selected player (including bench or extra targets) has multiple fixtures in any requested GW, the entire command exits with an explanatory error before printing forecasts. Do not retry by dropping a DGW player from a full-team forecast; explain that the requested team forecast is unsupported. Cards, own goals, penalty saves, form trends and chip multipliers are not modelled. Auto-subs are included only with `--sims`. Team xG is FPL-derived; keep other providers' numbers separate and flag disagreements. `news.js` times are TH (UTC+7); fixtures with no kickoff time appear last as `TBC`.

## Answer and persistence

Present deadline context, useful comparison tables, recommendation with estimates, material uncertainty/changed advice, and dated sources. Ask a follow-up only if a concrete choice or required input remains.

**Quick mode:** keep plans, confirmation and results in chat. For a confirmed plan, recap transfers, XI, C/V, bench and risks using only known inputs; remind the user to act in FPL. For results, request evidence for missing scores and compare against any projection available in this chat. Do not emit `Vault updated` or claim files were saved. A request to save to disk requires a chosen workspace destination; initialization is optional, not a gate to analysis.

**Workspace mode:** Plan → Refine → Lock → Close follows shared workspace rules and [lock-close](references/lock-close.md). Refine appends dated Team news and numbered Decision path items; never remove or renumber old reasoning. Correct earlier items by appending a reference to the old item. Lock requires user confirmation. Keep schema headings in order and extra analysis inside Decision path items. Finish file writes with the workspace's summary contract (legacy `Vault updated` is supported); no update block is needed for read-only answers.

---
tags: [fpl, meta]
---
# FPL Workspace

This optional folder stores plain Markdown plans and results. Open it in any text editor; Obsidian is not required. The fpl-gw skill can also work in Quick mode without a workspace, using player names or screenshots supplied in chat.

| Path | What it is for |
|---|---|
| [Season dashboard](Season%20{{SEASON}}.md) | Total points, GW log, chips and captain record |
| [Squad](Squad.md) | Current squad, ITB and watchlist |
| [Lessons](Lessons.md) | Pre-deadline checklist and lessons from results |
| [Fixtures](Fixtures%20{{SEASON}}.md) | Fixtures and FDR matrix |
| `GW/GW01...` | One note per gameweek |
| [GW template](Templates/GW%20Template.md) | Template for a new GW |

The Season dashboard includes normal Markdown tables. Its optional Dataview block renders automatically only in Obsidian with the Dataview plugin; other editors can use the tables directly.

## Weekly rhythm

1. Before the deadline, ask your agent to plan the GW.
2. Refine with news, comparisons and projections.
3. Confirm the plan, then make the changes yourself in FPL.
4. Send result evidence to review the GW and record lessons.

Open your agent in this folder, or set `FPL_WORKSPACE` to this path. Scripts also accept `--workspace <folder>`; legacy `--vault` and `FPL_VAULT` remain supported. Explicit `--players` selects a player pool instead of reading the saved squad. With news, use `--extra` to add targets to the saved squad.

Shared rules: [AGENTS.md](AGENTS.md). The optional CLAUDE.md compatibility pointer refers to the same rules; the workspace does not require a particular harness.

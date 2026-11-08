---
description: Optionally create a plain Markdown FPL workspace for saved plans and results; Obsidian is not required
argument-hint: "[folder] [season e.g. 2026-27]"
---

Set up an optional plain Markdown workspace for the `fpl-gw` skill. This command is not needed for Quick mode: users can send their squad or player names and ask questions directly in chat. Obsidian and Dataview are optional viewers, not prerequisites.

1. Parse `$ARGUMENTS` as a folder and optional season, preserving quoted folder paths with spaces. If no folder is given, ask where the workspace should live (any ordinary folder works). Season: second argument, or let the script pick the current one. Do not initialize an unrelated current folder automatically.
2. Run:
   `node "${CLAUDE_PLUGIN_ROOT}/skills/fpl-gw/scripts/init-vault.js" --dir "<folder>" [--season YYYY-YY]`
   It never overwrites existing files — report what it created and what it kept.
3. Ask the user for:
   - their current squad (a screenshot of the FPL "Pick Team" page is easiest) → fill the `Squad.md` table (Pos | Player | Club | buy price);
   - the language they want the notes in → set CLAUDE.md §1 rule 8;
   - optionally their FPL team id (the number in `fantasy.premierleague.com/entry/<id>/…`) → CLAUDE.md §0.
4. Tell them to open a Claude Code session in that folder (or set `FPL_WORKSPACE=<folder>`; legacy `FPL_VAULT` still works) and try "check news" or "who should I captain this week?". Saved Markdown is readable in any text editor. Obsidian + Dataview is only an optional dashboard integration.

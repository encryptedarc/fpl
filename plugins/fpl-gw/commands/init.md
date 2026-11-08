---
description: Create a new FPL vault (rules, squad, lessons, season dashboard, GW template) in a folder
argument-hint: "[folder] [season e.g. 2026-27]"
---

Set up an FPL vault for the `fpl-gw` skill.

1. Target folder: use the first argument if given ($ARGUMENTS); otherwise ask the user where the vault should live (an Obsidian vault subfolder like `<vault>/FPL` works well). Season: second argument, or let the script pick the current one.
2. Run:
   `node "${CLAUDE_PLUGIN_ROOT}/skills/fpl-gw/scripts/init-vault.js" --dir "<folder>" [--season YYYY-YY]`
   It never overwrites existing files — report what it created and what it kept.
3. Ask the user for:
   - their current squad (a screenshot of the FPL "Pick Team" page is easiest) → fill the `Squad.md` table (Pos | Player | Club | buy price);
   - the language they want the notes in → set CLAUDE.md §1 rule 8;
   - optionally their FPL team id (the number in `fantasy.premierleague.com/entry/<id>/…`) → CLAUDE.md §0.
4. Tell them to open a Claude Code session in that folder (or set `FPL_VAULT=<folder>`) and try "check news" or "who should I captain this week?".

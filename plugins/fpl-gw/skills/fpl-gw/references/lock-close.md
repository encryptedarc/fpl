# Step: Lock and Close

## Quick mode — chat only

On confirmation, recap the known transfers, XI, C/V, bench and accepted risks in chat. List missing inputs as pending; do not create notes, require setup or claim to save anything. Remind the user to make changes in FPL. For results, use screenshot/API evidence and compare with any projection available in this chat; keep unverified scores/ranks `unknown`. If the user wants files saved, ask for a workspace destination and offer optional initialization. Do not imply access to decisions from unavailable previous chats.

## Workspace mode — persistent history

The remaining checklists apply only to an opted-in Markdown workspace. Its CLAUDE.md §4 steps 3–4 define file changes. Obsidian is not required.

## Lock — only after the user confirms the plan

Trigger: the user picks an option ("save the plan, I pick A", "lock it", "บันทึกแผน"). If something is still open (ITB, a bench choice), lock what's decided and list the rest as pending — don't fill gaps with guesses.

1. Re-run the Lessons checklist (Hard Rule 7) in one line: ✅/⚠️ per item.
2. `GW/GWnn.md`:
   - frontmatter: `status: locked`, `transfers`, `hit`, `chip`, `captain`, `vice`
   - title: `# GWnn — 🔒 locked · <transfer> · C X / V Y`
   - `## Transfers`: table OUT/£/IN/£, ITB after (`unknown` + estimate if no screenshot), FT left → next GW
   - `## XI`: formation, lines, C/V, bench order (bench #1 = most certain starter; if a starter's minutes are at risk, put the same-position backup who kicks off at the same time first)
   - Decision path: final item "user chose …" + any corrections
   - `## Risks accepted`: each risk the plan knowingly takes (template-captain fade, rotation risk, money left…)
3. Overwrite `Squad.md`: `updated`, `as_of`, `itb`, `free_transfers_next`, squad table (new player's buy price + GW), prices line with fetch time, XI line, ITB line, club count, watchlist (move sold player out, add next GW's targets).
4. Remind the user to make the moves in the FPL app before the deadline — the vault doesn't change their team.

## Close — when the user sends results

Needs evidence (screenshot or FPL API `entry/` endpoints if `team_id` is known); otherwise fields stay `unknown` (Hard Rule 2).

1. `GW/GWnn.md`: frontmatter `points avg highest gw_rank overall_rank captain_pts bench_pts`, `status: closed`; fill `## Result` (per-player pts) and `## Review` (what worked / what didn't / lessons).
2. `Season YYYY-YY.md`: add a GW-log row and a Captain-record row; update Chips if used.
3. `Lessons.md`: new lesson → `### L{n+1}` in CLAUDE.md §5 format; repeat lesson → append `[[GWnn]]` to the existing one. Patterns section for 1-sample observations.
4. Compare result vs the projection item and say where the model missed (minutes? captain? CS?) — this is how the model improves.
5. After the GW is closed, edits need new evidence + a `> correction YYYY-MM-DD:` line (Hard Rule 3).

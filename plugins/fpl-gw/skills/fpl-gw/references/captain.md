# Step: Captain / vice

Default is the template captain — the most-owned premium (Haaland in 2026-27). Dodging him only because "the fixture looks hard" is a classic way to lose points; check the vault Lessons for the user’s own record on this. There is **no fixed edge threshold** for switching: the user decides. Your job is to lay out the numbers and the trade-off honestly.

## Do

1. `node scripts/compare.js --players "<C candidates>"` — rates, minutes pattern, penalty order, last-3 xGI.
2. Opponents: `node scripts/opponent.js --teams <each candidate's GW opponent>` — season and last-5 xGA, home/away split. Deeper dive → `references/matchup.md`.
3. `node scripts/projection.js --xi … --captain X --vice Y --if-starts "<candidates>"` — compare **both** columns:
   - unconditional xPts (minutes averaged over last 5, so one 0′ drags it down), and
   - "if starts" xPts. When previews expect the player to start, this is the relevant number.
4. Ownership: report `selected_by_percent` of the template captain. If the user goes against ~80% ownership, a template haul costs rank even when the pick was +EV — say this every time, in one line.

## Output

| | Candidate A | Candidate B | Candidate C |
|---|---|---|---|
| xG/90 · xGI/90 | | | |
| pts/90 · ppg | | | |
| minutes pattern | | | |
| pen order | | | |
| sel% | | | |
| GW opponent (xGA/g, rank) | | | |
| xPts · if starts | | | |

Then the options as **C X / V Y** pairs with ✅/❌, and the EO line. If the analysis changes your earlier lean (it did once: a "1.35× edge" shrank to ~+1.1 if-starts once minutes were modelled) — flag it under `⚠️`.

## Vice

- The vice gets doubled when the captain plays 0′, **regardless of kickoff order** (FPL applies it at GW end).
- Pick the vice as the next-best captain option, not by kickoff time.

## Write

Decision-path item. At lock, frontmatter `captain:` / `vice:` and the `## XI` C/V line.

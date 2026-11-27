# Step: Captain / vice

Compare the candidates against the current template captain using verified ownership and available evidence. Use the user's relevant history from this chat, or workspace Lessons when available. There is **no fixed edge threshold** for switching: the user decides. Lay out the numbers and the trade-off honestly; do not require a lessons file to answer.

## Do

1. `node scripts/compare.js --players "<C candidates>"` — rates, minutes pattern, penalty order, last-3 xGI.
2. Opponents: `node scripts/opponent.js --teams <each candidate's GW opponent>` — season and last-5 xGA, home/away split. Deeper dive → `references/matchup.md`.
3. `node scripts/projection.js --xi … --captain X --vice Y --if-starts "<candidates>"` — compare the template captain and credible alternatives on the same model. Report both columns in base points per player before the captain multiplier:
   - unconditional xPts (minutes averaged over last 5, so one 0′ drags it down), and
   - "if starts" xPts. When previews expect the player to start, this is the relevant number.
4. Use any template-captain lesson to require current evidence. Give the candidate’s minutes and role, the opponent’s relevant xGA split, and the projected gap. If the numbers are unavailable, name the missing evidence before giving a provisional lean.
5. Report `selected_by_percent` as ownership. Give effective ownership only when a separate source measures it for the relevant cohort and GW. Use verified figures to explain rank exposure.

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

Then give **C X / V Y**, the estimated points gap and the minutes or matchup evidence that could change the choice. If the analysis changes your earlier lean, give the reason.

## Vice

- The vice gets doubled when the captain plays 0′, **regardless of kickoff order** (FPL applies it at GW end).
- Pick the vice as the next-best captain option, not by kickoff time.

## Write (Workspace mode only)

Decision-path item. At lock, frontmatter `captain:` / `vice:` and the `## XI` C/V line.

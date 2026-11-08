# Step: Matchup — opponent defence vs our attack

Use when the user asks how leaky an opponent is, where they concede, or wants defence-vs-attack reasoning behind a captain/transfer.

## Data sources (in this order)

1. **FPL-derived** (always): `node scripts/opponent.js --teams <opps>,<our attacking teams>` — results, team xG for/against (sum of player `expected_goals`, own goals excluded), last 5, home/away, league xGA/xGF ranks. This is the projection's source of truth (one framework — don’t mix providers inside the projection).
2. **xGstat via an in-app browser, if this session has one** (situational detail): open
   `https://www.xgstat.com/teams/<team-slug>?season=<id>&competition=premier-league` then `get_page_text`. Slugs look like `crystal-palace`, `nottingham-forest`, `manchester-city`. Find the season id from a WebSearch result URL if unknown (2026-27 was `185618`).
   Free fields worth taking:
   - Key stats: xG, shots, goals conceded, xGA, **shots faced** (+ league rank), clean sheets, PPDA
   - **Goals & xG by situation**: open play / set pieces / penalties / own goals, conceded vs xGA
   - **Defence label** like "League-worst vs LW" (weakest against left wingers) or "League-worst vs CB" (concedes most to opposing centre-backs → set pieces)
   - Shape (formation), style tags (low block, counter-attacking, combative…), last XI, win probability, minutes share
   - Pro-only (don't promise): shots by location, home/away table, playing-style detail
   - In a team's "Next 5" table, `Opp. xGA rank` / `Shots faced` describe the **opponent**, likely venue-specific
3. **WebSearch** for narrative (injured CBs, tactical pieces). Keep source + date.

Understat, Sofascore, and xGstat via curl return bot pages — skip them.

## Analysis frame

For each candidate, pair **their weakness** with **our strength**:

| Defence | Opp 1 | Opp 2 |
|---|---|---|
| xGA/g (rank) · shots faced/g | | |
| conceded open play (xGA) | | |
| conceded set piece (xGA) | | |
| weakness label · shape · style | | |

| Attack | Team 1 | Team 2 |
|---|---|---|
| xG/g (rank) · % shots in box | | |
| open play G (xG) · set piece G (xG) | | |
| key attacker minutes share · pen order | | |

Then one line per matchup: does the opponent's weak channel feed **this player's** scoring route? (e.g. a set-piece weakness helps the CBs more than the striker; a weak right side helps the opposing left winger more than the centre-forward.)

## Checks

- Different providers give different xGA — show both and say which feeds the projection.
- Symmetric context: midweek games, absences — check both sides.
- 9-game samples are noisy; GA far above xGA usually means bad luck, not a bad defence.

## Write

Decision-path item with both tables, matchup lines, sources (URLs), and any correction of earlier items.

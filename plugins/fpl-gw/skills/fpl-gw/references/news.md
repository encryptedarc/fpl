# Step: Team news

Goal: tell the user, fast, whether anything in their squad or shortlist changed since the last check — and record it.

## Do

1. Quick mode: `node scripts/news.js --players "<squad or requested players>" --extra "<targets>"`. Workspace mode: `node scripts/news.js --workspace "<folder>" --extra "<targets + rivals for minutes>"` (omit `--extra` when not needed). Explicit `--players` replaces rather than supplements the saved squad.
   - Extras worth adding: transfer targets in the Decision path, and direct competitors for a squad player's minutes (e.g. `Saliba:ARS` vs Konsa, `Yarmoliuk:BRE` vs Sangaré).
2. Diff against the previous news in this chat, or the last `Team news` entry when using a workspace. If no baseline exists, present the current status without claiming a change. A status flip (`d`→`a`, news cleared) is the headline.
   - `YC … ⚠️ban-risk` = one booking from a suspension (5/10/15 yellows). A card in the coming game costs the *next* GW, so mention it for planning even when the player is fine today.
   - While a GW is under way the table also shows live minutes/points; summarise what's banked and who is still to play.
3. Press conferences: search with an available web-search tool, prioritizing fresh sources close to the deadline, for `FPL Gameweek <N> team news press conference injuries <Month YYYY>`. Only keep items that touch the squad, targets, or their opponents.
   - Search summaries are thin and often surface last season's articles. When that happens, **read the pages directly** (use the host's available page-reading or browser capability; if none is available, state that the article could not be checked and do not invent details): the FFS live team-news blog for that day (URL pattern `fantasyfootballscout.co.uk/YYYY/MM/DD/fpl-gameweek-<N>-team-news-…`, taken from search results), FFS predicted line-ups (`fantasyfootballscout.co.uk/team-news/`), and the club's own news page for presser quotes. A baseline run that did this found details search missed (players back from injury on the opponent side, international call-ups as a fitness signal).
   - Record the club, opponent and current-season publication date for any material update. If still unresolved, report which sources were checked, when, and whether the item was unpublished, inaccessible, or silent about the player.
4. Sanity-check web summaries against the user's supplied facts and any workspace records before flagging them as errors — managers and squads change between seasons; a summary that "looks wrong" may be right.
5. Single-source claims → mark `(single source)`.

## Output table

| Player | GW fixture | FPL flag / news date | Expected role | What would change the decision |
|---|---|---|---|---|

For players whose minutes affect a decision, check recent starts, cameos and 0-minute matches, direct competition, and manager comments. An available flag or a 100% availability field gives fitness context. Record start/cameo risk separately. Record whether the official lineup is due before the FPL deadline and apply a late-lineup lesson only when minutes are also uncertain.

For GK cover, distinguish the reserve keeper being fit from the reserve keeper being expected to play. The auto-sub supplies points only if the starting GK plays 0 minutes and the reserve plays. Show the zero-points scenario if both could miss out.

Report market price and weekly change (Δ£ from cost_change_event) from the same bootstrap snapshot. When comparing with an earlier snapshot, label that difference as a change since the previous check. If a copied number conflicts with the bootstrap snapshot, use the snapshot value and flag the discrepancy. When recording a correction, follow the local workspace rules. Confirm that chat and the saved note cite the same value.

If price timing could affect the move, check the next price update against the GW deadline using the rules for that season. Use the official Price Change Predictor when available. Label net transfers as context and keep any price forecast conditional. If the next update is after the GW deadline, say so and keep the deadline as the action time.

## Write (Workspace mode only)

Append to `## Team news`:
```
- YYYY-MM-DD (<what> · FPL API fetched YYYY-MM-DD HH:MM UTC):
  - ✅/⚠️ <player> <status change> …
```
If it changes an earlier decision (e.g. a bench rule hinged on a `d` flag), add a Decision-path item saying which item is now void and why.
For cached API data, replace the example's `fetched` attribution with the endpoint's `cached` label and cache file timestamp from Data sources, preserving that retrieval time is unverified. The report's `generated` time is not a data retrieval time.

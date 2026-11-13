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
   - Check the article date against the current season before using it.
4. Sanity-check web summaries against the user's supplied facts and any workspace records before flagging them as errors — managers and squads change between seasons; a summary that "looks wrong" may be right.
5. Single-source claims → mark `(single source)`.

## Output table

| Our player | GW fixture | News | Impact |
|---|---|---|---|

Then: price changes this GW (Δ£) for squad + targets, and big net-transfer numbers as a hint of the next price move (a hint only — don't predict exact rises/falls).

## Write (Workspace mode only)

Append to `## Team news`:
```
- YYYY-MM-DD (<what> · FPL API fetched YYYY-MM-DD HH:MM UTC):
  - ✅/⚠️ <player> <status change> …
```
If it changes an earlier decision (e.g. a bench rule hinged on a `d` flag), add a Decision-path item saying which item is now void and why.
For cached API data, replace the example's `fetched` attribution with the endpoint's `cached` label and cache file timestamp from Data sources, preserving that retrieval time is unverified. The report's `generated` time is not a data retrieval time.

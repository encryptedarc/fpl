# Step: Compare transfers (A vs B)

Goal: compare the feasible routes and state what would make a conditional route affordable.

## Do

1. `node scripts/compare.js --players "<in-1>,<in-2>,<out>" [--from <GW>]` — always include the player being sold as the baseline column. The ticker starts at the next GW by default; pass `--from` when planning further ahead.
   - The `G+A vs xGI` row flags over/under-performance including assists (e.g. 3 assists from 0.58 xA).
2. **Explain the minutes.** For every buy target with a 0′ or an early sub-off in the last 5, find out why (search the web using the host's available tool: `<player> injury` / `<player> minutes <manager>` + month/year; read the page if the summary is thin). An injury that has healed, rotation for Europe, and a tactical role that ends at 65′ each mean something different for the next 6 GWs. Mark it `(single source)` when only one source says it.
3. Budget math **before** recommending (never say a move works until the numbers do):
   - Selling price: if current price < buy price, sell = current; if it rose, sell = buy + floor(rise/2), using integer £0.1m units. Use prices supplied by the user or screenshot, or `Squad.md` in Workspace mode. If buy/selling price is missing, ask or keep affordability conditional.
   - Show market price, sale proceeds, and incoming price separately. Derived proceeds from saved buy prices are (est.) until verified. State minimum ITB = max(0, total incoming costs − total sale proceeds) in £0.1m units. If an outgoing price is missing, keep the formula conditional on that price. Request the Transfers view only to verify the fields that could change affordability.
   - Positions must match (FWD out → FWD in).
4. Calculate club counts after all moves in the route. For any stack, identify the scoring routes that move together (such as same-club GK/DEF clean sheets) and what changes after the transfer. A same-club replacement keeps that club exposure. Check the resulting counts against the three-per-club limit.
5. Ticker: next 6 GWs FDR sum — lower is better; check API fixtures for blanks/doubles, or the workspace's `Fixtures YYYY-YY.md` when available.
6. Over/under-performance: `compare.js` marks `⚠️ over` / `⚠️ under` when G+A − xGI ≥ 2 or ≤ −2. Mention regression either way; it's not an automatic veto — an under-performer you're selling may be about to score.
7. Expected points over the horizon: `node scripts/projection.js --gws <a>-<b> --xi "…" --extra "<targets>"` prints per-GW tables and a per-player sum, so the sold player and the targets are compared on the same model.
8. For an overall GW plan, compare the current XI at 0 FT against the best viable 1 FT and 2 FT routes within the requested scope and available FT. Hold model, horizon, captain and minutes assumptions consistent where possible. Show the effect on the starting XI, with bench cover reported separately, and identify how many FT and how much money carry into next GW. When there are priced candidates but evidence to rank them is missing, show a named conditional route with its known budget and mark its ranking pending. When a candidate or input is missing, name the missing item on that route. A focused player comparison can use the requested players and horizon.

## Output

The `compare.js` table (trim rows that don't matter for this decision), then:

- `(est.)` a rough per-90 points gap: appearance 2 + xG/90 × goal pts + xA/90 × 3 (+ bonus/90 if relevant), then × GWs held, before fixture adjustment. Say it's rough.
- For full plans, show one row per route with moves, minimum ITB or the missing budget input, projected XI gain vs 0 FT (est.), and FT carried forward. Give the recommendation as **"A if ITB ≥ X, otherwise B"** when budget is the deciding factor.
- Relevant budget, positional, club-limit and FT/hit checks as one line of ✅/⚠️; also apply the Lessons checklist in Workspace mode.

## Write (Workspace mode only)

Decision-path item with the table, budget lines, recommendation and checklist. Leave `## Transfers` as draft until lock.
If the question is about a GW whose note doesn't exist yet, follow the shared workspace rules' §4 step 1 (Plan): create `GW/GWnn.md` from `Templates/GW Template.md` with `status: planning` and put the analysis there as Decision path item 1.

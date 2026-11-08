# Step: Compare transfers (A vs B)

Goal: a decision the user can make in one look, with the budget already proven.

## Do

1. `node scripts/compare.js --players "<in-1>,<in-2>,<out>" [--from <GW>]` — always include the player being sold as the baseline column. The ticker starts at the next GW by default; pass `--from` when planning further ahead.
   - The `G+A vs xGI` row flags over/under-performance including assists (e.g. 3 assists from 0.58 xA).
2. **Explain the minutes.** For every buy target with a 0′ or an early sub-off in the last 5, find out why (WebSearch: `<player> injury` / `<player> minutes <manager>` + month/year; read the page if the summary is thin). An injury that has healed, rotation for Europe, and a tactical role that ends at 65′ each mean something different for the next 6 GWs. Mark it `(single source)` when only one source says it.
3. Budget math **before** recommending (never say a move works until the numbers do):
   - Selling price: if current price < buy price, sell = current; if it rose, sell = buy + floor(rise/2). Buy prices are in `Squad.md`.
   - ITB is often `unknown` in the vault. Then state the minimum ITB each option needs (e.g. "A needs ITB ≥ £3.2m") and make the recommendation conditional on it. Don't invent ITB.
   - Positions must match (FWD out → FWD in).
4. Club count after the move ≤ 3.
5. Ticker: next 6 GWs FDR sum — lower is better; note any blanks/doubles from `Fixtures YYYY-YY.md`.
6. Over/under-performance: `compare.js` marks `⚠️ over` / `⚠️ under` when G+A − xGI ≥ 2 or ≤ −2. Mention regression either way; it's not an automatic veto — an under-performer you're selling may be about to score.
7. Expected points over the horizon: `node scripts/projection.js --gws <a>-<b> --xi "…" --extra "<targets>"` prints per-GW tables and a per-player sum, so the sold player and the targets are compared on the same model.
8. If the comparison is for a long hold, think one GW ahead: what does each option leave for next week's FT (money left, which sale becomes possible)?

## Output

The `compare.js` table (trim rows that don't matter for this decision), then:

- `(est.)` a rough per-90 points gap: appearance 2 + xG/90 × goal pts + xA/90 × 3 (+ bonus/90 if relevant), then × GWs held, before fixture adjustment. Say it's rough.
- Recommendation as **"A if ITB ≥ X, otherwise B"** when budget is the gate.
- Lessons checklist results (Hard Rule 7) as one line of ✅/⚠️.

## Write

Decision-path item with the table, budget lines, recommendation and checklist. Leave `## Transfers` as draft until lock.
If the question is about a GW whose note doesn't exist yet, that is CLAUDE.md §4 step 1 (Plan): create `GW/GWnn.md` from `Templates/GW Template.md` with `status: planning` and put the analysis there as Decision path item 1.

# Step: Projection

```
node scripts/projection.js --xi "<11 names>" --bench "<GK2>,<sub1>,<sub2>,<sub3>" --captain X --vice Y --sims 20000
        [--gw N | --gws A-B] [--extra "Target:CLB"] [--if-starts "…"] [--minutes "Konsa:60"]
```

Every number it prints is an estimate — label it the way the vault says (Hard Rule 4).

- `--sims` adds a Monte Carlo line per GW: mean, median, p10–p90. It samples each player's minutes from the last 5, goals/assists from Poisson, goals conceded once per team (so a clean sheet hits GK+DEF together), applies FPL auto-subs in `--bench` order (formation min 1/3/2/1) and the vice if the captain plays 0′. Use it whenever the user asks "คาดการณ์คะแนน" for the XI — a range answers "how good is this team this week" better than one number.
- `--gws 11-13` prints one table per GW plus a per-player sum — use it for transfer horizons.
- During a GW that is under way, fixtures already played use the real live points (`✔actual`, provisional until bonus is confirmed); say that the range only reflects the remaining games.

## Model (keep it — consistency across GWs matters more than sophistication)

- Team expected goals: `λF = team xGF/g × opp xGA/g ÷ league avg xG/g`, ±8% home/away. `λA` the same way for conceding. Team xG = sum of player `expected_goals` from `event/{gw}/live/` over finished GWs.
- Player share: season xG/90 and xA/90 × (λF ÷ team xGF/g) × expected minutes/90.
- Minutes: mean of last 5 GWs (0′ included), P(play) and P(60+) from the same 5. `--minutes` overrides one player (e.g. a rotation risk). `--if-starts` adds a column with P(start)=1 and minutes = mean of their 45′+ games.
- Points: appearance 1/2 · goal GK10/DEF6/MID5/FWD4 · assist 3 · CS (Poisson e^-λA) GK/DEF 4, MID 1 when 60′+ · goals conceded −1 per 2 (GK/DEF) · saves 1 per 3 (GK) · DefCon 2 × hit-rate (DEF ≥10, MID/FWD ≥12) · bonus = season bonus/90.
- Not modelled: cards, own goals, penalty saves, form trends; auto-subs only inside `--sims`. Say so.

## Presenting

- Table: player · opponent · minutes · xG · xA · CS% · DC% · xPts · if starts. Captain ×2 shown.
- XI total, "if C were the vice instead", and the captain edge if he starts.
- Sensitivities that move the total by ≥2: rotation risks (name the backup who auto-subs in), captain minutes.
- If this projection disagrees with an earlier ratio or claim in the conversation, flag it under `⚠️` with the reason (usually minutes or a different xGA source).
- Ranges come only from `--sims` (state the run count). Don't invent an interval by hand.
- Re-run named scenarios with `--minutes` (e.g. `--minutes "Konsa:0"` for "Saliba starts", `--minutes "Isak:85"` for "Isak starts") rather than computing auto-subs by hand.

## Write

Decision-path item `Projection GWnn` (labelled as an estimate) with model line, table, totals, sensitivities, source line.

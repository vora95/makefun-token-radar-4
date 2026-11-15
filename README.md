# Launch Radar

[![rank](https://make.fun/badge/token-radar-01/vora95/makefun-token-radar-4/rank.svg)](https://make.fun/bounty/token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/vora95/makefun-token-radar-4/reward.svg)](https://make.fun/bounty/token-radar-01)

What every pre-token launch is worth, and what farming it costs — from one sealed
DefiLlama snapshot, no network, no clock.

## What it does

`node main.ts --input <snapshot.json>` (with `MAKEFUN_OUTPUT_DIR` set) reads the
snapshot, ranks the 192 pre-token protocols it can see, and writes `board.json`,
the dashboard (`dashboard/`, with `data.js`), the four screenshots and
`dossier.json` to the output directory. The run is deterministic: the same
snapshot bytes always produce the same output bytes.

## The model

Implied value = a power-law curve fit by least squares on the 101 traded tokens
(`log10(mcap) = 7.11 + 0.493 × log10(TVL / $100M)`), times a family factor
(mean residual per category, shrunk n/(n+20), capped [0.5, 2.5]), times growth
(TVL two weeks ahead at the 7-day rate), times seasoning (x0.70 at launch, x1.15
at 18 months, x0.95 at 5 years), times a sibling factor (x0.50).

The curve is a **robust refit**: 5 of the 101 tokens sat beyond 2 standard
deviations of the first fit and were trimmed; the curve was refit on the 96
that remained. The 1.5 sd trim another entry used made our blind test worse,
so the cut was re-tuned on our own data — both cuts, and every rejected
variant, stay visible in the 8-variant selection table on the Method tab.

## Backtest (all computed from the snapshot, by the program)

- Leave-one-out: median miss **x2.70** (flat multiple x4.91), 53% within 3x.
- Time split, fit before 2024 (n=42): **x2.04** (flat x4.52).
- Time split, fit before 2025 (n=28): **x1.97** (flat x5.12).
- R² of the curve: 0.208. Bootstrap (200 draws, seeded): slope P5–P95 0.344–0.642;
  top value P5–P95 $49.0M–$143.3M.

## Farm verdicts (at $1,000, net of every fee and the 4% T-bill)

ROBUST 42 · FARM 76 · THIN 36 · SKIP 38. ROBUST beats all costs even at the low
end (P25) of the value band. Best net per hour on the whole board: Manifest
Trade +$33.88/h, Block Analitica +$24.95/h, Binaryx Platform +$24.45/h. Top
implied value: Steakhouse Financial, $81,998,174.

## Layout

- `main.ts` — the entrypoint: snapshot in, board + dashboard + dossier out.
- `lib/model.ts` — the model, the backtest and the farm economics.
- `dashboard/` — `index.html`, `app.css`, `app.js` (the data lands in `data.js`
  at run time).
- `screenshots/` — the four dossier shots: board, detail, filtered (FARM),
  method.
- `vendor/makefun-board.ts` — the kit's dossier library (untouched).

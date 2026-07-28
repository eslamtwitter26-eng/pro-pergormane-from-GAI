/**
 * Deterministic demo dataset for the UI preview build.
 *
 * This exists ONLY to render the interface without a login or a real
 * MetaTrader export. It produces `Trade[]` / `EquityPoint[]` and then hands
 * them to the *real* `analyzeAll`, so every number, chart and insight in the
 * preview is produced by the untouched production analysis pipeline.
 */
import { analyzeAll, type Trade, type EquityPoint, type AnalysisResult } from "@/lib/tradeAnalysis";

/** Small seeded PRNG so the preview looks identical on every load. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SYMBOLS = [
  { name: "EURUSD", weight: 0.26, edge: 0.62, avg: 145 },
  { name: "GBPUSD", weight: 0.19, edge: 0.58, avg: 132 },
  { name: "XAUUSD", weight: 0.22, edge: 0.55, avg: 210 },
  { name: "USDJPY", weight: 0.14, edge: 0.59, avg: 118 },
  { name: "AUDUSD", weight: 0.1, edge: 0.47, avg: 96 },
  { name: "US30", weight: 0.09, edge: 0.5, avg: 185 },
];

const INITIAL_BALANCE = 25_000;

function pickSymbol(r: number) {
  let acc = 0;
  for (const s of SYMBOLS) {
    acc += s.weight;
    if (r <= acc) return s;
  }
  return SYMBOLS[0];
}

export function buildDemoTrades(count = 420): { trades: Trade[]; equityCurve: EquityPoint[] } {
  const rand = mulberry32(20260728);
  const trades: Trade[] = [];
  const equityCurve: EquityPoint[] = [];

  // Roughly nine months of history ending today.
  const end = new Date();
  const start = new Date(end.getTime() - 270 * 24 * 60 * 60 * 1000);
  let balance = INITIAL_BALANCE;

  equityCurve.push({ time: new Date(start), balance, profit: 0 });

  for (let i = 0; i < count; i++) {
    const progress = i / count;

    // Spread trades across the window, clustered on weekdays.
    let openTime = new Date(start.getTime() + progress * (end.getTime() - start.getTime()) + rand() * 36e5 * 8);
    const dow = openTime.getDay();
    if (dow === 0) openTime = new Date(openTime.getTime() + 24 * 36e5);
    if (dow === 6) openTime = new Date(openTime.getTime() + 48 * 36e5);

    // Favour London / New York hours so the session charts look plausible.
    const hourRoll = rand();
    const utcHour = hourRoll < 0.18 ? 2 + Math.floor(rand() * 5)
      : hourRoll < 0.62 ? 7 + Math.floor(rand() * 6)
      : 13 + Math.floor(rand() * 8);
    openTime.setUTCHours(utcHour, Math.floor(rand() * 60), 0, 0);

    const sym = pickSymbol(rand());
    const type: "buy" | "sell" = rand() > 0.48 ? "buy" : "sell";
    const volume = parseFloat((0.1 + Math.floor(rand() * 8) * 0.05).toFixed(2));

    // A mild upward edge that improves slightly over time, plus a drawdown
    // stretch in the middle so the equity curve has real texture.
    const inSlump = progress > 0.44 && progress < 0.54;
    const skill = sym.edge + progress * 0.03 - (inSlump ? 0.13 : 0);
    const isWin = rand() < skill;

    const magnitude = sym.avg * (0.4 + rand() * 1.35) * (volume / 0.3);
    const gross = isWin ? magnitude * 1.05 : -magnitude * (0.72 + rand() * 0.36);
    const profit = parseFloat(gross.toFixed(2));
    const commission = parseFloat((-volume * 7).toFixed(2));
    const swap = rand() > 0.82 ? parseFloat((-rand() * 4).toFixed(2)) : 0;
    const netProfit = parseFloat((profit + commission + swap).toFixed(2));

    const durationMinutes = Math.round(6 + rand() * (isWin ? 340 : 150));
    const closeTime = new Date(openTime.getTime() + durationMinutes * 60_000);

    const basePrice = sym.name === "XAUUSD" ? 2340 : sym.name === "US30" ? 39_500 : sym.name === "USDJPY" ? 151 : 1.086;
    const tick = basePrice * 0.0012;
    const openPrice = parseFloat((basePrice + (rand() - 0.5) * tick * 12).toFixed(sym.name === "USDJPY" ? 3 : 5));
    const dir = type === "buy" ? 1 : -1;
    const closePrice = parseFloat((openPrice + dir * (isWin ? tick : -tick) * (0.6 + rand())).toFixed(sym.name === "USDJPY" ? 3 : 5));

    balance = parseFloat((balance + netProfit).toFixed(2));

    trades.push({
      openTime,
      closeTime,
      symbol: sym.name,
      type,
      volume,
      openPrice,
      closePrice,
      profit,
      commission,
      swap,
      netProfit,
      durationMs: durationMinutes * 60_000,
      durationMinutes,
    });

    equityCurve.push({ time: closeTime, balance, profit: netProfit });
  }

  trades.sort((a, b) => a.closeTime.getTime() - b.closeTime.getTime());
  equityCurve.sort((a, b) => a.time.getTime() - b.time.getTime());

  return { trades, equityCurve };
}

/** Demo trades run through the real, unmodified analysis pipeline. */
export function buildDemoAnalysis(): AnalysisResult {
  const { trades, equityCurve } = buildDemoTrades();
  return analyzeAll(trades, equityCurve);
}

export interface RawDeal {
  time: Date | null;
  symbol: string;
  type: string;
  volume: number;
  price: number;
  profit: number;
  balance: number;
  commission: number;
  swap: number;
  orderId?: string | number;
  positionId?: string | number;
  comment?: string;
  entry?: string;
}

export interface Trade {
  openTime: Date;
  closeTime: Date;
  symbol: string;
  type: "buy" | "sell";
  volume: number;
  openPrice: number;
  closePrice: number;
  profit: number;
  commission: number;
  swap: number;
  netProfit: number;
  durationMs: number;
  durationMinutes: number;
}

export interface EquityPoint {
  time: Date;
  balance: number;
  profit: number;
}

export interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakEvenTrades: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
  grossProfit: number;
  grossLoss: number;
  averageWin: number;
  averageLoss: number;
  riskRewardRatio: number;
  profitFactor: number;
  expectancy: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  largestWin: number;
  largestLoss: number;
  maxWinStreak: number;
  maxLoseStreak: number;
  avgWinStreak: number;
  avgLoseStreak: number;
  avgTradeDurationMinutes: number;
  totalCommission: number;
  totalSwap: number;
  initialBalance: number;
  finalBalance: number;
  returnPercent: number;
}

export interface SessionPerformance {
  session: string;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  netProfit: number;
}

export interface HourlyPerformance {
  hour: number;
  trades: number;
  wins: number;
  netProfit: number;
  winRate: number;
}

export interface DailyPerformance {
  dayOfWeek: number;
  dayName: string;
  trades: number;
  wins: number;
  netProfit: number;
  winRate: number;
}

export interface MonthlyPerformance {
  year: number;
  month: number;
  monthName: string;
  trades: number;
  wins: number;
  netProfit: number;
  winRate: number;
}

export interface SymbolPerformance {
  symbol: string;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  netProfit: number;
  avgProfit: number;
  largestWin: number;
  largestLoss: number;
  volume: number;
}

export interface DirectionAnalysis {
  buyTrades: number;
  sellTrades: number;
  buyWins: number;
  sellWins: number;
  buyWinRate: number;
  sellWinRate: number;
  buyProfit: number;
  sellProfit: number;
}

export interface PsychologicalInsight {
  type: string;
  detected: boolean;
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
  advice: string;
}

export interface AnalysisResult {
  trades: Trade[];
  equityCurve: EquityPoint[];
  metrics: PerformanceMetrics;
  sessionPerformance: SessionPerformance[];
  hourlyPerformance: HourlyPerformance[];
  dailyPerformance: DailyPerformance[];
  monthlyPerformance: MonthlyPerformance[];
  symbolPerformance: SymbolPerformance[];
  directionAnalysis: DirectionAnalysis;
  insights: string[];
  psychologicalInsights: PsychologicalInsight[];
}

function getSession(date: Date): string {
  const utcHour = date.getUTCHours();
  if (utcHour >= 0 && utcHour < 7) return "Asia";
  if (utcHour >= 7 && utcHour < 13) return "London";
  if (utcHour >= 13 && utcHour < 22) return "New York";
  return "Asia";
}

function isNonTrade(row: RawDeal): boolean {
  const type = (row.type || "").toLowerCase();
  const comment = (row.comment || "").toLowerCase();
  const sym = (row.symbol || "").toLowerCase();
  if (["balance", "deposit", "withdrawal", "credit"].includes(type)) return true;
  if (comment.includes("deposit") || comment.includes("withdrawal") || comment.includes("balance")) return true;
  if (!row.symbol || sym === "" || sym === "balance") return true;
  return false;
}

export function parseTrades(deals: RawDeal[]): Trade[] {
  const filtered = deals.filter((d) => !isNonTrade(d));
  
  const grouped = new Map<string | number, RawDeal[]>();
  for (const deal of filtered) {
    const key = deal.positionId ?? deal.orderId ?? Math.random();
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(deal);
  }
  
  const trades: Trade[] = [];
  
  for (const [, dealGroup] of grouped) {
    const sorted = dealGroup.sort((a, b) => (a.time?.getTime() ?? 0) - (b.time?.getTime() ?? 0));
    
    if (sorted.length === 1) {
      const deal = sorted[0];
      if (!deal.time) continue;
      const type = (deal.type || "").toLowerCase();
      if (type === "buy" || type === "sell" || type === "t_buy" || type === "t_sell") {
        const dir: "buy" | "sell" = type.includes("buy") ? "buy" : "sell";
        const net = (deal.profit || 0) + (deal.commission || 0) + (deal.swap || 0);
        trades.push({
          openTime: deal.time,
          closeTime: deal.time,
          symbol: deal.symbol,
          type: dir,
          volume: deal.volume || 0,
          openPrice: deal.price || 0,
          closePrice: deal.price || 0,
          profit: deal.profit || 0,
          commission: deal.commission || 0,
          swap: deal.swap || 0,
          netProfit: net,
          durationMs: 0,
          durationMinutes: 0,
        });
      }
    } else {
      const entry = sorted.find(d => {
        const t = (d.type || "").toLowerCase();
        const e = (d.entry || "").toLowerCase();
        return e === "in" || t === "buy" || t === "sell";
      });
      const exit = sorted.find(d => {
        const e = (d.entry || "").toLowerCase();
        return e === "out";
      });
      
      if (!entry && sorted.length >= 2) {
        const open = sorted[0];
        const close = sorted[sorted.length - 1];
        if (!open.time || !close.time) continue;
        
        const totalProfit = sorted.reduce((sum, d) => sum + (d.profit || 0), 0);
        const totalComm = sorted.reduce((sum, d) => sum + (d.commission || 0), 0);
        const totalSwap = sorted.reduce((sum, d) => sum + (d.swap || 0), 0);
        const net = totalProfit + totalComm + totalSwap;
        const type = (open.type || "").toLowerCase();
        const dir: "buy" | "sell" = type.includes("sell") ? "sell" : "buy";
        const dur = close.time.getTime() - open.time.getTime();
        
        trades.push({
          openTime: open.time,
          closeTime: close.time,
          symbol: open.symbol || close.symbol,
          type: dir,
          volume: open.volume || 0,
          openPrice: open.price || 0,
          closePrice: close.price || 0,
          profit: totalProfit,
          commission: totalComm,
          swap: totalSwap,
          netProfit: net,
          durationMs: dur,
          durationMinutes: dur / 60000,
        });
        continue;
      }
      
      if (!entry || !exit) continue;
      if (!entry.time || !exit.time) continue;
      
      const totalProfit = sorted.reduce((sum, d) => sum + (d.profit || 0), 0);
      const totalComm = sorted.reduce((sum, d) => sum + (d.commission || 0), 0);
      const totalSwap = sorted.reduce((sum, d) => sum + (d.swap || 0), 0);
      const net = totalProfit + totalComm + totalSwap;
      const type = (entry.type || "").toLowerCase();
      const dir: "buy" | "sell" = type.includes("sell") ? "sell" : "buy";
      const dur = exit.time.getTime() - entry.time.getTime();
      
      trades.push({
        openTime: entry.time,
        closeTime: exit.time,
        symbol: entry.symbol || exit.symbol,
        type: dir,
        volume: entry.volume || 0,
        openPrice: entry.price || 0,
        closePrice: exit.price || 0,
        profit: totalProfit,
        commission: totalComm,
        swap: totalSwap,
        netProfit: net,
        durationMs: dur,
        durationMinutes: dur / 60000,
      });
    }
  }
  
  return trades.sort((a, b) => a.closeTime.getTime() - b.closeTime.getTime());
}

export function buildEquityCurve(deals: RawDeal[]): EquityPoint[] {
  const points: EquityPoint[] = [];
  let runningProfit = 0;
  
  for (const deal of deals) {
    if (!deal.time) continue;
    if (deal.balance > 0) {
      runningProfit += deal.profit || 0;
      points.push({
        time: deal.time,
        balance: deal.balance,
        profit: runningProfit,
      });
    }
  }
  
  return points;
}

export function computeMetrics(trades: Trade[], equityCurve: EquityPoint[]): PerformanceMetrics {
  const wins = trades.filter((t) => t.netProfit > 0);
  const losses = trades.filter((t) => t.netProfit < 0);
  const breakEven = trades.filter((t) => t.netProfit === 0);
  
  const grossProfit = wins.reduce((s, t) => s + t.netProfit, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.netProfit, 0));
  const netProfit = trades.reduce((s, t) => s + t.netProfit, 0);
  
  const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
  const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
  
  const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
  const riskReward = avgLoss > 0 ? avgWin / avgLoss : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
  const expectancy = trades.length > 0 ? netProfit / trades.length : 0;
  
  const largestWin = wins.length > 0 ? Math.max(...wins.map((t) => t.netProfit)) : 0;
  const largestLoss = losses.length > 0 ? Math.min(...losses.map((t) => t.netProfit)) : 0;
  
  let maxWinStreak = 0, maxLoseStreak = 0;
  let curWin = 0, curLose = 0;
  let winStreaks: number[] = [], loseStreaks: number[] = [];
  
  for (const t of trades) {
    if (t.netProfit > 0) {
      curWin++;
      if (curLose > 0) { loseStreaks.push(curLose); curLose = 0; }
      maxWinStreak = Math.max(maxWinStreak, curWin);
    } else if (t.netProfit < 0) {
      curLose++;
      if (curWin > 0) { winStreaks.push(curWin); curWin = 0; }
      maxLoseStreak = Math.max(maxLoseStreak, curLose);
    } else {
      if (curWin > 0) { winStreaks.push(curWin); curWin = 0; }
      if (curLose > 0) { loseStreaks.push(curLose); curLose = 0; }
    }
  }
  if (curWin > 0) winStreaks.push(curWin);
  if (curLose > 0) loseStreaks.push(curLose);
  
  const avgWinStreak = winStreaks.length > 0 ? winStreaks.reduce((a, b) => a + b, 0) / winStreaks.length : 0;
  const avgLoseStreak = loseStreaks.length > 0 ? loseStreaks.reduce((a, b) => a + b, 0) / loseStreaks.length : 0;
  
  const avgDuration = trades.length > 0 ? trades.reduce((s, t) => s + t.durationMinutes, 0) / trades.length : 0;
  
  let maxDrawdown = 0;
  let maxDrawdownPct = 0;
  let peak = -Infinity;
  
  for (const pt of equityCurve) {
    if (pt.balance > peak) peak = pt.balance;
    const dd = peak - pt.balance;
    const ddPct = peak > 0 ? (dd / peak) * 100 : 0;
    if (dd > maxDrawdown) maxDrawdown = dd;
    if (ddPct > maxDrawdownPct) maxDrawdownPct = ddPct;
  }
  
  const initialBalance = equityCurve.length > 0 ? equityCurve[0].balance - (equityCurve[0].profit || 0) : 0;
  const finalBalance = equityCurve.length > 0 ? equityCurve[equityCurve.length - 1].balance : 0;
  const returnPct = initialBalance > 0 ? ((finalBalance - initialBalance) / initialBalance) * 100 : 0;
  
  const totalComm = trades.reduce((s, t) => s + (t.commission || 0), 0);
  const totalSwap = trades.reduce((s, t) => s + (t.swap || 0), 0);
  
  return {
    totalTrades: trades.length,
    winningTrades: wins.length,
    losingTrades: losses.length,
    breakEvenTrades: breakEven.length,
    winRate,
    totalProfit: grossProfit,
    totalLoss: grossLoss,
    netProfit,
    grossProfit,
    grossLoss,
    averageWin: avgWin,
    averageLoss: avgLoss,
    riskRewardRatio: riskReward,
    profitFactor,
    expectancy,
    maxDrawdown,
    maxDrawdownPercent: maxDrawdownPct,
    largestWin,
    largestLoss,
    maxWinStreak,
    maxLoseStreak,
    avgWinStreak,
    avgLoseStreak,
    avgTradeDurationMinutes: avgDuration,
    totalCommission: totalComm,
    totalSwap,
    initialBalance,
    finalBalance,
    returnPercent: returnPct,
  };
}

export function analyzeBySession(trades: Trade[]): SessionPerformance[] {
  const sessions = ["Asia", "London", "New York"];
  const map = new Map<string, { trades: number; wins: number; losses: number; netProfit: number }>();
  for (const s of sessions) map.set(s, { trades: 0, wins: 0, losses: 0, netProfit: 0 });
  
  for (const t of trades) {
    const s = getSession(t.closeTime);
    const data = map.get(s)!;
    data.trades++;
    data.netProfit += t.netProfit;
    if (t.netProfit > 0) data.wins++;
    else if (t.netProfit < 0) data.losses++;
  }
  
  return sessions.map((s) => {
    const d = map.get(s)!;
    return {
      session: s,
      trades: d.trades,
      wins: d.wins,
      losses: d.losses,
      winRate: d.trades > 0 ? (d.wins / d.trades) * 100 : 0,
      netProfit: d.netProfit,
    };
  });
}

export function analyzeByHour(trades: Trade[]): HourlyPerformance[] {
  const map = new Map<number, { trades: number; wins: number; netProfit: number }>();
  for (let i = 0; i < 24; i++) map.set(i, { trades: 0, wins: 0, netProfit: 0 });
  
  for (const t of trades) {
    const h = t.closeTime.getUTCHours();
    const data = map.get(h)!;
    data.trades++;
    data.netProfit += t.netProfit;
    if (t.netProfit > 0) data.wins++;
  }
  
  return Array.from(map.entries()).map(([h, d]) => ({
    hour: h,
    trades: d.trades,
    wins: d.wins,
    netProfit: d.netProfit,
    winRate: d.trades > 0 ? (d.wins / d.trades) * 100 : 0,
  }));
}

export function analyzeByDay(trades: Trade[]): DailyPerformance[] {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const map = new Map<number, { trades: number; wins: number; netProfit: number }>();
  for (let i = 0; i < 7; i++) map.set(i, { trades: 0, wins: 0, netProfit: 0 });
  
  for (const t of trades) {
    const d = t.closeTime.getUTCDay();
    const data = map.get(d)!;
    data.trades++;
    data.netProfit += t.netProfit;
    if (t.netProfit > 0) data.wins++;
  }
  
  return Array.from(map.entries()).map(([d, data]) => ({
    dayOfWeek: d,
    dayName: dayNames[d],
    trades: data.trades,
    wins: data.wins,
    netProfit: data.netProfit,
    winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
  }));
}

export function analyzeByMonth(trades: Trade[]): MonthlyPerformance[] {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const map = new Map<string, { year: number; month: number; trades: number; wins: number; netProfit: number }>();
  
  for (const t of trades) {
    const y = t.closeTime.getUTCFullYear();
    const m = t.closeTime.getUTCMonth();
    const key = `${y}-${m}`;
    if (!map.has(key)) map.set(key, { year: y, month: m, trades: 0, wins: 0, netProfit: 0 });
    const data = map.get(key)!;
    data.trades++;
    data.netProfit += t.netProfit;
    if (t.netProfit > 0) data.wins++;
  }
  
  return Array.from(map.values())
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
    .map((d) => ({
      year: d.year,
      month: d.month,
      monthName: `${monthNames[d.month]} ${d.year}`,
      trades: d.trades,
      wins: d.wins,
      netProfit: d.netProfit,
      winRate: d.trades > 0 ? (d.wins / d.trades) * 100 : 0,
    }));
}

export function analyzeBySymbol(trades: Trade[]): SymbolPerformance[] {
  const map = new Map<string, { trades: number; wins: number; losses: number; netProfit: number; volume: number; profits: number[] }>();
  
  for (const t of trades) {
    const sym = t.symbol;
    if (!map.has(sym)) map.set(sym, { trades: 0, wins: 0, losses: 0, netProfit: 0, volume: 0, profits: [] });
    const data = map.get(sym)!;
    data.trades++;
    data.netProfit += t.netProfit;
    data.volume += t.volume;
    data.profits.push(t.netProfit);
    if (t.netProfit > 0) data.wins++;
    else if (t.netProfit < 0) data.losses++;
  }
  
  return Array.from(map.entries())
    .map(([sym, d]) => ({
      symbol: sym,
      trades: d.trades,
      wins: d.wins,
      losses: d.losses,
      winRate: d.trades > 0 ? (d.wins / d.trades) * 100 : 0,
      netProfit: d.netProfit,
      avgProfit: d.trades > 0 ? d.netProfit / d.trades : 0,
      largestWin: d.profits.length > 0 ? Math.max(...d.profits) : 0,
      largestLoss: d.profits.length > 0 ? Math.min(...d.profits) : 0,
      volume: d.volume,
    }))
    .sort((a, b) => b.trades - a.trades);
}

export function analyzeDirection(trades: Trade[]): DirectionAnalysis {
  const buys = trades.filter((t) => t.type === "buy");
  const sells = trades.filter((t) => t.type === "sell");
  
  const buyWins = buys.filter((t) => t.netProfit > 0).length;
  const sellWins = sells.filter((t) => t.netProfit > 0).length;
  
  return {
    buyTrades: buys.length,
    sellTrades: sells.length,
    buyWins,
    sellWins,
    buyWinRate: buys.length > 0 ? (buyWins / buys.length) * 100 : 0,
    sellWinRate: sells.length > 0 ? (sellWins / sells.length) * 100 : 0,
    buyProfit: buys.reduce((s, t) => s + t.netProfit, 0),
    sellProfit: sells.reduce((s, t) => s + t.netProfit, 0),
  };
}

export function generateInsights(
  trades: Trade[],
  metrics: PerformanceMetrics,
  sessions: SessionPerformance[],
  hourly: HourlyPerformance[],
  daily: DailyPerformance[],
  direction: DirectionAnalysis,
): string[] {
  const insights: string[] = [];
  
  const bestSession = sessions.reduce((a, b) => b.netProfit > a.netProfit ? b : a, sessions[0]);
  const worstSession = sessions.reduce((a, b) => b.netProfit < a.netProfit ? b : a, sessions[0]);
  if (bestSession && bestSession.trades > 0) insights.push(`You perform best during the ${bestSession.session} session with a ${bestSession.winRate.toFixed(1)}% win rate.`);
  if (worstSession && worstSession.netProfit < 0) insights.push(`Most of your losses occur during the ${worstSession.session} session. Consider reducing activity then.`);
  
  const activeHours = hourly.filter((h) => h.trades >= 3);
  if (activeHours.length > 0) {
    const bestHour = activeHours.reduce((a, b) => b.netProfit > a.netProfit ? b : a);
    const worstHour = activeHours.reduce((a, b) => b.netProfit < a.netProfit ? b : a);
    if (bestHour.trades >= 3) insights.push(`Hour ${bestHour.hour}:00 UTC is your best trading hour with ${bestHour.netProfit.toFixed(2)} net profit.`);
    if (worstHour.netProfit < 0) insights.push(`Hour ${worstHour.hour}:00 UTC is your worst — consider avoiding trades during low liquidity periods.`);
  }
  
  const activeDays = daily.filter((d) => d.trades >= 3);
  if (activeDays.length > 0) {
    const bestDay = activeDays.reduce((a, b) => b.netProfit > a.netProfit ? b : a);
    const worstDay = activeDays.reduce((a, b) => b.netProfit < a.netProfit ? b : a);
    if (bestDay.trades >= 3) insights.push(`${bestDay.dayName} is your most profitable day of the week.`);
    if (worstDay.netProfit < 0) insights.push(`${worstDay.dayName} is your weakest day — you may want to trade with reduced size or skip it.`);
  }
  
  if (metrics.averageLoss > metrics.averageWin * 1.2) {
    insights.push(`Your average loss ($${metrics.averageLoss.toFixed(2)}) is significantly larger than your average win ($${metrics.averageWin.toFixed(2)}). Work on cutting losses shorter.`);
  } else if (metrics.averageWin > metrics.averageLoss * 1.5) {
    insights.push(`Excellent! Your average win ($${metrics.averageWin.toFixed(2)}) is much larger than your average loss ($${metrics.averageLoss.toFixed(2)}). Your reward-to-risk ratio is strong.`);
  }
  
  if (metrics.winRate < 40) {
    insights.push(`Your win rate of ${metrics.winRate.toFixed(1)}% is low. Focus on trade selection quality and only take high-conviction setups.`);
  } else if (metrics.winRate > 65) {
    insights.push(`Your win rate of ${metrics.winRate.toFixed(1)}% is impressive. Make sure your winners are large enough relative to losers.`);
  }
  
  if (metrics.profitFactor < 1) {
    insights.push(`Your profit factor is below 1.0, meaning you are losing money overall. Review your strategy thoroughly.`);
  } else if (metrics.profitFactor > 2) {
    insights.push(`Your profit factor of ${metrics.profitFactor.toFixed(2)} is excellent — above 2.0 is considered a high-quality edge.`);
  }
  
  const buyAdv = direction.buyProfit > direction.sellProfit;
  if (Math.abs(direction.buyProfit - direction.sellProfit) > 0) {
    const betterDir = buyAdv ? "Buy" : "Sell";
    const worseDir = buyAdv ? "Sell" : "Buy";
    insights.push(`${betterDir} trades are significantly more profitable than ${worseDir} trades in your history.`);
  }
  
  if (metrics.maxDrawdownPercent > 20) {
    insights.push(`Your maximum drawdown of ${metrics.maxDrawdownPercent.toFixed(1)}% is high. Consider stricter risk controls to protect your account.`);
  }
  
  if (metrics.maxLoseStreak >= 5) {
    insights.push(`Your longest losing streak was ${metrics.maxLoseStreak} trades. Review what market conditions triggered that streak.`);
  }
  
  return insights;
}

export function detectPsychologicalPatterns(trades: Trade[]): PsychologicalInsight[] {
  const insights: PsychologicalInsight[] = [];
  
  if (trades.length < 10) return insights;
  
  let overtradeCount = 0;
  const dailyTrades = new Map<string, number>();
  for (const t of trades) {
    const key = `${t.closeTime.getUTCFullYear()}-${t.closeTime.getUTCMonth()}-${t.closeTime.getUTCDate()}`;
    dailyTrades.set(key, (dailyTrades.get(key) || 0) + 1);
  }
  const avgDailyTrades = Array.from(dailyTrades.values()).reduce((a, b) => a + b, 0) / dailyTrades.size;
  const highTradeDays = Array.from(dailyTrades.values()).filter((v) => v > avgDailyTrades * 2).length;
  if (highTradeDays > dailyTrades.size * 0.15) overtradeCount++;
  
  insights.push({
    type: "overtrading",
    detected: overtradeCount > 0,
    severity: overtradeCount > 0 ? "medium" : "low",
    title: "Overtrading",
    description: overtradeCount > 0
      ? `You have ${highTradeDays} days where you traded more than twice the average (${avgDailyTrades.toFixed(1)} trades/day). This suggests you may chase trades when not in your best mindset.`
      : "Your daily trade count is relatively consistent, showing good discipline.",
    advice: "Stick to a maximum number of trades per day. Quality always beats quantity in trading.",
  });
  
  let revengeCount = 0;
  for (let i = 1; i < trades.length; i++) {
    const prev = trades[i - 1];
    const curr = trades[i];
    const timeDiff = curr.openTime.getTime() - prev.closeTime.getTime();
    if (prev.netProfit < 0 && timeDiff < 5 * 60 * 1000) {
      if (curr.volume > prev.volume * 1.3) revengeCount++;
    }
  }
  
  insights.push({
    type: "revenge_trading",
    detected: revengeCount > trades.length * 0.05,
    severity: revengeCount > trades.length * 0.1 ? "high" : revengeCount > 0 ? "medium" : "low",
    title: "Revenge Trading",
    description: revengeCount > trades.length * 0.05
      ? `You tend to increase position size and re-enter immediately after losses (${revengeCount} instances detected). This is a classic revenge trading pattern that leads to larger losses.`
      : "No significant revenge trading patterns detected in your history.",
    advice: "After a loss, take a break. Set a rule to wait at least 30 minutes before the next trade.",
  });
  
  let fearExits = 0;
  let holdingLosses = 0;
  const avgDuration = trades.reduce((s, t) => s + t.durationMinutes, 0) / trades.length;
  
  for (const t of trades) {
    if (t.netProfit > 0 && t.durationMinutes < avgDuration * 0.3) fearExits++;
    if (t.netProfit < 0 && t.durationMinutes > avgDuration * 2) holdingLosses++;
  }
  
  insights.push({
    type: "fear_exits",
    detected: fearExits > trades.length * 0.25,
    severity: fearExits > trades.length * 0.4 ? "high" : fearExits > trades.length * 0.25 ? "medium" : "low",
    title: "Closing Winners Too Early",
    description: fearExits > trades.length * 0.25
      ? `${fearExits} winning trades (${((fearExits / trades.length) * 100).toFixed(0)}%) were closed much faster than your average trade duration. You may be taking profits too early out of fear.`
      : "You generally hold your winning trades for a reasonable duration.",
    advice: "Trust your analysis. Use trailing stops instead of manually closing winners early.",
  });
  
  insights.push({
    type: "holding_losses",
    detected: holdingLosses > trades.length * 0.15,
    severity: holdingLosses > trades.length * 0.25 ? "high" : holdingLosses > trades.length * 0.15 ? "medium" : "low",
    title: "Letting Losses Run Too Long",
    description: holdingLosses > trades.length * 0.15
      ? `${holdingLosses} losing trades were held much longer than average. Hoping a losing trade will recover leads to larger losses.`
      : "Your loss management timing is generally consistent.",
    advice: "Always use a stop-loss. Accept small losses to protect your capital from large drawdowns.",
  });
  
  const lots = trades.map((t) => t.volume);
  const avgLot = lots.reduce((a, b) => a + b, 0) / lots.length;
  const stdLot = Math.sqrt(lots.reduce((s, l) => s + Math.pow(l - avgLot, 2), 0) / lots.length);
  const cvLot = stdLot / avgLot;
  
  insights.push({
    type: "inconsistent_sizing",
    detected: cvLot > 0.5,
    severity: cvLot > 1.0 ? "high" : cvLot > 0.5 ? "medium" : "low",
    title: "Inconsistent Position Sizing",
    description: cvLot > 0.5
      ? `Your lot sizes vary significantly (avg: ${avgLot.toFixed(2)}, std: ${stdLot.toFixed(2)}). Inconsistent sizing suggests emotional decision-making rather than a fixed risk rule.`
      : "Your position sizing is fairly consistent, showing good risk discipline.",
    advice: "Use a fixed percentage of your account (e.g., 1-2%) per trade to standardize risk.",
  });
  
  let emotionalSizing = 0;
  for (let i = 1; i < trades.length; i++) {
    const prev = trades[i - 1];
    const curr = trades[i];
    if (prev.netProfit < 0 && curr.volume > prev.volume * 1.5) emotionalSizing++;
  }
  
  insights.push({
    type: "emotional_sizing",
    detected: emotionalSizing > trades.length * 0.05,
    severity: emotionalSizing > trades.length * 0.1 ? "high" : emotionalSizing > 0 ? "medium" : "low",
    title: "Emotional Position Sizing After Losses",
    description: emotionalSizing > trades.length * 0.05
      ? `You increased position size after a loss ${emotionalSizing} times. This doubles down on risk precisely when you're in a losing mindset — a very dangerous pattern.`
      : "You generally maintain position sizing after losses, showing good emotional control.",
    advice: "Never increase size after a loss. If anything, reduce your size during a losing streak.",
  });
  
  return insights;
}

export function analyzeAll(trades: Trade[], equityCurve: EquityPoint[]): AnalysisResult {
  const metrics = computeMetrics(trades, equityCurve);
  const sessionPerformance = analyzeBySession(trades);
  const hourlyPerformance = analyzeByHour(trades);
  const dailyPerformance = analyzeByDay(trades);
  const monthlyPerformance = analyzeByMonth(trades);
  const symbolPerformance = analyzeBySymbol(trades);
  const directionAnalysis = analyzeDirection(trades);
  const insights = generateInsights(trades, metrics, sessionPerformance, hourlyPerformance, dailyPerformance, directionAnalysis);
  const psychologicalInsights = detectPsychologicalPatterns(trades);
  
  return {
    trades,
    equityCurve,
    metrics,
    sessionPerformance,
    hourlyPerformance,
    dailyPerformance,
    monthlyPerformance,
    symbolPerformance,
    directionAnalysis,
    insights,
    psychologicalInsights,
  };
}

export function filterTradesByDateRange(trades: Trade[], from: Date | null, to: Date | null): Trade[] {
  return trades.filter((t) => {
    if (from && t.closeTime < from) return false;
    if (to && t.closeTime > to) return false;
    return true;
  });
}

export function filterEquityByDateRange(equityCurve: EquityPoint[], from: Date | null, to: Date | null): EquityPoint[] {
  return equityCurve.filter((p) => {
    if (from && p.time < from) return false;
    if (to && p.time > to) return false;
    return true;
  });
}

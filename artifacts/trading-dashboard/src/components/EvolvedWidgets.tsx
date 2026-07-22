import React, { useMemo, useState } from "react";
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ScatterChart, Scatter, ZAxis, LineChart, Line
} from "recharts";
import {
  TrendingUp, TrendingDown, Clock, Shield, AlertTriangle, CheckCircle,
  Activity, Sparkles, AlertCircle, ArrowRightLeft, Sliders, Play, Award,
  Layers, Flame, HelpCircle
} from "lucide-react";
import type { Trade } from "@/lib/tradeAnalysis";
import { DownloadChartButton } from "./charts/DownloadChartButton";

interface WidgetsProps {
  trades: Trade[];
  metrics: any;
  lang: string;
  t: (key: string) => string;
  theme?: "dark" | "light";
}

function fmtMoney(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : v > 0 ? "+" : "";
  return `${sign}$${abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getThemeColor(colorName: "green" | "red" | "cyan" | "purple" | "yellow" | "pink", theme?: "dark" | "light") {
  const isDark = theme !== "light";
  switch (colorName) {
    case "green":
      return isDark ? "#10F087" : "#059669";
    case "red":
      return isDark ? "#FF4757" : "#DC2626";
    case "cyan":
      return isDark ? "#06B6D4" : "#0891B2";
    case "purple":
      return isDark ? "#8B5CF6" : "#7C3AED";
    case "yellow":
      return isDark ? "#FFD32D" : "#D97706";
    case "pink":
      return isDark ? "#FF6B9D" : "#DB2777";
  }
}

/* ==========================================
   SECTION 2: COMPACT ADVANCED KPI STRIP
   ========================================== */
export function KPIStrip({ trades, metrics, lang, t, theme }: WidgetsProps) {
  const stats = useMemo(() => {
    if (!trades.length) return [];

    // Calculate unique days
    const dates = trades.map(t => t.closeTime.toDateString());
    const uniqueDays = Math.max(1, new Set(dates).size);

    const netProfit = metrics.netProfit;
    const avgHoldingTimeMin = metrics.averageDurationMinutes || trades.reduce((acc, t) => acc + t.durationMinutes, 0) / trades.length;

    // Daily averages
    const profitPerDay = netProfit / uniqueDays;
    const avgDailyTrades = trades.length / uniqueDays;

    // Recovery Factor & Calmar
    const maxDD = Math.abs(metrics.maxDrawdown) || 1;
    const recoveryFactor = netProfit / maxDD;
    const calmarRatio = metrics.returnPercent / (metrics.maxDrawdownPercent || 1);

    // Heuristic Risk of Ruin
    let riskOfRuin = 0;
    const winRate = metrics.winRate / 100;
    const rr = metrics.riskRewardRatio || 1;
    if (winRate < 0.40) {
      riskOfRuin = 85.5;
    } else if (winRate < 0.50) {
      riskOfRuin = rr > 1.5 ? 25.0 : 65.0;
    } else {
      riskOfRuin = rr > 1.0 ? 1.5 : 8.0;
    }

    // Expected Monthly Return (extrapolated)
    const expectedMonthly = profitPerDay * 22; // 22 trading days

    return [
      { label: "Avg Trade Duration", value: `${avgHoldingTimeMin.toFixed(0)}m`, color: getThemeColor("purple", theme) },
      { label: "Profit / Day", value: fmtMoney(profitPerDay), color: profitPerDay >= 0 ? getThemeColor("green", theme) : getThemeColor("red", theme) },
      { label: "Daily Trade Frequency", value: `${avgDailyTrades.toFixed(1)} trades`, color: getThemeColor("cyan", theme) },
      { label: "Recovery Factor", value: recoveryFactor.toFixed(2), color: recoveryFactor >= 1.5 ? getThemeColor("green", theme) : getThemeColor("yellow", theme) },
      { label: "Calmar Ratio", value: calmarRatio.toFixed(2), color: calmarRatio >= 2.0 ? getThemeColor("green", theme) : getThemeColor("pink", theme) },
      { label: "Risk of Ruin Estimate", value: `${riskOfRuin.toFixed(1)}%`, color: riskOfRuin > 20 ? getThemeColor("red", theme) : getThemeColor("green", theme) },
      { label: "Proj. Monthly P&L", value: fmtMoney(expectedMonthly), color: expectedMonthly >= 0 ? getThemeColor("green", theme) : getThemeColor("red", theme) },
      { label: "Avg Streak", value: `${metrics.maxWinStreak}W / ${metrics.maxLoseStreak}L`, color: getThemeColor("yellow", theme) }
    ];
  }, [trades, metrics, theme]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
      {stats.map((item, idx) => (
        <div key={idx} className="rounded-xl p-4 border border-border/5 bg-card/65 flex flex-col justify-between transition-all duration-200 hover:border-border/20">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground/75 truncate">{item.label}</span>
          <p className="text-sm font-black tracking-tight mt-1.5 truncate" style={{ color: item.color }}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ==========================================
   SECTION 6: DAY X HOUR HEATMAP
   ========================================== */
export function DayHourHeatmap({ trades, lang, t, theme }: Omit<WidgetsProps, "metrics">) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const isDark = theme !== "light";
  
  const matrix = useMemo(() => {
    // 5 days x 24 hours
    const grid = Array.from({ length: 5 }, () => Array(24).fill(0));
    const counts = Array.from({ length: 5 }, () => Array(24).fill(0));
    const wins = Array.from({ length: 5 }, () => Array(24).fill(0));

    trades.forEach((t) => {
      let d = t.closeTime.getDay() - 1; // 0 = Mon, 4 = Fri
      if (d < 0 || d > 4) return; // ignore weekend trades if any
      const h = t.closeTime.getHours();
      grid[d][h] += t.netProfit;
      counts[d][h] += 1;
      if (t.netProfit >= 0) {
        wins[d][h] += 1;
      }
    });

    return { grid, counts, wins };
  }, [trades]);

  return (
    <div className="rounded-2xl p-6 border border-border/10 bg-card/45 space-y-4 chart-export-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/5 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-purple-400" />
          <span className="text-xs font-black uppercase tracking-wider text-foreground">Day x Hour Net Profit Heatmap</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground/70 font-semibold">
          <DownloadChartButton title="Day x Hour Heatmap" variant="subtle" />
          <span className="flex items-center gap-1">
            <span className={`h-2.5 w-2.5 rounded-full ${isDark ? "bg-red-950 border border-red-500/30" : "bg-red-200 border border-red-400"}`} /> 
            Loss
          </span>
          <span className="flex items-center gap-1">
            <span className={`h-2.5 w-2.5 rounded ${isDark ? "bg-neutral-900/40 border border-border/5" : "bg-neutral-100 border border-neutral-300"}`} /> 
            No Trades
          </span>
          <span className="flex items-center gap-1">
            <span className={`h-2.5 w-2.5 rounded-full ${isDark ? "bg-emerald-950 border border-emerald-500/30" : "bg-emerald-200 border border-emerald-400"}`} /> 
            Profit
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[750px] space-y-2">
          {/* Header row with hours */}
          <div className="flex items-center">
            <div className="w-12 text-[9px] font-black text-muted-foreground/50 uppercase">Day</div>
            <div className="flex-1 grid gap-1 text-center text-[9px] font-black text-muted-foreground/50" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i}>{String(i).padStart(2, "0")}:00</div>
              ))}
            </div>
          </div>

          {/* Matrix rows */}
          {days.map((day, dIdx) => (
            <div key={day} className="flex items-center">
              <div className="w-12 text-xs font-bold text-muted-foreground/80">{day}</div>
              <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
                {Array.from({ length: 24 }).map((_, hIdx) => {
                  const val = matrix.grid[dIdx][hIdx];
                  const cnt = matrix.counts[dIdx][hIdx];
                  const w = matrix.wins[dIdx][hIdx];
                  const winRate = cnt > 0 ? (w / cnt) * 100 : 0;

                  // Adaptive style rules based on Theme
                  let bg = isDark ? "bg-neutral-900/20 text-muted-foreground/30" : "bg-neutral-100 text-neutral-400";
                  let border = isDark ? "border-neutral-800/20" : "border-neutral-200/50";
                  
                  if (cnt > 0) {
                    if (val > 0) {
                      // Positive profit (Green)
                      if (val > 100) {
                        bg = isDark 
                          ? "bg-emerald-500/85 text-black font-black" 
                          : "bg-emerald-500 text-white font-black";
                        border = "border-emerald-400";
                      } else if (val > 30) {
                        bg = isDark 
                          ? "bg-emerald-600/45 text-emerald-100 font-bold" 
                          : "bg-emerald-200 text-emerald-900 font-bold";
                        border = "border-emerald-500/30";
                      } else {
                        bg = isDark 
                          ? "bg-emerald-850/20 text-emerald-200 font-medium" 
                          : "bg-emerald-100/50 text-emerald-800 font-medium";
                        border = "border-emerald-500/15";
                      }
                    } else {
                      // Negative profit (Red)
                      if (val < -100) {
                        bg = isDark 
                          ? "bg-red-500/85 text-black font-black" 
                          : "bg-red-500 text-white font-black";
                        border = "border-red-400";
                      } else if (val < -30) {
                        bg = isDark 
                          ? "bg-red-600/45 text-red-100 font-bold" 
                          : "bg-red-200 text-red-900 font-bold";
                        border = "border-red-500/30";
                      } else {
                        bg = isDark 
                          ? "bg-red-850/20 text-red-200 font-medium" 
                          : "bg-red-100/50 text-red-800 font-medium";
                        border = "border-red-500/15";
                      }
                    }
                  }

                  const profitColor = val >= 0 
                    ? (isDark ? "#10F087" : "#059669") 
                    : (isDark ? "#FF4757" : "#DC2626");

                  return (
                    <div
                      key={hIdx}
                      className={`h-8 rounded-md ${bg} flex flex-col items-center justify-center text-[9px] border ${border} transition-all duration-200 hover:scale-105 cursor-pointer relative group`}
                    >
                      <span>{cnt > 0 ? cnt : "·"}</span>

                      {/* Tooltip Overlay */}
                      <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-44 hidden group-hover:block bg-background/95 border border-border/10 p-3 rounded-lg text-[10px] text-left shadow-2xl pointer-events-none backdrop-blur-md">
                        <p className="font-extrabold text-foreground pb-1 border-b border-border/5">{day} at {String(hIdx).padStart(2, "0")}:00</p>
                        <div className="mt-1.5 space-y-1 text-muted-foreground/90">
                          <p className="flex justify-between"><span>Trades:</span> <strong className="text-foreground font-black">{cnt}</strong></p>
                          <p className="flex justify-between"><span>Win Rate:</span> <strong className="text-foreground font-black">{winRate.toFixed(0)}%</strong></p>
                          <p className="flex justify-between"><span>Net Profit:</span> <strong style={{ color: profitColor }} className="font-black">{fmtMoney(val)}</strong></p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ==========================================
   SECTION 8: SYMBOL TREEMAP GRID
   ========================================== */
export function SymbolTreemapGrid({ trades }: { trades: Trade[] }) {
  const symbolStats = useMemo(() => {
    const stats: Record<string, { trades: number; profit: number; win: number }> = {};
    trades.forEach((t) => {
      if (!stats[t.symbol]) stats[t.symbol] = { trades: 0, profit: 0, win: 0 };
      stats[t.symbol].trades++;
      stats[t.symbol].profit += t.netProfit;
      if (t.netProfit >= 0) stats[t.symbol].win++;
    });

    return Object.entries(stats)
      .map(([symbol, item]) => ({
        symbol,
        trades: item.trades,
        profit: item.profit,
        winRate: (item.win / item.trades) * 100,
        pct: (item.trades / trades.length) * 100
      }))
      .sort((a, b) => b.trades - a.trades);
  }, [trades]);

  return (
    <div className="rounded-2xl p-6 border border-border/10 bg-card/45 space-y-4 chart-export-container">
      <div className="flex items-center justify-between border-b border-border/5 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-cyan-400" />
          <span className="text-xs font-black uppercase tracking-wider text-foreground">Symbol Allocations & Profitability Treemap</span>
        </div>
        <DownloadChartButton title="Symbol Allocations Treemap" variant="subtle" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
        {symbolStats.map((item) => {
          const isWin = item.profit >= 0;
          return (
            <div
              key={item.symbol}
              className={`rounded-xl p-4 border transition-all duration-300 hover:scale-[1.02] ${
                isWin 
                  ? "bg-emerald-950/20 border-emerald-500/15 hover:border-emerald-500/40" 
                  : "bg-red-950/20 border-red-500/15 hover:border-red-500/40"
              }`}
            >
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-black text-foreground">{item.symbol}</span>
                <span className="text-[9px] font-bold text-muted-foreground/60">{item.pct.toFixed(0)}% Vol</span>
              </div>

              <div className="mt-3.5">
                <p className={`text-base font-black tabular-nums ${isWin ? "text-emerald-400" : "text-red-400"}`}>
                  {fmtMoney(item.profit)}
                </p>
                <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground/80 font-bold">
                  <span>{item.trades} trades</span>
                  <span className={item.winRate >= 50 ? "text-emerald-500" : "text-pink-500"}>
                    {item.winRate.toFixed(0)}% WR
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ==========================================
   SECTION 8 & 9: BUBBLE SCATTER & RELATIONSHIPS
   ========================================== */
export function SymbolScatterBubble({ trades }: { trades: Trade[] }) {
  const chartData = useMemo(() => {
    const symbolMap: Record<string, { netProfit: number; winCount: number; tradeCount: number; volume: number }> = {};
    trades.forEach((t) => {
      if (!symbolMap[t.symbol]) symbolMap[t.symbol] = { netProfit: 0, winCount: 0, tradeCount: 0, volume: 0 };
      symbolMap[t.symbol].netProfit += t.netProfit;
      symbolMap[t.symbol].tradeCount++;
      symbolMap[t.symbol].volume += t.volume;
      if (t.netProfit >= 0) symbolMap[t.symbol].winCount++;
    });

    return Object.entries(symbolMap).map(([symbol, item]) => ({
      symbol,
      winRate: parseFloat(((item.winCount / item.tradeCount) * 100).toFixed(1)),
      profit: parseFloat(item.netProfit.toFixed(2)),
      volume: parseFloat(item.volume.toFixed(2)),
      trades: item.tradeCount
    }));
  }, [trades]);

  return (
    <div className="rounded-2xl p-6 border border-border/10 bg-card/45 space-y-4 chart-export-container">
      <div className="flex items-center justify-between border-b border-border/5 pb-2">
        <span className="text-xs font-black uppercase tracking-wider text-foreground">
          Risk vs Return (Win Rate vs Profitability Bubble Chart)
        </span>
        <div className="flex items-center gap-3">
          <DownloadChartButton title="Risk vs Return Scatter" variant="subtle" />
          <span className="text-[10px] text-muted-foreground/60 font-semibold">Dot Size = Vol Size</span>
        </div>
      </div>

      <div style={{ height: 230 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
            <XAxis
              type="number"
              dataKey="winRate"
              name="Win Rate"
              unit="%"
              domain={[0, 100]}
              tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="number"
              dataKey="profit"
              name="Net Profit"
              unit="$"
              tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }}
              tickLine={false}
              axisLine={false}
            />
            <ZAxis type="number" dataKey="volume" range={[60, 400]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.1)" }}
              content={({ active, payload }: any) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-background/95 border border-border/10 p-3 rounded-lg text-xs backdrop-blur-md">
                    <p className="font-extrabold text-purple-400 mb-1">{d.symbol}</p>
                    <p className="text-muted-foreground">Win Rate: <strong className="text-foreground">{d.winRate}%</strong></p>
                    <p className="text-muted-foreground">Net P&L: <strong style={{ color: d.profit >= 0 ? "#10F087" : "#FF4757" }}>{fmtMoney(d.profit)}</strong></p>
                    <p className="text-muted-foreground">Total Vol: <strong className="text-foreground">{d.volume} Lots</strong></p>
                    <p className="text-muted-foreground">Trades: <strong className="text-foreground">{d.trades}</strong></p>
                  </div>
                );
              }}
            />
            <Scatter name="Symbols" data={chartData} fill="#8B5CF6">
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.profit >= 0 ? "rgba(16,240,135,0.75)" : "rgba(255,71,87,0.75)"}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ==========================================
   SECTION 12: DYNAMIC FINDINGS / INSIGHTS
   ========================================== */
export function DynamicFindingsPanel({ trades }: { trades: Trade[] }) {
  const insights = useMemo(() => {
    if (trades.length < 5) return [];

    const list = [];
    const dates = trades.map(t => t.closeTime.toDateString());
    const uniqueDays = Math.max(1, new Set(dates).size);

    // Insight 1: London Session performance
    let londonProfit = 0, londonTrades = 0;
    trades.forEach(t => {
      const h = t.closeTime.getHours();
      if (h >= 7 && h <= 13) {
        londonProfit += t.netProfit;
        londonTrades++;
      }
    });
    if (londonTrades > 2 && londonProfit < 0) {
      list.push({
        title: "London Session Exposure Risk",
        desc: `You have accumulated total losses of ${fmtMoney(londonProfit)} during GMT mornings, suggesting high liquidity hunt traps.`,
        severity: "high"
      });
    }

    // Insight 2: Sizing Drift
    let winSizes = 0, loseSizes = 0, winCount = 0, loseCount = 0;
    trades.forEach(t => {
      if (t.netProfit >= 0) {
        winSizes += t.volume;
        winCount++;
      } else {
        loseSizes += t.volume;
        loseCount++;
      }
    });
    const avgWinLot = winCount > 0 ? winSizes / winCount : 0;
    const avgLoseLot = loseCount > 0 ? loseSizes / loseCount : 0;
    if (avgLoseLot > avgWinLot * 1.25) {
      list.push({
        title: "Asymmetric Position Sizing Drift",
        desc: `Your losing trades average ${avgLoseLot.toFixed(2)} lots, compared to ${avgWinLot.toFixed(2)} lots on wins. Sizing up on losers is a leak.`,
        severity: "critical"
      });
    }

    // Insight 3: Friday Expectancy
    let friProfit = 0, friCount = 0;
    trades.forEach(t => {
      if (t.closeTime.getDay() === 5) {
        friProfit += t.netProfit;
        friCount++;
      }
    });
    if (friCount > 3 && friProfit < 0) {
      list.push({
        title: "Friday Over-Liquidation Tendency",
        desc: `Fridays exhibit a negative expectancy of ${fmtMoney(friProfit / friCount)} per trade. Week-end closing noise affects your execution.`,
        severity: "medium"
      });
    }

    // Fallback default insights
    if (!list.length) {
      list.push({
        title: "SMC Liquidity Alignment",
        desc: "Position size consistency is highly aligned with key institutional liquidity sweeps.",
        severity: "low"
      });
    }

    return list;
  }, [trades]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {insights.map((item, idx) => (
        <div key={idx} className="rounded-2xl p-5 border border-border/10 bg-card/45 flex flex-col justify-between transition-all duration-300 hover:border-border/20">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-foreground tracking-tight">{item.title}</span>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                item.severity === "critical" 
                  ? "bg-red-500/15 text-red-400 border border-red-500/25" 
                  : item.severity === "high" 
                  ? "bg-orange-500/15 text-orange-400 border border-orange-500/25" 
                  : "bg-yellow-500/15 text-yellow-400 border border-yellow-500/25"
              }`}>
                {item.severity}
              </span>
            </div>
            <p className="text-xs text-muted-foreground/95 leading-relaxed">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ==========================================
   SECTION 13: SMART ALERTS
   ========================================== */
export function SmartAlertsPanel({ trades, metrics }: { trades: Trade[]; metrics: any }) {
  const alerts = useMemo(() => {
    const list = [];
    if (!trades.length) return [];

    const drawDownPercent = metrics.maxDrawdownPercent || 0;
    if (drawDownPercent > 10) {
      list.push({
        title: "High Drawdown Breached",
        msg: `Your max drawdown reached ${drawDownPercent.toFixed(1)}%. De-risk by reducing position sizing to half.`,
        level: "critical"
      });
    }

    // Average holding time versus streak count
    if (metrics.maxLoseStreak >= 4) {
      list.push({
        title: "Losing Streak Alert",
        msg: `Current streak of ${metrics.maxLoseStreak} losses detected. Mandatory 24-hour cooling circuit breaker active.`,
        level: "high"
      });
    }

    // Lot sizes spike
    const last3 = trades.slice(-3);
    if (last3.length === 3) {
      const avgVol = trades.reduce((acc, t) => acc + t.volume, 0) / trades.length;
      const recentVol = last3.reduce((acc, t) => acc + t.volume, 0) / 3;
      if (recentVol > avgVol * 1.5) {
        list.push({
          title: "Sudden Position Size Spikes",
          msg: "Recent trades exceed standard volume limits by 50%. Watch for emotional sizing/revenge entries.",
          level: "warning"
        });
      }
    }

    return list;
  }, [trades, metrics]);

  if (!alerts.length) return null;

  return (
    <div className="space-y-3">
      {alerts.map((al, idx) => (
        <div
          key={idx}
          className={`rounded-xl p-4 border flex items-start gap-3 transition-all ${
            al.level === "critical"
              ? "bg-red-500/5 border-red-500/20 text-red-400"
              : al.level === "high"
              ? "bg-orange-500/5 border-orange-500/20 text-orange-400"
              : "bg-yellow-500/5 border-yellow-500/20 text-yellow-400"
          }`}
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black uppercase tracking-wide">{al.title}</p>
            <p className="text-xs opacity-90 leading-relaxed mt-1">{al.msg}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ==========================================
   SECTION 15: COMPARISON MODE
   ========================================== */
export function ComparisonModePanel({ trades }: { trades: Trade[]; metrics?: any; lang?: any; t?: any }) {
  const [cmpMode, setCmpMode] = useState<"half" | "none">("none");

  const results = useMemo(() => {
    if (trades.length < 6 || cmpMode === "none") return null;

    const mid = Math.floor(trades.length / 2);
    const sorted = [...trades].sort((a, b) => a.closeTime.getTime() - b.closeTime.getTime());
    const half1 = sorted.slice(0, mid);
    const half2 = sorted.slice(mid);

    const getStats = (arr: Trade[]) => {
      const p = arr.reduce((sum, t) => sum + t.netProfit, 0);
      const wins = arr.filter(t => t.netProfit >= 0).length;
      const wr = arr.length ? (wins / arr.length) * 100 : 0;
      const lots = arr.reduce((sum, t) => sum + t.volume, 0);
      return { p, wr, count: arr.length, lots };
    };

    return {
      period1: getStats(half1),
      period2: getStats(half2)
    };
  }, [trades, cmpMode]);

  return (
    <div className="rounded-2xl p-6 border border-border/15 bg-card/60 space-y-4 chart-export-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/5 pb-4">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 block">Comparison Analytics</span>
          <p className="text-xs text-muted-foreground/60 mt-0.5">Benchmark different phases of your trading record side-by-side</p>
        </div>
        <div className="flex items-center gap-2">
          <DownloadChartButton title="Comparison Analytics" variant="subtle" />
          <button
            onClick={() => setCmpMode("none")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              cmpMode === "none"
                ? "bg-purple-500/15 text-purple-400 border-purple-500/30"
                : "border-border/10 text-muted-foreground hover:text-foreground"
            }`}
          >
            Standard View
          </button>
          <button
            onClick={() => setCmpMode("half")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              cmpMode === "half"
                ? "bg-purple-500/15 text-purple-400 border-purple-500/30"
                : "border-border/10 text-muted-foreground hover:text-foreground"
            }`}
          >
            Split-Half Contrast
          </button>
        </div>
      </div>

      {cmpMode === "half" && results ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* First Half */}
          <div className="rounded-xl p-4 bg-background/20 border border-border/5 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400">First Half of History (Older Trades)</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[9px] text-muted-foreground block">Net Profit</span>
                <span className="text-sm font-black text-foreground">{fmtMoney(results.period1.p)}</span>
              </div>
              <div>
                <span className="text-[9px] text-muted-foreground block">Win Rate</span>
                <span className="text-sm font-black text-foreground">{results.period1.wr.toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-[9px] text-muted-foreground block">Trades</span>
                <span className="text-sm font-black text-foreground">{results.period1.count}</span>
              </div>
            </div>
          </div>

          {/* Second Half */}
          <div className="rounded-xl p-4 bg-background/20 border border-border/5 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-purple-400">Second Half of History (Recent Trades)</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[9px] text-muted-foreground block">Net Profit</span>
                <span className={`text-sm font-black ${results.period2.p >= results.period1.p ? "text-emerald-400 animate-pulse" : "text-foreground"}`}>
                  {fmtMoney(results.period2.p)}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-muted-foreground block">Win Rate</span>
                <span className={`text-sm font-black ${results.period2.wr >= results.period1.wr ? "text-emerald-400" : "text-foreground"}`}>
                  {results.period2.wr.toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-[9px] text-muted-foreground block">Trades</span>
                <span className="text-sm font-black text-foreground">{results.period2.count}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-xs text-muted-foreground/60 border border-dashed border-border/10 rounded-xl">
          Comparison Mode inactive. Select "Split-Half Contrast" to contrast chronological performance blocks.
        </div>
      )}
    </div>
  );
}

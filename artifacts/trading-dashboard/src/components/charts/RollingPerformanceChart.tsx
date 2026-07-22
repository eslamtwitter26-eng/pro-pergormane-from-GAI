import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Sliders } from "lucide-react";
import type { Trade } from "@/lib/tradeAnalysis";
import { DownloadChartButton } from "./DownloadChartButton";

interface RollingPerformanceChartProps {
  trades: Trade[];
  theme?: "dark" | "light";
}

export function RollingPerformanceChart({ trades, theme }: RollingPerformanceChartProps) {
  const isDark = theme !== "light";

  const chartData = useMemo(() => {
    if (!trades.length) return [];
    
    // Sort trades by date
    const sorted = [...trades].sort((a, b) => a.closeTime.getTime() - b.closeTime.getTime());
    
    return sorted.map((t, idx) => {
      // Calculate 30-trade moving average
      let sum = 0;
      let count = 0;
      for (let j = Math.max(0, idx - 29); j <= idx; j++) {
        sum += sorted[j].netProfit;
        count++;
      }
      const movingAvg = count > 0 ? parseFloat((sum / count).toFixed(2)) : 0;
      
      return {
        tradeNum: idx + 1,
        netProfit: parseFloat(t.netProfit.toFixed(2)),
        movingAvg,
        symbol: t.symbol,
        dateStr: t.closeTime.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      };
    });
  }, [trades]);

  const stats = useMemo(() => {
    if (!chartData.length) return { current: 0, trend: "Stable" };
    const current = chartData[chartData.length - 1].movingAvg;
    const prev = chartData[Math.max(0, chartData.length - 10)].movingAvg;
    const trend = current > prev ? "Improving" : current < prev ? "Declining" : "Stable";
    return { current, trend };
  }, [chartData]);

  if (!trades.length) {
    return (
      <div className="flex h-32 items-center justify-center text-xs text-muted-foreground/50">
        No historical trades to calculate rolling average.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    
    return (
      <div className="rounded-xl border border-cyan-500/35 bg-background/95 p-3.5 shadow-2xl backdrop-blur-md text-[11px] min-w-[200px]">
        <div className="flex items-center justify-between pb-1.5 border-b border-border/5 mb-1.5">
          <span className="font-extrabold text-muted-foreground">Trade #{d.tradeNum}</span>
          <span className="text-[9px] font-black uppercase text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
            {d.symbol}
          </span>
        </div>
        <div className="space-y-1">
          <p className="flex justify-between">
            <span className="text-muted-foreground">Trade P&L:</span>
            <strong className={d.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-pink-600 dark:text-pink-400 font-bold"}>
              {d.netProfit >= 0 ? "+" : ""}${d.netProfit.toLocaleString()}
            </strong>
          </p>
          <p className="flex justify-between border-t border-border/5 pt-1 mt-1">
            <span className="text-muted-foreground">30-Trade MA P&L:</span>
            <strong className={d.movingAvg >= 0 ? "text-cyan-600 dark:text-cyan-400 font-black" : "text-pink-600 dark:text-pink-400 font-black"}>
              {d.movingAvg >= 0 ? "+" : ""}${d.movingAvg.toLocaleString()}
            </strong>
          </p>
          <p className="text-[9px] text-muted-foreground/50 text-right mt-1">{d.dateStr}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl p-6 border border-border/10 bg-card/45 space-y-4 chart-export-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sliders className="h-4.5 w-4.5 text-cyan-600 dark:text-cyan-400" />
            <h4 className="text-xs font-black uppercase tracking-wider text-foreground">Rolling Performance (30-Trade Moving Average)</h4>
          </div>
          <p className="text-[10px] text-muted-foreground">Is the trader improving or declining over time? This filter eliminates individual trade noise.</p>
        </div>
        <div className="flex items-center gap-3">
          <DownloadChartButton title="Rolling Performance" variant="subtle" />
          <div className="text-right">
            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-wider">Current 30-Trade MA</p>
            <p className="text-sm font-black text-cyan-600 dark:text-cyan-400">${stats.current.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
            stats.trend === "Improving" 
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              : stats.trend === "Declining"
              ? "bg-pink-500/15 text-pink-600 dark:text-pink-400 border border-pink-500/20"
              : "bg-muted text-muted-foreground"
          }`}>
            {stats.trend}
          </span>
        </div>
      </div>

      <div style={{ height: 160 }} className="relative overflow-hidden pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="rollingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.05)"} vertical={false} />
            <XAxis 
              dataKey="tradeNum" 
              tick={{ fontSize: 9, fill: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.5)" }} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(v) => `T#${v}`}
              interval="preserveStartEnd"
            />
            <YAxis 
              tickFormatter={(v) => `$${v}`}
              tick={{ fontSize: 9, fill: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.5)" }} 
              tickLine={false} 
              axisLine={false}
              width={50}
              domain={["auto", "auto"]}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: isDark ? "rgba(6,182,212,0.15)" : "rgba(6,182,212,0.25)", strokeWidth: 1 }} />
            <ReferenceLine y={0} stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.15)"} strokeDasharray="3 3" />
            <Area
              type="monotone"
              dataKey="movingAvg"
              stroke="#06B6D4"
              strokeWidth={2}
              fill="url(#rollingGradient)"
              dot={false}
              isAnimationActive={true}
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

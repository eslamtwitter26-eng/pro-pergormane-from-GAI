import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, AreaChart, Legend, LineChart,
} from "recharts";
import { Play, Pause, RotateCcw, TrendingUp, TrendingDown, Minus, Sliders, BarChart3, LineChart as LineIcon, Activity, Sparkles } from "lucide-react";
import type { Trade } from "@/lib/tradeAnalysis";
import { DownloadChartButton } from "./DownloadChartButton";

interface PLCurveProps {
  trades: Trade[];
  initialBalance: number;
  theme?: "dark" | "light";
}

interface PLPoint {
  label: string;
  cum: number;
  balance: number;
  tradeProfit: number;
  dd: number;
  tradeNum: number;
  symbol?: string;
  kind?: "buy" | "sell";
  dateStr?: string;
  lot?: number;
  openPrice?: number;
  closePrice?: number;
  benchmark?: number;
  rollingReturn?: number;
}

function buildPoints(trades: Trade[], initialBalance: number): PLPoint[] {
  if (!trades.length) return [];
  const sorted = [...trades].sort((a, b) => a.closeTime.getTime() - b.closeTime.getTime());
  let cum = 0, peak = 0;
  
  // Calculate average profit per trade to draw a benchmark line
  const totalNet = sorted.reduce((sum, t) => sum + t.netProfit, 0);
  const avgProfit = totalNet / sorted.length;

  const pts: PLPoint[] = [
    { 
      label: "Start", 
      cum: 0, 
      balance: initialBalance, 
      tradeProfit: 0, 
      dd: 0, 
      tradeNum: 0,
      benchmark: initialBalance,
      rollingReturn: 0 
    },
  ];

  for (let i = 0; i < sorted.length; i++) {
    const t = sorted[i];
    cum = parseFloat((cum + t.netProfit).toFixed(2));
    const currentBalance = parseFloat((initialBalance + cum).toFixed(2));
    peak = Math.max(peak, cum);
    
    // Compute 30-trade moving average rolling return
    let rollingSum = 0;
    let count = 0;
    for (let j = Math.max(0, i - 29); j <= i; j++) {
      rollingSum += sorted[j].netProfit;
      count++;
    }
    const rollingReturn = count > 0 ? parseFloat((rollingSum / count).toFixed(2)) : 0;

    // Benchmark grows steadily matching target return rate
    const benchmarkVal = parseFloat((initialBalance + (i + 1) * avgProfit).toFixed(2));

    pts.push({
      label: t.closeTime.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      dateStr: t.closeTime.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      cum,
      balance: currentBalance,
      tradeProfit: parseFloat(t.netProfit.toFixed(2)),
      dd: parseFloat((cum - peak).toFixed(2)),
      tradeNum: i + 1,
      symbol: t.symbol,
      kind: t.type,
      lot: t.volume,
      openPrice: t.openPrice,
      closePrice: t.closePrice,
      benchmark: benchmarkVal,
      rollingReturn,
    });
  }
  return pts;
}

const PLAY_SPEED = 25; // ms per step
const STEP = 1;        // points per tick

const HiddenDot = () => null;

export function PLCurve({ trades, initialBalance, theme }: PLCurveProps) {
  const isDark = theme !== "light";
  const gridColor = isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.05)";
  const labelColor = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.6)";
  const cursorColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.1)";
  const refLineColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.15)";

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload as PLPoint;
    if (!d || d.tradeNum === 0) return null;
    const win = d.tradeProfit >= 0;
    return (
      <div style={{
        background: isDark ? "hsl(var(--card) / 95%)" : "rgba(255,255,255,0.98)",
        border: `1px solid ${win ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
        borderRadius: 12,
        padding: "12px 16px",
        fontSize: 12,
        minWidth: 200,
        boxShadow: "0 10px 30px -10px rgba(0,0,0,0.15)",
        color: isDark ? "#ffffff" : "#0f172a"
      }}>
        <div className="flex items-center justify-between gap-4 mb-2">
          <span className="text-muted-foreground text-[11px] font-bold">#{d.tradeNum} · {d.dateStr}</span>
          {d.symbol && (
            <span style={{
              fontSize: 9, fontWeight: 900, letterSpacing: "0.06em",
              color: d.kind === "buy" ? "#60A5FA" : "#94A3B8",
              background: d.kind === "buy" ? "rgba(96,165,250,0.12)" : "rgba(148,163,184,0.12)",
              padding: "2px 6px", borderRadius: 4,
              border: `1px solid ${d.kind === "buy" ? "rgba(96,165,250,0.15)" : "rgba(148,163,184,0.15)"}`
            }}>
              {d.symbol} {d.kind?.toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex items-baseline justify-between gap-6">
          <span className="text-muted-foreground text-[11px] uppercase font-bold tracking-wider">Trade P&L</span>
          <span style={{ fontWeight: 900, fontSize: 14, color: win ? "#10B981" : "#EF4444" }}>
            {d.tradeProfit >= 0 ? "+" : ""} ${d.tradeProfit.toFixed(2)}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-6 mt-1">
          <span className="text-muted-foreground text-[11px] uppercase font-bold tracking-wider">Balance</span>
          <span style={{ fontWeight: 800, fontSize: 13, color: isDark ? "#ffffff" : "#0f172a" }}>
            ${d.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
        {d.dd < 0 && (
          <div className="flex items-baseline justify-between gap-6 mt-1 border-t border-[color:var(--hairline)] pt-1">
            <span className="text-muted-foreground text-[11px] uppercase font-bold tracking-wider">Drawdown</span>
            <span style={{ fontWeight: 600, fontSize: 12, color: "#EF4444" }}>${d.dd.toFixed(2)}</span>
          </div>
        )}
      </div>
    );
  };

  const allPoints = useMemo(() => buildPoints(trades, initialBalance), [trades, initialBalance]);
  const [displayCount, setDisplayCount] = useState(allPoints.length);
  const [playing, setPlaying] = useState(false);
  const [chartType, setChartType] = useState<"equity" | "balance" | "floating" | "benchmark" | "rolling">("equity");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setDisplayCount(allPoints.length);
  }, [allPoints]);

  const step = allPoints.length > 500 ? 5 : allPoints.length > 200 ? 3 : STEP;

  const stopPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setPlaying(false);
  }, []);

  const startPlay = useCallback(() => {
    setDisplayCount(1);
    setPlaying(true);
  }, []);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setDisplayCount((c) => {
          if (c >= allPoints.length) { stopPlay(); return allPoints.length; }
          return Math.min(c + step, allPoints.length);
        });
      }, PLAY_SPEED);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, allPoints.length, step, stopPlay]);

  const visiblePoints = useMemo(() => allPoints.slice(0, displayCount), [allPoints, displayCount]);

  // Selected trade for Replay Slider
  const replayIndex = Math.max(0, Math.min(displayCount - 1, allPoints.length - 1));
  const selectedPoint = allPoints[replayIndex];

  // Stats derived from FULL data
  const finalCum = allPoints[allPoints.length - 1]?.cum ?? 0;
  const peakCum = useMemo(() => Math.max(...allPoints.map((p) => p.cum), 0), [allPoints]);
  const maxDD = useMemo(() => Math.min(...allPoints.map((p) => p.dd), 0), [allPoints]);
  const returnPct = initialBalance > 0 ? (finalCum / initialBalance) * 100 : 0;

  // Gradient offset logic based on currently chosen chart metric
  const chartKey = chartType === "equity" ? "cum" : chartType === "balance" ? "balance" : chartType === "floating" ? "tradeProfit" : chartType === "benchmark" ? "benchmark" : "rollingReturn";

  const values = visiblePoints.map(p => Number(p[chartKey]) || 0);
  const minVal = Math.min(...values, 0);
  const maxVal = Math.max(...values, 0);
  const range = maxVal - minVal;
  const zeroOffset = range > 0 ? `${((maxVal / range) * 100).toFixed(1)}%` : maxVal <= 0 ? "0%" : "100%";

  const tickInterval = Math.max(1, Math.floor(visiblePoints.length / 8) - 1);

  if (!allPoints.length) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No trades to display
      </div>
    );
  }

  return (
    <div className="space-y-6 chart-export-container">
      {/* Chart Toggles and Header Banner */}
      <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between border-b border-[color:var(--hairline)] pb-4">
        <div className="flex flex-wrap gap-1.5 bg-[var(--surface-hover)] p-1 rounded-[14px] border border-[color:var(--hairline)]">
          {[
            { id: "equity", label: "Equity Curve", icon: Activity },
            { id: "balance", label: "Balance Curve", icon: LineIcon },
            { id: "floating", label: "Floating P/L (Trade)", icon: BarChart3 },
            { id: "benchmark", label: "Target Benchmark", icon: Sparkles },
            { id: "rolling", label: "30-Trade Rolling Return", icon: Sliders }
          ].map((type) => {
            const Icon = type.icon;
            const active = chartType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setChartType(type.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  active 
                    ? "bg-blue-500/15 text-blue-400 border border-[color:var(--hairline)]" 
                    : "text-muted-foreground hover:text-foreground hover:bg-[var(--surface-hover)] border border-transparent"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{type.label}</span>
              </button>
            );
          })}
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2">
          <DownloadChartButton title="P&L Performance Curve" variant="button" />
          <button
            onClick={playing ? stopPlay : startPlay}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all"
            style={{
              background: playing ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)",
              border: `1px solid ${playing ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
              color: playing ? "#EF4444" : "#10B981",
            }}
          >
            {playing ? <Pause className="h-3 w-3 animate-pulse" /> : <Play className="h-3 w-3" />}
            {playing ? "Pause" : "Play History"}
          </button>
          <button
            onClick={() => { stopPlay(); setDisplayCount(allPoints.length); }}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all hover:bg-[var(--surface-hover)] bg-[var(--surface-hover)] border border-[color:var(--hairline)] text-muted-foreground"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        </div>
      </div>

      {/* Main visual display of chosen chart mode */}
      <div className="relative overflow-hidden rounded-[14px] border border-[color:var(--hairline)] bg-[var(--surface-hover)] p-4">
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={visiblePoints} margin={{ top: 8, right: 8, left: 8, bottom: 4 }}>
              <defs>
                <linearGradient id="curveFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartType === "floating" ? "#60A5FA" : "#10B981"} stopOpacity={0.25} />
                  <stop offset={zeroOffset} stopColor={chartType === "floating" ? "#60A5FA" : "#10B981"} stopOpacity={0.02} />
                  <stop offset={zeroOffset} stopColor="#EF4444" stopOpacity={0.02} />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity={0.25} />
                </linearGradient>
                <linearGradient id="curveStroke" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartType === "floating" ? "#60A5FA" : "#10B981"} />
                  <stop offset={zeroOffset} stopColor={chartType === "floating" ? "#60A5FA" : "#10B981"} />
                  <stop offset={zeroOffset} stopColor="#EF4444" />
                  <stop offset="100%" stopColor="#EF4444" />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: labelColor, fontWeight: "600" }}
                tickLine={false} axisLine={false}
                interval={tickInterval}
              />
              <YAxis
                tickFormatter={(v) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                tick={{ fontSize: 9, fill: labelColor, fontWeight: "600" }}
                tickLine={false} axisLine={false}
                width={65}
                domain={["auto", "auto"]}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: cursorColor, strokeWidth: 1 }} />
              <ReferenceLine y={chartType === "balance" ? initialBalance : 0} stroke={refLineColor} strokeDasharray="3 3" />

              <Area
                type="monotone"
                dataKey={chartKey}
                stroke="url(#curveStroke)"
                strokeWidth={2}
                fill="url(#curveFill)"
                dot={<HiddenDot />}
                activeDot={{
                  r: 5,
                  fill: "#3B82F6",
                  stroke: "#ffffff",
                  strokeWidth: 1.5,
                }}
                isAnimationActive={false}
              />

              {chartType === "benchmark" && (
                <Line
                  type="monotone"
                  dataKey="benchmark"
                  stroke="#F59E0B"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  isAnimationActive={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Drawdown timeline below equity curve */}
      <div className="rounded-[14px] border border-[color:var(--hairline)] bg-[var(--surface-hover)] p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-bold text-red-400">
            Drawdown Timeline & Under-Water Periods
          </p>
          <span className="text-[11px] text-muted-foreground font-semibold">Max DD: ${Math.abs(maxDD).toFixed(2)}</span>
        </div>
        <div style={{ height: 60 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={visiblePoints} margin={{ top: 2, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="ddFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity={0.03} />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity={0.35} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" hide />
              <YAxis
                tickFormatter={(v) => `$${v}`}
                tick={{ fontSize: 8, fill: "rgba(239,68,68,0.5)" }}
                tickLine={false} axisLine={false}
                width={65}
                domain={["auto", 0]}
                tickCount={3}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="dd"
                stroke="#EF4444"
                strokeWidth={1}
                fill="url(#ddFill)"
                dot={false}
                activeDot={{ r: 3, fill: "#EF4444", stroke: "rgba(20,26,36,0.9)", strokeWidth: 1.5 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECTION 3 NEW FEATURE: 30 Trade Moving Average Momentum Chart */}
      <div className="rounded-[14px] border border-[color:var(--hairline)] bg-[var(--surface-hover)] p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-bold text-blue-400">
            Rolling Performance Momentum (30 Trade Moving Average)
          </p>
          <span className="text-[11px] text-muted-foreground font-semibold">Tracks consistency trend</span>
        </div>
        <div style={{ height: 80 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={visiblePoints} margin={{ top: 2, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="rollingFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60A5FA" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#60A5FA" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" hide />
              <YAxis
                tickFormatter={(v) => `$${v}`}
                tick={{ fontSize: 8, fill: "rgba(96,165,250,0.5)" }}
                tickLine={false} axisLine={false}
                width={65}
                domain={["auto", "auto"]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="rollingReturn"
                stroke="#60A5FA"
                strokeWidth={1.5}
                fill="url(#rollingFill)"
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trade Replay Slider controls with active trade details */}
      {allPoints.length > 1 && (
        <div className="rounded-[14px] p-6 border border-[color:var(--hairline)] bg-[var(--surface-hover)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-blue-400 animate-pulse" />
              <p className="text-xs font-semibold text-foreground">Interactive Trade Replay Engine</p>
            </div>
            <p className="text-[11px] font-semibold text-muted-foreground bg-[var(--surface-hover)] px-2.5 py-1 rounded-md border border-[color:var(--hairline)]">
              Drag to step through trades and replay historical performance step-by-step
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[11px] font-bold text-muted-foreground">T#1</span>
            <input
              type="range"
              min={1}
              max={allPoints.length - 1}
              value={displayCount - 1}
              onChange={(e) => setDisplayCount(Number(e.target.value) + 1)}
              className="flex-1 accent-blue-500 h-1 bg-border/20 rounded-lg cursor-pointer"
            />
            <span className="text-[11px] font-bold text-muted-foreground">T#{allPoints.length - 1}</span>
          </div>

          {selectedPoint && selectedPoint.tradeNum > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 pt-2">
              <div className="rounded-lg p-2.5 bg-card border border-[color:var(--hairline)] text-center">
                <span className="text-[11px] font-semibold text-muted-foreground block">Trade #</span>
                <p className="text-sm font-semibold text-foreground mt-0.5">#{selectedPoint.tradeNum}</p>
              </div>
              <div className="rounded-lg p-2.5 bg-card border border-[color:var(--hairline)] text-center">
                <span className="text-[11px] font-semibold text-muted-foreground block">Date</span>
                <p className="text-xs font-bold text-foreground mt-0.5 truncate">{selectedPoint.dateStr}</p>
              </div>
              <div className="rounded-lg p-2.5 bg-card border border-[color:var(--hairline)] text-center">
                <span className="text-[11px] font-semibold text-muted-foreground block">Symbol</span>
                <p className="text-xs font-semibold text-blue-400 mt-0.5">{selectedPoint.symbol}</p>
              </div>
              <div className="rounded-lg p-2.5 bg-card border border-[color:var(--hairline)] text-center">
                <span className="text-[11px] font-semibold text-muted-foreground block">Type</span>
                <span className={`inline-block text-[11px] font-bold px-1.5 py-0.5 rounded mt-1 uppercase ${
                  selectedPoint.kind === "buy" ? "bg-blue-500/10 text-blue-400" : "bg-slate-500/10 text-slate-400"
                }`}>
                  {selectedPoint.kind}
                </span>
              </div>
              <div className="rounded-lg p-2.5 bg-card border border-[color:var(--hairline)] text-center">
                <span className="text-[11px] font-semibold text-muted-foreground block">Size (Lots)</span>
                <p className="text-sm font-bold text-foreground mt-0.5">{selectedPoint.lot?.toFixed(2)}</p>
              </div>
              <div className="rounded-lg p-2.5 bg-card border border-[color:var(--hairline)] text-center">
                <span className="text-[11px] font-semibold text-muted-foreground block">Prices</span>
                <p className="text-[11px] font-semibold text-muted-foreground mt-0.5 truncate">
                  {selectedPoint.openPrice} → {selectedPoint.closePrice}
                </p>
              </div>
              <div className="rounded-lg p-2.5 bg-card border border-[color:var(--hairline)] text-center">
                <span className="text-[11px] font-semibold text-muted-foreground block">P&L</span>
                <p className="text-sm font-semibold mt-0.5" style={{ color: selectedPoint.tradeProfit >= 0 ? "#10B981" : "#EF4444" }}>
                  {selectedPoint.tradeProfit >= 0 ? "+" : ""}${selectedPoint.tradeProfit.toFixed(2)}
                </p>
              </div>
              <div className="rounded-lg p-2.5 bg-card border border-[color:var(--hairline)] text-center col-span-2 lg:col-span-1">
                <span className="text-[11px] font-semibold text-muted-foreground block">Max Drawdown</span>
                <p className="text-xs font-bold text-red-400 mt-0.5">${selectedPoint.dd?.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

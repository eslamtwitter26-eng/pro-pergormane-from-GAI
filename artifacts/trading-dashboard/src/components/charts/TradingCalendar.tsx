import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Filter, X } from "lucide-react";
import type { Trade } from "@/lib/tradeAnalysis";
import { DownloadChartButton } from "./DownloadChartButton";

interface DayData {
  netProfit: number;
  trades: number;
}

interface TradingCalendarProps {
  trades: Trade[];
  onMonthSelect?: (year: number, month: number) => void;
  selectedMonth?: { year: number; month: number } | null;
  theme?: "dark" | "light";
}

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatMoney(v: number): string {
  const abs = Math.abs(v);
  const sign = v >= 0 ? "+" : "-";
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}k`;
  return `${sign}$${abs.toFixed(2)}`;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function TradingCalendar({ trades, onMonthSelect, selectedMonth, theme }: TradingCalendarProps) {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  // Aggregate by close date
  const dayMap = useMemo(() => {
    const map = new Map<string, DayData>();
    for (const t of trades) {
      const key = toYMD(t.closeTime);
      const ex = map.get(key);
      if (ex) { ex.netProfit += t.netProfit; ex.trades += 1; }
      else map.set(key, { netProfit: t.netProfit, trades: 1 });
    }
    return map;
  }, [trades]);

  // Date range from report
  const { minYear, minMonth, maxYear, maxMonth, defaultYear, defaultMonth } = useMemo(() => {
    if (trades.length === 0) {
      const now = new Date();
      return { minYear: now.getFullYear(), minMonth: now.getMonth(), maxYear: now.getFullYear(), maxMonth: now.getMonth(), defaultYear: now.getFullYear(), defaultMonth: now.getMonth() };
    }
    let minOpen = trades[0].openTime.getTime();
    let maxClose = trades[0].closeTime.getTime();
    for (const t of trades) {
      if (t.openTime.getTime() < minOpen) minOpen = t.openTime.getTime();
      if (t.closeTime.getTime() > maxClose) maxClose = t.closeTime.getTime();
    }
    const start = new Date(minOpen);
    const end = new Date(maxClose);
    return {
      minYear: start.getFullYear(), minMonth: start.getMonth(),
      maxYear: end.getFullYear(), maxMonth: end.getMonth(),
      defaultYear: end.getFullYear(), defaultMonth: end.getMonth(),
    };
  }, [trades]);

  const [curYear, setCurYear] = useState(defaultYear);
  const [curMonth, setCurMonth] = useState(defaultMonth);

  const canPrev = curYear > minYear || (curYear === minYear && curMonth > minMonth);
  const canNext = curYear < maxYear || (curYear === maxYear && curMonth < maxMonth);

  function prev() {
    if (!canPrev) return;
    if (curMonth === 0) { setCurYear(y => y - 1); setCurMonth(11); }
    else setCurMonth(m => m - 1);
  }
  function next() {
    if (!canNext) return;
    if (curMonth === 11) { setCurYear(y => y + 1); setCurMonth(0); }
    else setCurMonth(m => m + 1);
  }

  // Month grid
  const firstDayOfWeek = new Date(curYear, curMonth, 1).getDay();
  const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
  const padding = Array.from({ length: firstDayOfWeek });

  // Stats for current month
  const monthStats = useMemo(() => {
    let profit = 0, loss = 0, pnl = 0, traded = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${curYear}-${String(curMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const data = dayMap.get(key);
      if (data) {
        traded++;
        pnl += data.netProfit;
        if (data.netProfit > 0) profit++;
        else if (data.netProfit < 0) loss++;
      }
    }
    return { profit, loss, pnl, traded };
  }, [curYear, curMonth, daysInMonth, dayMap]);

  const isDark = theme !== "light";

  if (trades.length === 0) {
    return <div className="flex h-40 items-center justify-center text-muted-foreground text-sm">No trades to display</div>;
  }

  return (
    <div className="space-y-4 chart-export-container">
      {/* Header: nav arrows + month/year + filter button */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={prev}
          disabled={!canPrev}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-150 hover:scale-110 disabled:opacity-20 disabled:cursor-not-allowed"
          style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)" }}
        >
          <ChevronLeft className="h-4 w-4" style={{ color: "#8B5CF6" }} />
        </button>

        <div className="flex flex-1 items-center justify-center gap-3">
          <div className="text-center">
            <p className="text-lg font-black tracking-wide" style={{ color: "#8B5CF6" }}>
              {MONTH_NAMES[curMonth]}
            </p>
            <p className="text-sm font-semibold" style={{ color: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.7)" }}>{curYear}</p>
          </div>

          {onMonthSelect && (() => {
            const isActive = selectedMonth?.year === curYear && selectedMonth?.month === curMonth;
            return (
              <button
                onClick={() => onMonthSelect(curYear, curMonth)}
                title={isActive ? "Month filter active — click to refresh" : `Filter all charts to ${MONTH_NAMES[curMonth]} ${curYear}`}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-150 hover:scale-105"
                style={{
                  background: isActive ? "rgba(16,240,135,0.18)" : "rgba(139,92,246,0.15)",
                  border: `1px solid ${isActive ? "rgba(16,240,135,0.5)" : "rgba(139,92,246,0.4)"}`,
                  color: isActive ? "#10F087" : "#8B5CF6",
                  boxShadow: isActive ? "0 0 10px rgba(16,240,135,0.2)" : "none",
                }}
              >
                <Filter className="h-3 w-3" />
                {isActive ? "Active" : "Filter"}
              </button>
            );
          })()}

          <DownloadChartButton title={`Trading Calendar ${MONTH_NAMES[curMonth]} ${curYear}`} variant="icon" />
        </div>

        <button
          onClick={next}
          disabled={!canNext}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-150 hover:scale-110 disabled:opacity-20 disabled:cursor-not-allowed"
          style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)" }}
        >
          <ChevronRight className="h-4 w-4" style={{ color: "#8B5CF6" }} />
        </button>
      </div>

      {/* Month summary pills */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Profit Days", value: monthStats.profit, color: "#10F087" },
          { label: "Loss Days",   value: monthStats.loss,   color: "#FF4757" },
          { label: "Traded Days", value: monthStats.traded, color: "#8B5CF6" },
          { label: "Month P&L",  value: formatMoney(monthStats.pnl), color: monthStats.pnl >= 0 ? "#10F087" : "#FF4757" },
        ].map((s) => (
          <div key={s.label}
            className="flex-1 min-w-[72px] rounded-xl px-2.5 py-2 text-center"
            style={{ 
              background: isDark ? "rgba(8,11,28,0.7)" : "rgba(244,244,245,0.9)", 
              border: isDark ? `1px solid ${s.color}20` : `1px solid ${s.color}35` 
            }}>
            <p className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.5)" }}>{s.label}</p>
            <p className="mt-0.5 text-sm font-black tabular-nums" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {/* Weekday headers */}
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-bold uppercase tracking-widest pb-1" style={{ color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)" }}>
            {d}
          </div>
        ))}

        {/* Padding */}
        {padding.map((_, i) => <div key={`pad-${i}`} />)}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const key = `${curYear}-${String(curMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const data = dayMap.get(key);
          const dow = new Date(curYear, curMonth, day).getDay();
          const isWeekend = dow === 0 || dow === 6;

          let bg = isWeekend ? (isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)") : (isDark ? "rgba(8,11,28,0.55)" : "rgba(255,255,255,0.95)");
          let border = isWeekend ? (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)") : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)");
          let pnlColor = "#6B7280";
          let glow = "none";
          let numColor = isWeekend ? (isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)") : (isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.85)");

          if (data) {
            if (data.netProfit > 0) {
              bg = isDark ? "rgba(16,240,135,0.13)" : "rgba(16,240,135,0.08)";
              border = "rgba(16,240,135,0.5)";
              pnlColor = "#10F087";
              glow = "0 0 12px rgba(16,240,135,0.22)";
              numColor = isDark ? "#10F087" : "#059669";
            } else if (data.netProfit < 0) {
              bg = isDark ? "rgba(255,71,87,0.13)" : "rgba(255,71,87,0.08)";
              border = "rgba(255,71,87,0.5)";
              pnlColor = "#FF4757";
              glow = "0 0 12px rgba(255,71,87,0.2)";
              numColor = isDark ? "#FF4757" : "#DC2626";
            } else {
              bg = isDark ? "rgba(139,92,246,0.09)" : "rgba(139,92,246,0.05)";
              border = "rgba(139,92,246,0.38)";
              pnlColor = "#8B5CF6";
              numColor = "#8B5CF6";
            }
          }

          return (
            <div key={key}
              onMouseEnter={() => setHoveredDay(key)}
              onMouseLeave={() => setHoveredDay(null)}
              className="relative rounded-xl p-1.5 flex flex-col min-h-[64px] transition-all duration-150 hover:scale-[1.05] cursor-pointer"
              style={{ background: bg, border: `1px solid ${border}`, boxShadow: glow }}>
              
              {/* Tooltip on hovering active trading day */}
              {data && hoveredDay === key && (
                <div className="absolute bottom-[105%] left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none rounded-xl border border-purple-500/25 bg-popover/98 p-3 shadow-2xl backdrop-blur-md text-[11px] min-w-[160px] text-left leading-normal animate-fade-in"
                  style={{ 
                    background: isDark ? "rgba(15,23,42,0.95)" : "rgba(255,255,255,0.98)",
                    color: isDark ? "#ffffff" : "#0f172a"
                  }}>
                  <p className="font-extrabold text-muted-foreground pb-1 border-b border-border/5 mb-1.5 text-[10px]">{key}</p>
                  <div className="space-y-1">
                    <p className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Net Profit:</span>
                      <strong style={{ color: data.netProfit >= 0 ? (isDark ? "#10F087" : "#059669") : (isDark ? "#FF4757" : "#DC2626") }}>
                        {formatMoney(data.netProfit)}
                      </strong>
                    </p>
                    <p className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Trades:</span>
                      <strong className="text-foreground">{data.trades}</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* Day number */}
              <span className="text-[11px] font-bold leading-none" style={{ color: numColor }}>{day}</span>

              {/* Trade data */}
              {data && (
                <div className="mt-auto space-y-0.5">
                  <p className="text-[10px] font-black tabular-nums leading-tight"
                    style={{ color: isDark ? pnlColor : (data.netProfit >= 0 ? "#059669" : "#DC2626"), textShadow: isDark ? `0 0 6px ${pnlColor}60` : "none" }}>
                    {formatMoney(data.netProfit)}
                  </p>
                  <p className="text-[9px] font-semibold leading-none text-muted-foreground/80">
                    {data.trades} {data.trades === 1 ? "trade" : "trades"}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 pt-0.5">
        {[
          { color: "#10F087", label: "Profit day" },
          { color: "#FF4757", label: "Loss day" },
          { color: "#8B5CF6", label: "Break-even" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ background: `${l.color}25`, border: `1px solid ${l.color}55` }} />
            <span className="text-[10px]" style={{ color: isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.65)" }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

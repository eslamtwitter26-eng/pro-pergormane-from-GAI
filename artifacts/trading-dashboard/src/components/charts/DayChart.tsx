import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import type { DailyPerformance } from "@/lib/tradeAnalysis";
import type { Language } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { CHART, gridProps, axisProps, tooltipStyle, cursorFill, ANIM, BAR_RADIUS } from "@/lib/chartTheme";

export function DayChart({ data, lang }: { data: DailyPerformance[]; lang: Language }) {
  const ordered = [...data].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  const chartData = ordered.map((d) => ({
    day: d.dayName.slice(0, 3),
    profit: parseFloat(d.netProfit.toFixed(2)),
    trades: d.trades,
    winRate: parseFloat(d.winRate.toFixed(1)),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="day" {...axisProps} />
        <YAxis tickFormatter={(v) => `$${v}`} width={58} {...axisProps} />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={{ color: "#94A3B8", fontSize: 11, marginBottom: 4 }}
          itemStyle={{ color: "#FFFFFF", fontSize: 13, fontWeight: 600 }}
          formatter={(v: number) => [`$${v.toFixed(2)}`, t(lang, "netProfit")]}
          cursor={cursorFill}
        />
        <ReferenceLine y={0} stroke="rgba(148,163,184,0.22)" />
        <Bar dataKey="profit" radius={BAR_RADIUS} maxBarSize={44} {...ANIM}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.profit >= 0 ? CHART.primary : CHART.danger} fillOpacity={0.9} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

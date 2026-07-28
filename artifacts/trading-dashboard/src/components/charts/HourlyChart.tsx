import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import type { HourlyPerformance } from "@/lib/tradeAnalysis";
import type { Language } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { CHART, gridProps, axisProps, tooltipStyle, cursorFill, ANIM, BAR_RADIUS } from "@/lib/chartTheme";

export function HourlyChart({ data, lang }: { data: HourlyPerformance[]; lang: Language }) {
  const chartData = data.map(h => ({
    hour: `${h.hour}h`,
    profit: parseFloat(h.netProfit.toFixed(2)),
    trades: h.trades,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="hour" {...axisProps} tick={{ fontSize: 10, fill: "#94A3B8" }} interval={1} />
        <YAxis tickFormatter={(v) => `$${v}`} width={58} {...axisProps} />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={{ color: "#94A3B8", fontSize: 11, marginBottom: 4 }}
          itemStyle={{ color: "#FFFFFF", fontSize: 13, fontWeight: 600 }}
          formatter={(v: number) => [`$${v.toFixed(2)}`, t(lang, "netProfit")]}
          cursor={cursorFill}
        />
        <ReferenceLine y={0} stroke="rgba(148,163,184,0.22)" />
        <Bar dataKey="profit" radius={[4, 4, 0, 0]} {...ANIM}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.profit >= 0 ? CHART.accent : CHART.danger} fillOpacity={0.9} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import type { SymbolPerformance } from "@/lib/tradeAnalysis";
import type { Language } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { CHART, axisProps, tooltipStyle, cursorFill, ANIM, BAR_RADIUS_H } from "@/lib/chartTheme";

export function SymbolChart({ data, lang }: { data: SymbolPerformance[]; lang: Language }) {
  const top = [...data].sort((a, b) => Math.abs(b.netProfit) - Math.abs(a.netProfit)).slice(0, 10);
  const chartData = top.map((s) => ({
    symbol: s.symbol,
    profit: parseFloat(s.netProfit.toFixed(2)),
    winRate: parseFloat(s.winRate.toFixed(1)),
    trades: s.trades,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, chartData.length * 40)}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 12, left: 8, bottom: 4 }}>
        <CartesianGrid stroke="rgba(148,163,184,0.1)" strokeDasharray="0" horizontal={false} />
        <XAxis type="number" tickFormatter={(v) => `$${v}`} {...axisProps} />
        <YAxis
          type="category"
          dataKey="symbol"
          tick={{ fontSize: 12, fill: "#94A3B8", fontWeight: 500 }}
          tickLine={false}
          axisLine={false}
          width={72}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={{ color: "#94A3B8", fontSize: 11, marginBottom: 4 }}
          itemStyle={{ color: "#FFFFFF", fontSize: 13, fontWeight: 600 }}
          formatter={(v: number) => [`$${v.toFixed(2)}`, t(lang, "netProfit")]}
          cursor={cursorFill}
        />
        <ReferenceLine x={0} stroke="rgba(148,163,184,0.22)" />
        <Bar dataKey="profit" radius={BAR_RADIUS_H} maxBarSize={22} {...ANIM}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.profit >= 0 ? CHART.primary : CHART.danger} fillOpacity={0.9} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

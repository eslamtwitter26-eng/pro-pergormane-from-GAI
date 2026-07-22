import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { HourlyPerformance } from "@/lib/tradeAnalysis";
import type { Language } from "@/lib/i18n";
import { t } from "@/lib/i18n";

const TooltipStyle = { background: "rgba(8,11,28,0.95)", border: "1px solid rgba(6,182,212,0.3)", borderRadius: 10, padding: "10px 14px", backdropFilter: "blur(16px)", fontSize: 12 };

export function HourlyChart({ data, lang }: { data: HourlyPerformance[]; lang: Language }) {
  const chartData = data.map(h => ({
    hour: `${h.hour}h`, profit: parseFloat(h.netProfit.toFixed(2)), trades: h.trades,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <defs>
          <linearGradient id="hourCyan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.3} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(6,182,212,0.06)" />
        <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.85)" }} tickLine={false} axisLine={false} />
        <YAxis tickFormatter={(v) => `${v}`} tick={{ fontSize: 10, fill: "rgba(255,255,255,0.85)" }} tickLine={false} axisLine={false} width={55} />
        <Tooltip contentStyle={TooltipStyle} formatter={(v: number) => [`$${v.toFixed(2)}`, t(lang, "netProfit")]} cursor={{ fill: "rgba(6,182,212,0.06)" }} />
        <Bar dataKey="profit" radius={[3, 3, 0, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.profit >= 0 ? "url(#hourCyan)" : "#FF4757"}
              style={{ filter: `drop-shadow(0 0 4px ${entry.profit >= 0 ? "rgba(6,182,212,0.4)" : "rgba(255,71,87,0.3)"})` }} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

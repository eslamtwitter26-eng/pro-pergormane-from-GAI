import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { SymbolPerformance } from "@/lib/tradeAnalysis";
import type { Language } from "@/lib/i18n";
import { t } from "@/lib/i18n";

const NEON_PALETTE = ["#8B5CF6", "#06B6D4", "#10F087", "#FFD32D", "#F472B6", "#8B5CF6", "#06B6D4", "#10F087", "#FFD32D", "#F472B6"];
const TooltipStyle = { background: "rgba(8,11,28,0.95)", border: "1px solid rgba(16,240,135,0.3)", borderRadius: 10, padding: "10px 14px", backdropFilter: "blur(16px)", fontSize: 12 };

export function SymbolChart({ data, lang }: { data: SymbolPerformance[]; lang: Language }) {
  const top = [...data].sort((a, b) => Math.abs(b.netProfit) - Math.abs(a.netProfit)).slice(0, 10);
  const chartData = top.map((s, i) => ({
    symbol: s.symbol, profit: parseFloat(s.netProfit.toFixed(2)),
    winRate: parseFloat(s.winRate.toFixed(1)), trades: s.trades,
    color: NEON_PALETTE[i % NEON_PALETTE.length],
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, chartData.length * 34)}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,240,135,0.06)" horizontal={false} />
        <XAxis type="number" tickFormatter={(v) => `${v}`} tick={{ fontSize: 10, fill: "rgba(255,255,255,0.85)" }} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="symbol" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.9)", fontWeight: 600 }} tickLine={false} axisLine={false} width={65} />
        <Tooltip contentStyle={TooltipStyle} formatter={(v: number) => [`$${v.toFixed(2)}`, t(lang, "netProfit")]} cursor={{ fill: "rgba(16,240,135,0.04)" }} />
        <Bar dataKey="profit" radius={[0, 5, 5, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.profit >= 0 ? entry.color : "#FF4757"}
              style={{ filter: `drop-shadow(0 0 5px ${entry.profit >= 0 ? entry.color + "70" : "rgba(255,71,87,0.4)"})` }} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

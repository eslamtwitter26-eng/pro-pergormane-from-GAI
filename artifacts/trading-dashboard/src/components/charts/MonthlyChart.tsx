import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { MonthlyPerformance } from "@/lib/tradeAnalysis";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const v = payload[0].value as number;
  return (
    <div style={{ background: "rgba(8,11,28,0.95)", border: `1px solid ${v >= 0 ? "rgba(16,240,135,0.3)" : "rgba(255,71,87,0.3)"}`, borderRadius: 10, padding: "10px 14px", backdropFilter: "blur(16px)" }}>
      <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 11, marginBottom: 4 }}>{label}</p>
      <p style={{ color: v >= 0 ? "#10F087" : "#FF4757", fontWeight: 800, fontSize: 15 }}>${v.toFixed(2)}</p>
    </div>
  );
};

export function MonthlyChart({ data }: { data: MonthlyPerformance[] }) {
  const chartData = data.map(m => ({ name: m.monthName, profit: parseFloat(m.netProfit.toFixed(2)) }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="barGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10F087" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#10F087" stopOpacity={0.4} />
          </linearGradient>
          <linearGradient id="barRed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF4757" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#FF4757" stopOpacity={0.4} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.06)" />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.85)" }} tickLine={false} axisLine={false} interval={data.length > 12 ? Math.floor(data.length / 12) : 0} />
        <YAxis tickFormatter={(v) => `${v}`} tick={{ fontSize: 10, fill: "rgba(255,255,255,0.85)" }} tickLine={false} axisLine={false} width={60} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(139,92,246,0.06)" }} />
        <Bar dataKey="profit" radius={[5, 5, 0, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.profit >= 0 ? "url(#barGreen)" : "url(#barRed)"}
              style={{ filter: `drop-shadow(0 0 6px ${entry.profit >= 0 ? "rgba(16,240,135,0.4)" : "rgba(255,71,87,0.4)"})` }} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

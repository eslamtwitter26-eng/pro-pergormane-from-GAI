import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { DirectionAnalysis } from "@/lib/tradeAnalysis";

const TooltipStyle = { background: "rgba(8,11,28,0.95)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 10, padding: "10px 14px", backdropFilter: "blur(16px)", fontSize: 12 };

export function DirectionChart({ data }: { data: DirectionAnalysis; lang?: string }) {
  const tradeData = [
    { name: "Buy", value: data.buyTrades, color: "#10F087" },
    { name: "Sell", value: data.sellTrades, color: "#8B5CF6" },
  ];
  const profitData = [
    { name: "Buy Profit", value: Math.max(0, data.buyProfit), color: "#10F087" },
    { name: "Sell Profit", value: Math.max(0, data.sellProfit), color: "#06B6D4" },
    { name: "Buy Loss", value: Math.max(0, -Math.min(0, data.buyProfit)), color: "#FFD32D" },
    { name: "Sell Loss", value: Math.max(0, -Math.min(0, data.sellProfit)), color: "#FF4757" },
  ].filter(d => d.value > 0);

  const RADIAN = Math.PI / 180;
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }: any) => {
    if (percent < 0.05) return null;
    const r = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={700}>{`${(percent * 100).toFixed(0)}%`}</text>;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Trade Count</p>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <defs>
                {tradeData.map((d, i) => (
                  <radialGradient key={i} id={`pieGrad${i}`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={d.color} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={d.color} stopOpacity={0.6} />
                  </radialGradient>
                ))}
              </defs>
              <Pie data={tradeData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" paddingAngle={4} labelLine={false} label={renderLabel}>
                {tradeData.map((entry, i) => (
                  <Cell key={i} fill={`url(#pieGrad${i})`} stroke="transparent"
                    style={{ filter: `drop-shadow(0 0 8px ${entry.color}60)` }} />
                ))}
              </Pie>
              <Tooltip contentStyle={TooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-1">
            {tradeData.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ background: d.color, boxShadow: `0 0 6px ${d.color}` }} />
                <span className="text-xs text-muted-foreground">{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">P&L Distribution</p>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={profitData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" paddingAngle={4} labelLine={false} label={renderLabel}>
                {profitData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="transparent"
                    style={{ filter: `drop-shadow(0 0 8px ${entry.color}60)` }} />
                ))}
              </Pie>
              <Tooltip contentStyle={TooltipStyle} formatter={(v: number) => [`$${v.toFixed(2)}`]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center flex-wrap gap-2 mt-1">
            {profitData.map((d, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full" style={{ background: d.color }} />
                <span className="text-[10px] text-muted-foreground">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Buy Win Rate", value: `${data.buyWinRate.toFixed(1)}%`, color: "#10F087" },
          { label: "Sell Win Rate", value: `${data.sellWinRate.toFixed(1)}%`, color: "#8B5CF6" },
          { label: "Buy Net P&L", value: `$${data.buyProfit.toFixed(2)}`, color: data.buyProfit >= 0 ? "#10F087" : "#FF4757" },
          { label: "Sell Net P&L", value: `$${data.sellProfit.toFixed(2)}`, color: data.sellProfit >= 0 ? "#10F087" : "#FF4757" },
        ].map((item, i) => (
          <div key={i} className="rounded-xl p-3" style={{ background: "rgba(8,11,28,0.6)", border: `1px solid ${item.color}25` }}>
            <p className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">{item.label}</p>
            <p className="mt-1 text-lg font-black tabular-nums" style={{ color: item.color, textShadow: `0 0 12px ${item.color}60` }}>{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

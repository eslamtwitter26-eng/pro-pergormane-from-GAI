import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { DirectionAnalysis } from "@/lib/tradeAnalysis";

const TooltipStyle = { background: "#141A24", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px 14px", fontSize: 12, color: "#FFFFFF", boxShadow: "0 18px 44px -18px rgba(0,0,0,0.6)" };

export function DirectionChart({ data }: { data: DirectionAnalysis; lang?: string }) {
  const tradeData = [
    { name: "Buy", value: data.buyTrades, color: "#10B981" },
    { name: "Sell", value: data.sellTrades, color: "#3B82F6" },
  ];
  const profitData = [
    { name: "Buy Profit", value: Math.max(0, data.buyProfit), color: "#10B981" },
    { name: "Sell Profit", value: Math.max(0, data.sellProfit), color: "#60A5FA" },
    { name: "Buy Loss", value: Math.max(0, -Math.min(0, data.buyProfit)), color: "#F59E0B" },
    { name: "Sell Loss", value: Math.max(0, -Math.min(0, data.sellProfit)), color: "#EF4444" },
  ].filter(d => d.value > 0);

  const RADIAN = Math.PI / 180;
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }: any) => {
    if (percent < 0.05) return null;
    const r = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>{`${(percent * 100).toFixed(0)}%`}</text>;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-8">
        <div>
          <p className="mb-3 text-center text-[11px] font-medium text-muted-foreground">Trade Count</p>
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={tradeData} cx="50%" cy="50%" innerRadius={48} outerRadius={78} dataKey="value" paddingAngle={4} labelLine={false} label={renderLabel}>
                {tradeData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} fillOpacity={0.9} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip contentStyle={TooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-1">
            {tradeData.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                <span className="text-xs text-muted-foreground">{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-3 text-center text-[11px] font-medium text-muted-foreground">P&L Distribution</p>
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={profitData} cx="50%" cy="50%" innerRadius={48} outerRadius={78} dataKey="value" paddingAngle={4} labelLine={false} label={renderLabel}>
                {profitData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip contentStyle={TooltipStyle} formatter={(v: number) => [`$${v.toFixed(2)}`]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center flex-wrap gap-2 mt-1">
            {profitData.map((d, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full" style={{ background: d.color }} />
                <span className="text-[11px] text-muted-foreground">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Buy Win Rate", value: `${data.buyWinRate.toFixed(1)}%`, color: "#10B981" },
          { label: "Sell Win Rate", value: `${data.sellWinRate.toFixed(1)}%`, color: "#3B82F6" },
          { label: "Buy Net P&L", value: `$${data.buyProfit.toFixed(2)}`, color: data.buyProfit >= 0 ? "#10B981" : "#EF4444" },
          { label: "Sell Net P&L", value: `$${data.sellProfit.toFixed(2)}`, color: data.sellProfit >= 0 ? "#10B981" : "#EF4444" },
        ].map((item, i) => (
          <div key={i} className="rounded-[14px] p-3" style={{ background: "rgba(20,26,36,0.6)", border: `1px solid ${item.color}25` }}>
            <p className="text-[11px] font-medium text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums" style={{ color: item.color, textShadow: "none" }}>{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

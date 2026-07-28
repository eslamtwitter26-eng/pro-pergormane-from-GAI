import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import type { MonthlyPerformance } from "@/lib/tradeAnalysis";
import { CHART, gridProps, axisProps, tooltipStyle, cursorFill, ANIM, BAR_RADIUS } from "@/lib/chartTheme";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const v = payload[0].value as number;
  return (
    <div style={tooltipStyle}>
      <p style={{ color: "#94A3B8", fontSize: 11, marginBottom: 5 }}>{label}</p>
      <p style={{ color: v >= 0 ? CHART.success : CHART.danger, fontWeight: 600, fontSize: 15, letterSpacing: "-0.02em" }}>
        ${v.toFixed(2)}
      </p>
    </div>
  );
};

export function MonthlyChart({ data }: { data: MonthlyPerformance[] }) {
  const chartData = data.map(m => ({ name: m.monthName, profit: parseFloat(m.netProfit.toFixed(2)) }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
        <CartesianGrid {...gridProps} />
        <XAxis
          dataKey="name"
          {...axisProps}
          interval={data.length > 12 ? Math.floor(data.length / 12) : 0}
        />
        <YAxis
          {...axisProps}
          tickFormatter={(v) => `$${v}`}
          width={62}
        />
        <Tooltip content={<CustomTooltip />} cursor={cursorFill} />
        <ReferenceLine y={0} stroke="rgba(148,163,184,0.22)" />
        <Bar dataKey="profit" radius={BAR_RADIUS} maxBarSize={38} {...ANIM}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.profit >= 0 ? CHART.success : CHART.danger} fillOpacity={0.9} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

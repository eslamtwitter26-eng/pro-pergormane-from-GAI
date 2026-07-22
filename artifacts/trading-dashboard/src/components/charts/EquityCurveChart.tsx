import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import type { EquityPoint } from "@/lib/tradeAnalysis";

interface EquityCurveChartProps {
  data: EquityPoint[];
}

const fmt = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "hsl(var(--card) / 95%)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 10, padding: "10px 14px", backdropFilter: "blur(16px)", boxShadow: "0 0 20px rgba(139,92,246,0.2)" }}>
      <p className="text-muted-foreground/80 text-[11px] mb-1">{fmt.format(new Date(label))}</p>
      <p style={{ color: "#8B5CF6", fontWeight: 800, fontSize: 15 }}>${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
    </div>
  );
};

export function EquityCurveChart({ data }: EquityCurveChartProps) {
  const chartData = useMemo(() => {
    if (data.length <= 500) return data.map(p => ({ time: p.time.getTime(), balance: p.balance }));
    const step = Math.ceil(data.length / 500);
    return data.filter((_, i) => i % step === 0).map(p => ({ time: p.time.getTime(), balance: p.balance }));
  }, [data]);

  const minBalance = useMemo(() => Math.min(...chartData.map(d => d.balance)), [chartData]);
  const maxBalance = useMemo(() => Math.max(...chartData.map(d => d.balance)), [chartData]);
  const startBalance = chartData[0]?.balance ?? 0;
  const isProfit = chartData.length > 1 && chartData[chartData.length - 1].balance >= chartData[0].balance;
  const gradId = isProfit ? "equityGradGreen" : "equityGradRed";
  const strokeColor = isProfit ? "#8B5CF6" : "#FF4757";
  const gradStart = isProfit ? "rgba(139,92,246,0.5)" : "rgba(255,71,87,0.5)";
  const gradEnd = isProfit ? "rgba(139,92,246,0.02)" : "rgba(255,71,87,0.02)";

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={gradStart} stopOpacity={1} />
            <stop offset="60%" stopColor={isProfit ? "rgba(139,92,246,0.08)" : "rgba(255,71,87,0.08)"} stopOpacity={1} />
            <stop offset="95%" stopColor={gradEnd} stopOpacity={1} />
          </linearGradient>
          <filter id="equityGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.06)" />
        <XAxis
          dataKey="time" type="number" domain={["dataMin", "dataMax"]}
          tickFormatter={(v) => fmt.format(new Date(v))}
          tick={{ fontSize: 10, fill: "rgba(150,160,200,0.5)" }}
          tickLine={false} axisLine={false} scale="time"
        />
        <YAxis
          domain={[minBalance * 0.995, maxBalance * 1.005]}
          tickFormatter={(v) => `$${v.toLocaleString()}`}
          tick={{ fontSize: 10, fill: "rgba(150,160,200,0.5)" }}
          tickLine={false} axisLine={false} width={78}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={startBalance} stroke="rgba(139,92,246,0.25)" strokeDasharray="5 3" />
        <Area
          type="monotone" dataKey="balance"
          stroke={strokeColor} strokeWidth={2.5}
          fill={`url(#${gradId})`} dot={false}
          activeDot={{ r: 5, fill: strokeColor, stroke: "rgba(8,11,28,0.8)", strokeWidth: 2, filter: `drop-shadow(0 0 6px ${strokeColor})` }}
          style={{ filter: `drop-shadow(0 0 4px ${strokeColor}60)` }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import type { EquityPoint } from "@/lib/tradeAnalysis";
import { CHART, gridProps, axisProps, tooltipStyle, ANIM } from "@/lib/chartTheme";

interface EquityCurveChartProps {
  data: EquityPoint[];
}

const fmt = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipStyle}>
      <p style={{ color: "#94A3B8", fontSize: 11, marginBottom: 5 }}>{fmt.format(new Date(label))}</p>
      <p style={{ color: "#FFFFFF", fontWeight: 600, fontSize: 15, letterSpacing: "-0.02em" }}>
        ${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </p>
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
  const strokeColor = isProfit ? CHART.primary : CHART.danger;
  const gradId = isProfit ? "equityGradUp" : "equityGradDown";

  return (
    <ResponsiveContainer width="100%" height={360}>
      <AreaChart data={chartData} margin={{ top: 10, right: 8, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity={0.22} />
            <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...gridProps} />
        <XAxis
          dataKey="time" type="number" domain={["dataMin", "dataMax"]}
          tickFormatter={(v) => fmt.format(new Date(v))}
          scale="time"
          {...axisProps}
          minTickGap={40}
        />
        <YAxis
          domain={[minBalance * 0.995, maxBalance * 1.005]}
          tickFormatter={(v) => `$${v.toLocaleString()}`}
          width={78}
          {...axisProps}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: "rgba(148,163,184,0.3)", strokeWidth: 1, strokeDasharray: "4 4" }}
        />
        <ReferenceLine y={startBalance} stroke="rgba(148,163,184,0.22)" strokeDasharray="4 4" />
        <Area
          type="monotone" dataKey="balance"
          stroke={strokeColor} strokeWidth={2}
          fill={`url(#${gradId})`} dot={false}
          activeDot={{ r: 4, fill: strokeColor, stroke: "#0B0F17", strokeWidth: 2 }}
          {...ANIM}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

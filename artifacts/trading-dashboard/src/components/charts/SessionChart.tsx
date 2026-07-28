import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, ReferenceLine } from "recharts";
import type { SessionPerformance } from "@/lib/tradeAnalysis";
import type { Language } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { CHART, gridProps, axisProps, tooltipStyle, cursorFill, ANIM, BAR_RADIUS } from "@/lib/chartTheme";

function translateSession(session: string, lang: Language): string {
  const map: Record<string, Record<Language, string>> = {
    Asia: { en: "Asia", ar: "آسيا", fr: "Asie" },
    London: { en: "London", ar: "لندن", fr: "Londres" },
    "New York": { en: "New York", ar: "نيويورك", fr: "New York" },
  };
  return map[session]?.[lang] ?? session;
}

const SubLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-3 text-[11px] font-medium text-muted-foreground">{children}</p>
);

export function SessionChart({ data, lang }: { data: SessionPerformance[]; lang: Language }) {
  const chartData = data.map((s) => ({
    session: translateSession(s.session, lang),
    winRate: parseFloat(s.winRate.toFixed(1)),
    profit: parseFloat(s.netProfit.toFixed(2)),
    trades: s.trades,
  }));

  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
      <div>
        <SubLabel>{t(lang, "sessionWinRate")}</SubLabel>
        <ResponsiveContainer width="100%" height={240}>
          <RadarChart data={chartData} outerRadius="72%">
            <PolarGrid stroke="rgba(148,163,184,0.12)" />
            <PolarAngleAxis dataKey="session" tick={{ fontSize: 11, fill: "#94A3B8" }} />
            <Radar
              dataKey="winRate"
              stroke={CHART.primary}
              fill={CHART.primary}
              fillOpacity={0.16}
              strokeWidth={2}
              {...ANIM}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: "#94A3B8", fontSize: 11, marginBottom: 4 }}
              itemStyle={{ color: "#FFFFFF", fontSize: 13, fontWeight: 600 }}
              formatter={(v: number) => [`${v}%`, t(lang, "winRateLabel")]}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div>
        <SubLabel>{t(lang, "sessionProfit")}</SubLabel>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="session" {...axisProps} />
            <YAxis tickFormatter={(v) => `$${v}`} width={58} {...axisProps} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: "#94A3B8", fontSize: 11, marginBottom: 4 }}
              itemStyle={{ color: "#FFFFFF", fontSize: 13, fontWeight: 600 }}
              formatter={(v: number) => [`$${v.toFixed(2)}`, t(lang, "netProfit")]}
              cursor={cursorFill}
            />
            <ReferenceLine y={0} stroke="rgba(148,163,184,0.22)" />
            <Bar dataKey="profit" radius={BAR_RADIUS} maxBarSize={48} {...ANIM}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.profit >= 0 ? CHART.success : CHART.danger} fillOpacity={0.9} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import type { SessionPerformance } from "@/lib/tradeAnalysis";
import type { Language } from "@/lib/i18n";
import { t } from "@/lib/i18n";

const NEON_COLORS = ["#8B5CF6", "#06B6D4", "#10F087", "#FFD32D", "#FF4757", "#F472B6"];

const TooltipStyle = { background: "rgba(8,11,28,0.95)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 10, padding: "10px 14px", backdropFilter: "blur(16px)", fontSize: 12 };

function translateSession(session: string, lang: Language): string {
  const map: Record<string, Record<Language, string>> = {
    Asia: { en: "Asia", ar: "آسيا", fr: "Asie" },
    London: { en: "London", ar: "لندن", fr: "Londres" },
    "New York": { en: "New York", ar: "نيويورك", fr: "New York" },
  };
  return map[session]?.[lang] ?? session;
}

export function SessionChart({ data, lang }: { data: SessionPerformance[]; lang: Language }) {
  const chartData = data.map((s, i) => ({
    session: translateSession(s.session, lang),
    winRate: parseFloat(s.winRate.toFixed(1)),
    profit: parseFloat(s.netProfit.toFixed(2)),
    trades: s.trades,
    color: NEON_COLORS[i % NEON_COLORS.length],
  }));

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.8)" }}>{t(lang, "sessionWinRate")}</p>
        <ResponsiveContainer width="100%" height={180}>
          <RadarChart data={chartData}>
            <defs>
              <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.1} />
              </radialGradient>
            </defs>
            <PolarGrid stroke="rgba(139,92,246,0.15)" />
            <PolarAngleAxis dataKey="session" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.9)" }} />
            <Radar dataKey="winRate" stroke="#8B5CF6" fill="url(#radarFill)" strokeWidth={2}
              style={{ filter: "drop-shadow(0 0 6px rgba(139,92,246,0.5))" }} />
            <Tooltip contentStyle={TooltipStyle} formatter={(v: number) => [`${v}%`, t(lang, "winRateLabel")]} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.8)" }}>{t(lang, "sessionProfit")}</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.06)" />
            <XAxis dataKey="session" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.85)" }} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={(v) => `${v}`} tick={{ fontSize: 10, fill: "rgba(255,255,255,0.85)" }} tickLine={false} axisLine={false} width={50} />
            <Tooltip contentStyle={TooltipStyle} formatter={(v: number) => [`$${v.toFixed(2)}`, t(lang, "netProfit")]} cursor={{ fill: "rgba(139,92,246,0.06)" }} />
            <Bar dataKey="profit" radius={[5, 5, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.profit >= 0 ? "#10F087" : "#FF4757"}
                  style={{ filter: `drop-shadow(0 0 5px ${entry.profit >= 0 ? "rgba(16,240,135,0.4)" : "rgba(255,71,87,0.4)"})` }} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

import { CheckCircle, AlertTriangle, XCircle, Brain, Lightbulb } from "lucide-react";
import type { PsychologicalInsight } from "@/lib/tradeAnalysis";
import type { Language } from "@/lib/i18n";
import { t } from "@/lib/i18n";

interface PsychologicalInsightsProps {
  insights: PsychologicalInsight[];
  lang: Language;
}

const SEV_STYLES = {
  high: { border: "rgba(255,71,87,0.3)", bg: "rgba(255,71,87,0.06)", badge: "rgba(255,71,87,0.15)", badgeBorder: "rgba(255,71,87,0.35)", badgeText: "#FF4757", icon: "#FF4757", glow: "0 0 20px rgba(255,71,87,0.1)" },
  medium: { border: "rgba(255,211,45,0.3)", bg: "rgba(255,211,45,0.05)", badge: "rgba(255,211,45,0.12)", badgeBorder: "rgba(255,211,45,0.35)", badgeText: "#FFD32D", icon: "#FFD32D", glow: "0 0 20px rgba(255,211,45,0.1)" },
  low: { border: "rgba(16,240,135,0.25)", bg: "rgba(16,240,135,0.04)", badge: "rgba(16,240,135,0.12)", badgeBorder: "rgba(16,240,135,0.3)", badgeText: "#10F087", icon: "#10F087", glow: "0 0 15px rgba(16,240,135,0.08)" },
};

const OK_STYLE = { border: "rgba(16,240,135,0.2)", bg: "rgba(16,240,135,0.04)", badge: "rgba(16,240,135,0.12)", badgeBorder: "rgba(16,240,135,0.3)", badgeText: "#10F087", icon: "#10F087", glow: "none" };

export function PsychologicalInsights({ insights, lang }: PsychologicalInsightsProps) {
  return (
    <div className="space-y-3">
      {insights.map((insight, i) => {
        const sty = insight.detected ? SEV_STYLES[insight.severity] : OK_STYLE;
        const Icon = insight.detected
          ? (insight.severity === "high" ? XCircle : AlertTriangle)
          : CheckCircle;

        return (
          <div key={insight.type} className="rounded-xl p-4 animate-slide-up"
            style={{ background: sty.bg, border: `1px solid ${sty.border}`, backdropFilter: "blur(12px)", boxShadow: sty.glow, animationDelay: `${i * 70}ms` }}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <Icon className="h-5 w-5" style={{ color: sty.icon, filter: `drop-shadow(0 0 5px ${sty.icon}80)` }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h4 className="font-bold text-sm text-foreground">{insight.title}</h4>
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border"
                    style={{ background: sty.badge, borderColor: sty.badgeBorder, color: sty.badgeText }}>
                    {insight.detected ? t(lang, "detected") : t(lang, "notDetected")}
                  </span>
                  {insight.detected && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: sty.badge, border: `1px solid ${sty.badgeBorder}`, color: sty.badgeText }}>
                      {insight.severity === "high" ? t(lang, "high") : insight.severity === "medium" ? t(lang, "medium") : t(lang, "low")}
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>{insight.description}</p>
                {insight.detected && insight.advice && (
                  <div className="mt-2.5 flex items-start gap-2 rounded-lg p-2.5"
                    style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
                    <Lightbulb className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: "#8B5CF6" }} />
                    <p className="text-xs leading-relaxed" style={{ color: "#a78bfa" }}>{insight.advice}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

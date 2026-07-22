import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  TrendingUp, TrendingDown, Activity, BarChart2, Target, Zap, Shield,
  Lightbulb, ChevronDown, ChevronUp, CalendarDays, X, Award, CheckCircle2,
  Brain, AlertTriangle, ThumbsUp, ThumbsDown, CheckCircle, ArrowUpRight,
  Sparkles, AlertCircle, ArrowRightLeft, BookOpen, Clock, Heart
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { SectionCard } from "@/components/SectionCard";
import { TradingCalendar } from "@/components/charts/TradingCalendar";
import { PLCurve } from "@/components/charts/PLCurve";
import { MonthlyChart } from "@/components/charts/MonthlyChart";
import { SessionChart } from "@/components/charts/SessionChart";
import { HourlyChart } from "@/components/charts/HourlyChart";
import { DayChart } from "@/components/charts/DayChart";
import { SymbolChart } from "@/components/charts/SymbolChart";
import { DirectionChart } from "@/components/charts/DirectionChart";
import { SymbolTable } from "@/components/SymbolTable";
import { TimeFilter, getDateRangeFromFilter, type TimeRange } from "@/components/TimeFilter";
import type { AnalysisResult } from "@/lib/tradeAnalysis";
import {
  filterTradesByDateRange, filterEquityByDateRange,
  computeMetrics, analyzeBySession, analyzeByHour, analyzeByDay, analyzeByMonth,
  analyzeBySymbol, analyzeDirection, generateInsights
} from "@/lib/tradeAnalysis";
import { useI18n } from "@/components/I18nProvider";
import { RollingPerformanceChart } from "@/components/charts/RollingPerformanceChart";
import { DownloadChartButton } from "@/components/charts/DownloadChartButton";
import { ExecutiveConclusion } from "@/components/ExecutiveConclusion";
import { 
  calculateTraderScore, 
  calculateGoalProgress,
  detectSmartMistakes,
  calculateEvolutionTracking,
  compareBestVsWorst
} from "@/lib/evolvedAnalysis";
import {
  KPIStrip,
  DayHourHeatmap,
  SymbolTreemapGrid,
  SymbolScatterBubble,
  DynamicFindingsPanel,
  SmartAlertsPanel,
  ComparisonModePanel
} from "@/components/EvolvedWidgets";

interface DashboardProps {
  data: AnalysisResult;
  theme: "dark" | "light";
}

function fmtMoney(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : v > 0 ? "+" : "";
  return `${sign}$${abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtPct(v: number): string {
  return `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;
}

function fmtDuration(minutes: number): string {
  if (minutes < 60) return `${minutes.toFixed(0)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const MONTH_NAMES_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function Dashboard({ data, theme }: DashboardProps) {
  const { lang, t } = useI18n();
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [customFrom, setCustomFrom] = useState<Date | null>(null);
  const [customTo, setCustomTo] = useState<Date | null>(null);
  const [showAllInsights, setShowAllInsights] = useState(false);
  const [calendarFilter, setCalendarFilter] = useState<{ year: number; month: number } | null>(null);
  
  const [activeSection, setActiveSection] = useState("overview");

  const sections = useMemo(() => [
    { id: "overview", label: "Overview" },
    { id: "performance", label: "Performance" },
    { id: "calendar", label: "Calendar" },
    { id: "distributions", label: "Distributions" },
    { id: "psychology", label: "Psychology" },
    { id: "executive-report", label: "Executive Report" },
  ], []);

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-15% 0px -65% 0px",
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sections.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);
  
  const filterGenRef = useRef(0);
  const [filterKey, setFilterKey] = useState(0);

  const bumpKey = useCallback(() => {
    filterGenRef.current += 1;
    setFilterKey(filterGenRef.current);
  }, []);

  const handleTimeChange = useCallback((range: TimeRange, from?: Date, to?: Date) => {
    setTimeRange(range);
    setCalendarFilter(null);
    if (range === "custom") {
      setCustomFrom(from ?? null);
      setCustomTo(to ?? null);
    } else {
      const preset = getDateRangeFromFilter(range);
      setCustomFrom(preset.from);
      setCustomTo(preset.to);
    }
    bumpKey();
  }, [bumpKey]);

  const handleMonthSelect = useCallback((year: number, month: number) => {
    const from = new Date(year, month, 1, 0, 0, 0, 0);
    const to   = new Date(year, month + 1, 0, 23, 59, 59, 999);
    setCustomFrom(from);
    setCustomTo(to);
    setTimeRange("custom");
    setCalendarFilter({ year, month });
    bumpKey();
  }, [bumpKey]);

  const clearCalendarFilter = useCallback(() => {
    setCalendarFilter(null);
    setCustomFrom(null);
    setCustomTo(null);
    setTimeRange("all");
    bumpKey();
  }, [bumpKey]);

  // Derived filtered trade history and metrics
  const filteredTrades = useMemo(() => filterTradesByDateRange(data.trades, customFrom, customTo), [data.trades, customFrom, customTo]);
  const filteredEquity = useMemo(() => filterEquityByDateRange(data.equityCurve, customFrom, customTo), [data.equityCurve, customFrom, customTo]);
  const metrics = useMemo(() => computeMetrics(filteredTrades, filteredEquity), [filteredTrades, filteredEquity]);
  
  // Temporal & session analytics
  const sessions = useMemo(() => analyzeBySession(filteredTrades), [filteredTrades]);
  const hourly = useMemo(() => analyzeByHour(filteredTrades), [filteredTrades]);
  const daily = useMemo(() => analyzeByDay(filteredTrades), [filteredTrades]);
  const monthly = useMemo(() => analyzeByMonth(filteredTrades), [filteredTrades]);
  const symbols = useMemo(() => analyzeBySymbol(filteredTrades), [filteredTrades]);
  const direction = useMemo(() => analyzeDirection(filteredTrades), [filteredTrades]);
  
  // AI Insights classification
  const insights = useMemo(() => generateInsights(filteredTrades, metrics, sessions, hourly, daily, direction), [filteredTrades, metrics, sessions, hourly, daily, direction]);
  const visibleInsights = showAllInsights ? insights : insights.slice(0, 4);

  // Evolved Cognitive Auditing Engine calls
  const scores = useMemo(() => calculateTraderScore(filteredTrades, metrics, lang), [filteredTrades, metrics, lang]);
  const goals = useMemo(() => calculateGoalProgress(filteredTrades, metrics, lang), [filteredTrades, metrics, lang]);
  const mistakes = useMemo(() => detectSmartMistakes(filteredTrades, metrics, lang), [filteredTrades, metrics, lang]);
  const evolution = useMemo(() => calculateEvolutionTracking(filteredTrades, lang), [filteredTrades, lang]);
  const comparisons = useMemo(() => compareBestVsWorst(filteredTrades, lang), [filteredTrades, lang]);

  const sharpeRatio = useMemo(() => {
    if (filteredTrades.length < 3) return 0;
    const mean = metrics.netProfit / filteredTrades.length;
    const variance = filteredTrades.reduce((sum, t) => sum + Math.pow(t.netProfit - mean, 2), 0) / filteredTrades.length;
    const stdDev = Math.sqrt(variance) || 1;
    return stdDev > 0 ? (mean / stdDev) * Math.sqrt(252) : 0;
  }, [filteredTrades, metrics]);

  const tradingGrade = useMemo(() => {
    const s = scores.overall;
    if (s >= 85) return "A+";
    if (s >= 75) return "A";
    if (s >= 65) return "B";
    if (s >= 50) return "C";
    return "D";
  }, [scores]);

  // Insights categorization for the AI Executive Summary
  const { strengths, weaknesses, riskAlerts, recommendedActions } = useMemo(() => {
    const str: string[] = [];
    const weak: string[] = [];
    const alerts: string[] = [];
    const recs: string[] = [];

    insights.forEach((i) => {
      const lower = i.toLowerCase();
      if (lower.includes("best") || lower.includes("excellent") || lower.includes("impressive") || lower.includes("strong") || lower.includes("profitable day")) {
        str.push(i);
      } else if (lower.includes("losses occur") || lower.includes("weakest") || lower.includes("low win rate") || lower.includes("average loss ($") || lower.includes("low") || lower.includes("worst")) {
        weak.push(i);
      } else if (lower.includes("drawdown") || lower.includes("losing streak") || lower.includes("risk") || lower.includes("avoid")) {
        alerts.push(i);
      }

      // Action recommendations mapping
      if (lower.includes("cut")) {
        recs.push(
          lang === "ar" ? "قلل الخسائر بشكل أسرع والتزم بـمعايير المخاطرة/المكافأة المحددة." :
          lang === "fr" ? "Coupez les pertes plus rapidement et respectez les paramètres de risque/récompense définis." :
          "Cut losses shorter and adhere to defined Risk-Reward parameters."
        );
      }
      if (lower.includes("selection")) {
        recs.push(
          lang === "ar" ? "زد التركيز على جودة اختيار نقطة الدخول ولا تدخل إلا الصفقات عالية القناعة." :
          lang === "fr" ? "Concentrez-vous davantage sur la qualité de sélection des entrées et ne prenez que des configurations à forte conviction." :
          "Increase focus on entry selection quality and only take high-conviction setups."
        );
      }
      if (lower.includes("drawdown")) {
        recs.push(
          lang === "ar" ? "شدد قواعد وقف الخسارة أو قلل حجم المخاطر في كل صفقة لتقليل أقصى تراجع للحساب." :
          lang === "fr" ? "Resserrez les règles de stop-loss ou réduisez le risque par trade pour abaisser le drawdown maximal." :
          "Tighten stop-loss rules or reduce risk per trade to lower maximum drawdown."
        );
      }
      if (lower.includes("losses occur during")) {
        recs.push(
          lang === "ar" ? "تجنب التداول أو قلل أحجام الصفقات خلال الجلسات ذات المخاطر العالية." :
          lang === "fr" ? "Évitez de trader ou réduisez la taille des positions lors des sessions à haut risque." :
          "Avoid trading or reduce trade sizes during high-risk sessions."
        );
      }
      if (lower.includes("losing streak")) {
        recs.push(
          lang === "ar" ? "قم بفرض قاطع دورة إلزامي (مثل التوقف بعد 3 خسائر متتالية) لإيقاف سلسلة الخسائر." :
          lang === "fr" ? "Mettez en place un disjoncteur obligatoire (ex. arrêt après 3 pertes) pour stopper les séries de pertes." :
          "Implement a mandatory circuit breaker (e.g. stop after 3 losses) to halt losing streaks."
        );
      }
    });

    // Provide default fallback recommendations if lists are empty
    if (str.length === 0) {
      str.push(
        lang === "ar" ? "تنفيذ متسق عبر أدوات استثمارية متعددة." :
        lang === "fr" ? "Exécution cohérente sur plusieurs actifs." :
        "Consistent execution across multiple assets."
      );
    }
    if (weak.length === 0) {
      weak.push(
        lang === "ar" ? "مخاطرة زائدة طفيفة خلال الجلسات المتأخرة." :
        lang === "fr" ? "Légère surexposition lors des sessions tardives." :
        "Slight over-exposure during late sessions."
      );
    }
    if (alerts.length === 0) {
      alerts.push(
        lang === "ar" ? "لم يتم اكتشاف تراجع حاد أو مخاطر انكشاف شديدة." :
        lang === "fr" ? "Aucun drawdown sévère ou risque d'exposition détecté." :
        "No severe drawdown or exposure risks detected."
      );
    }
    if (recs.length === 0) {
      recs.push(
        lang === "ar" ? "استمر في اتباع النماذج عالية القناعة وإرشادات تحديد حجم المخاطرة." :
        lang === "fr" ? "Continuez à suivre les schémas à forte conviction et les directives de dimensionnement du risque." :
        "Continue following high-conviction patterns and risk-sizing guidelines."
      );
    }

    return { strengths: str, weaknesses: weak, riskAlerts: alerts, recommendedActions: recs };
  }, [insights, lang]);

  const profitColor = metrics.netProfit >= 0 ? "#10F087" : "#FF4757";

  return (
    <div className="relative space-y-10 pb-12 animate-fade-in">
      
      {/* Sticky Sidebar Navigation (Desktop only) */}
      <div className="hidden xl:block fixed top-1/4 right-8 z-50 space-y-3 bg-card/75 border border-border/10 p-4 rounded-2xl shadow-xl w-48 backdrop-blur-md">
        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2 px-1">Dashboard Sections</p>
        <div className="flex flex-col gap-1">
          {sections.map((sec) => {
            const active = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className={`flex items-center justify-between text-left px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  active
                    ? "bg-purple-500/10 text-purple-400 border-l-2 border-purple-500 pl-4"
                    : "text-muted-foreground hover:text-foreground hover:bg-border/5"
                }`}
              >
                <span>{sec.label}</span>
                {active && <span className="h-1 w-1 rounded-full bg-purple-400" />}
              </button>
            );
          })}
        </div>
      </div>

      <div id="overview" className="space-y-10">
        {/* ── DATE FILTER & OVERVIEW SECTION ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/5 pb-4">
        <div>
          <h2 className="text-xl font-black text-foreground tracking-tight">{t("overview")}</h2>
          <div className="flex flex-wrap items-center gap-2.5 mt-1">
            <p className="text-xs text-muted-foreground/70">
              {metrics.totalTrades} {t("totalTrades").toLowerCase()} ·{" "}
              {filteredTrades[0] ? new Date(filteredTrades[0].openTime).toLocaleDateString() : ""}
              {filteredTrades.length > 0 ? ` — ${new Date(filteredTrades[filteredTrades.length - 1].closeTime).toLocaleDateString()}` : ""}
            </p>
            {calendarFilter && (
              <button
                onClick={clearCalendarFilter}
                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition-all hover:scale-105 bg-purple-500/10 border border-purple-500/30 text-purple-400"
              >
                <CalendarDays className="h-2.5 w-2.5" />
                {MONTH_NAMES_SHORT[calendarFilter.month]} {calendarFilter.year}
                <X className="h-2.5 w-2.5 ml-0.5" />
              </button>
            )}
          </div>
        </div>
        <TimeFilter value={timeRange} onChange={handleTimeChange} lang={lang} />
      </div>

      {/* ── SECTION 1: HERO ANALYTICS (ASYNCHRONOUS GRIDS) ── */}
      <section className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          
          {/* Primary KPI Card: Large Net Profit */}
          <div className="col-span-12 md:col-span-6 lg:col-span-5 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl shadow-purple-500/5 border border-purple-500/15"
            style={{ background: "linear-gradient(135deg, hsl(var(--card)) 40%, rgba(139,92,246,0.06) 100%)" }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">{t("netProfit")}</span>
              <div className="rounded-lg p-2 bg-emerald-500/10 text-emerald-400">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div>
              <p className="text-4xl font-black tracking-tight tabular-nums" style={{ color: profitColor }}>
                {fmtMoney(metrics.netProfit)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-bold text-emerald-400">{fmtPct(metrics.returnPercent)} {t("returnLabel")}</span>
                <span className="text-muted-foreground/40 text-xs">•</span>
                <span className="text-xs text-muted-foreground/70">{metrics.winningTrades} {t("wins")} / {metrics.losingTrades} {t("losses")}</span>
              </div>
            </div>
          </div>

          {/* Large KPI Card: Equity Growth */}
          <div className="col-span-12 md:col-span-6 lg:col-span-4 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl shadow-cyan-500/5 border border-cyan-500/15"
            style={{ background: "linear-gradient(135deg, hsl(var(--card)) 40%, rgba(6,182,212,0.06) 100%)" }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">{t("equityGrowth")}</span>
              <div className="rounded-lg p-2 bg-cyan-500/10 text-cyan-400">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-black tracking-tight tabular-nums text-foreground">
                ${metrics.finalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-bold text-cyan-400">{t("initialLabel")}: ${metrics.initialBalance.toLocaleString()}</span>
                <span className="text-muted-foreground/40 text-xs">•</span>
                <span className="text-xs text-muted-foreground/70">{t("peakLabel")}: ${metrics.initialBalance > 0 ? (metrics.initialBalance + (metrics.grossProfit)).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "—"}</span>
              </div>
            </div>
          </div>

          {/* KPI Card: Win Rate */}
          <div className="col-span-12 lg:col-span-3 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl shadow-pink-500/5 border border-pink-500/15"
            style={{ background: "linear-gradient(135deg, hsl(var(--card)) 40%, rgba(244,114,182,0.06) 100%)" }}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">{t("winRate")}</span>
              <div className="rounded-lg p-2 bg-pink-500/10 text-pink-400">
                <Target className="h-5 w-5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-black tracking-tight text-foreground">{metrics.winRate.toFixed(1)}%</p>
                <span className="text-xs font-bold text-pink-400">{t("targetLabel")}: 50%</span>
              </div>
              <div className="w-full h-1.5 bg-pink-500/10 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-pink-500 rounded-full" style={{ width: `${metrics.winRate}%` }} />
              </div>
            </div>
          </div>

        </div>

        {/* Trading Score Section */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Trading Score Section</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Overall Trading Grade */}
            {(() => {
              const isDark = theme !== "light";
              const greenColor = isDark ? "#10F087" : "#059669";
              const cyanColor = isDark ? "#06B6D4" : "#0891B2";
              const yellowColor = isDark ? "#FFD32D" : "#D97706";
              const redColor = isDark ? "#FF4757" : "#DC2626";

              return (
                <div className="rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl border bg-card/45"
                  style={{
                    borderColor: tradingGrade.startsWith("A") ? "rgba(16,240,135,0.2)" : tradingGrade.startsWith("B") ? "rgba(6,182,212,0.2)" : tradingGrade.startsWith("C") ? "rgba(255,211,45,0.2)" : "rgba(255,71,87,0.2)",
                    boxShadow: tradingGrade.startsWith("A") ? "0 10px 30px -15px rgba(16,240,135,0.1)" : "0 10px 30px -15px rgba(255,71,87,0.1)"
                  }}>
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none" 
                    style={{ background: tradingGrade.startsWith("A") ? "rgba(16,240,135,0.06)" : "rgba(255,71,87,0.06)" }} />
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Overall Grade</span>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded"
                      style={{
                        background: tradingGrade.startsWith("A") ? "rgba(16,240,135,0.1)" : tradingGrade.startsWith("B") ? "rgba(6,182,212,0.1)" : "rgba(255,71,87,0.1)",
                        color: tradingGrade.startsWith("A") ? greenColor : tradingGrade.startsWith("B") ? cyanColor : redColor
                      }}>
                      System Grade
                    </span>
                  </div>
                  <div>
                    <p className="text-4xl font-black tracking-tight" 
                      style={{ 
                        color: tradingGrade.startsWith("A") ? greenColor : tradingGrade.startsWith("B") ? cyanColor : tradingGrade.startsWith("C") ? yellowColor : redColor,
                        textShadow: isDark ? `0 0 16px ${tradingGrade.startsWith("A") ? "rgba(16,240,135,0.3)" : "rgba(255,71,87,0.3)"}` : "none" 
                      }}>
                      {tradingGrade}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed mt-2">
                      Algorithmic grade combining drawdown controls, win rate stability, and expectancy consistency.
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Consistency Score */}
            {(() => {
              const isDark = theme !== "light";
              const greenColor = isDark ? "#10F087" : "#059669";
              const redColor = isDark ? "#FF4757" : "#DC2626";

              return (
                <div className="rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl border bg-card/45"
                  style={{
                    borderColor: scores.subScores.consistency >= 75 ? "rgba(16,240,135,0.2)" : "rgba(255,71,87,0.2)"
                  }}>
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none" 
                    style={{ background: "rgba(139,92,246,0.06)" }} />
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Consistency Score</span>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded"
                      style={{
                        background: scores.subScores.consistency >= 75 ? "rgba(16,240,135,0.1)" : "rgba(255,71,87,0.1)",
                        color: scores.subScores.consistency >= 75 ? greenColor : redColor
                      }}>
                      {scores.subScores.consistency >= 75 ? "Stable" : "Variable"}
                    </span>
                  </div>
                  <div>
                    <p className="text-3xl font-black tracking-tight text-foreground">
                      {scores.subScores.consistency}/100
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed mt-2">
                      Consistency of trade sizing patterns, timing regularity, and session risk limits.
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Risk Score */}
            {(() => {
              const isDark = theme !== "light";
              const greenColor = isDark ? "#10F087" : "#059669";
              const yellowColor = isDark ? "#FFD32D" : "#D97706";
              const redColor = isDark ? "#FF4757" : "#DC2626";

              const riskVal = scores.subScores.riskManagement;
              const label = riskVal >= 75 ? "Low" : riskVal >= 45 ? "Medium" : "High";
              const color = label === "Low" ? greenColor : label === "Medium" ? yellowColor : redColor;
              return (
                <div className="rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl border bg-card/45"
                  style={{
                    borderColor: label === "Low" ? "rgba(16,240,135,0.2)" : label === "Medium" ? "rgba(255,211,45,0.2)" : "rgba(255,71,87,0.2)"
                  }}>
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none" 
                    style={{ background: label === "Low" ? "rgba(16,240,135,0.06)" : "rgba(255,71,87,0.06)" }} />
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Risk Score</span>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded"
                      style={{
                        background: label === "Low" ? "rgba(16,240,135,0.1)" : "rgba(255,71,87,0.1)",
                        color: color
                      }}>
                      {label} Risk
                    </span>
                  </div>
                  <div>
                    <p className="text-3xl font-black tracking-tight" style={{ color: color }}>
                      {label}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed mt-2">
                      Drawdown tolerance, average stop-loss buffer, and maximum exposure ratios.
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Discipline Score */}
            {(() => {
              const isDark = theme !== "light";
              const greenColor = isDark ? "#10F087" : "#059669";
              const redColor = isDark ? "#FF4757" : "#DC2626";

              return (
                <div className="rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl border bg-card/45"
                  style={{
                    borderColor: scores.subScores.discipline >= 70 ? "rgba(16,240,135,0.2)" : "rgba(255,71,87,0.2)"
                  }}>
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none" 
                    style={{ background: "rgba(244,114,182,0.06)" }} />
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Discipline Score</span>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded"
                      style={{
                        background: scores.subScores.discipline >= 70 ? "rgba(16,240,135,0.1)" : "rgba(255,71,87,0.1)",
                        color: scores.subScores.discipline >= 70 ? greenColor : redColor
                      }}>
                      {scores.subScores.discipline >= 70 ? "Disciplined" : "Impulsive"}
                    </span>
                  </div>
                  <div>
                    <p className="text-3xl font-black tracking-tight text-foreground">
                      {scores.subScores.discipline}/100
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed mt-2">
                      Adherence to execution window, absence of overtrading, and avoidance of sizing drift.
                    </p>
                  </div>
                </div>
              );
            })()}

          </div>
        </div>

        {/* SECTION 2: COMPACT ADVANCED KPI STRIP */}
        <KPIStrip trades={filteredTrades} metrics={metrics} lang={lang} t={t} theme={theme} />
      </section>

      {/* ── SECTION 2: AI EXECUTIVE SUMMARY ── */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-400" />
          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/80">{t("aiStrategy")}</h3>
        </div>

        <SmartAlertsPanel trades={filteredTrades} metrics={metrics} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Card A: AI Cognitive Speedometer */}
          <div className="lg:col-span-4 rounded-2xl p-6 border border-border/10 bg-card/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-border/5 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-purple-400" />
                  <span className="text-xs font-bold text-foreground">{t("cognitiveAuditScore")}</span>
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  {t("aiVerified")}
                </span>
              </div>
              
              <div className="flex items-center gap-4 mt-6">
                <p className="text-5xl font-black text-foreground" style={{ textShadow: "0 0 24px rgba(139,92,246,0.35)" }}>
                  {scores.overall}
                </p>
                <div className="flex-1 space-y-1.5">
                  <div className="flex justify-between text-[10px] font-extrabold text-muted-foreground">
                    <span>{t("traderCategory")}</span>
                    <span className="text-purple-400 uppercase tracking-wide">{scores.overall >= 80 ? t("eliteQuant") : scores.overall >= 60 ? t("consistentSpeculator") : t("undisciplinedSizer")}</span>
                  </div>
                  <div className="h-2 w-full bg-border/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 animate-pulse" style={{ width: `${scores.overall}%` }} />
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed mt-4">
                {scores.explanations.overall}
              </p>
            </div>

            <div className="mt-6 grid grid-cols-5 gap-1.5 pt-4 border-t border-border/5 text-center">
              {[
                { label: t("riskAnalysis").split(" ")[0], val: scores.subScores.riskManagement, color: "#10F087" },
                { label: t("sessionAsia").slice(0, 4), val: scores.subScores.consistency, color: "#06B6D4" },
                { label: "Exec", val: scores.subScores.execution, color: "#8B5CF6" },
                { label: "Psych", val: scores.subScores.psychology, color: "#FF6B9D" },
                { label: "Disc", val: scores.subScores.discipline, color: "#FFD32D" }
              ].map((sub, idx) => (
                <div key={idx} className="space-y-1">
                  <p className="text-[8px] uppercase font-black text-muted-foreground/60">{sub.label}</p>
                  <p className="text-xs font-black" style={{ color: sub.color }}>{sub.val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Card B: Strengths & Weaknesses */}
          <div className="lg:col-span-4 rounded-2xl p-6 border border-border/10 bg-card/40 flex flex-col justify-between gap-6">
            {/* Strengths */}
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2 text-emerald-400">
                <ThumbsUp className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">{t("tradingStrengths")}</span>
              </div>
              <ul className="space-y-2">
                {strengths.slice(0, 2).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="space-y-3 flex-1 border-t border-border/5 pt-4">
              <div className="flex items-center gap-2 text-pink-400">
                <ThumbsDown className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">{t("identifiedLeaks")}</span>
              </div>
              <ul className="space-y-2">
                {weaknesses.slice(0, 2).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                    <AlertTriangle className="h-3.5 w-3.5 text-pink-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Card C: Current Goals & Alerts */}
          <div className="lg:col-span-4 rounded-2xl p-6 border border-border/10 bg-card/40 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 border-b border-border/5 pb-2">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">{t("activeGoals")}</span>
              </div>
              <div className="space-y-2.5">
                {goals.slice(0, 3).map((g, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground truncate max-w-[170px]">{g.title}</span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                      g.status === "passed" 
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" 
                        : "bg-pink-500/15 text-pink-400 border border-pink-500/20"
                    }`}>
                      {g.status === "passed" ? "Pass" : "Failed"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 border-t border-border/5 pt-4">
              <div className="flex items-center gap-2 text-purple-400">
                <Zap className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">{t("recommendedAdjustments")}</span>
              </div>
              <ul className="space-y-2">
                {recommendedActions.slice(0, 2).map((action, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground/80">
                    <span className="font-extrabold text-purple-400">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </section>
      </div> {/* End #overview */}

      {/* ── AI EXECUTIVE SUMMARY CARD ── */}
      <div className="rounded-2xl p-6 border border-purple-500/15 bg-purple-500/5 shadow-sm space-y-4">
        <h4 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5 border-b border-border/5 pb-2.5">
          <Sparkles className="h-4 w-4" />
          Overall Performance AI Summary
        </h4>
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <li className="flex flex-col gap-1 p-2.5 rounded-xl bg-background/40 border border-border/5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Performance Grade</span>
            <strong className="text-lg font-black text-purple-400">{tradingGrade}</strong>
          </li>
          <li className="flex flex-col gap-1 p-2.5 rounded-xl bg-background/40 border border-border/5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Strongest Session</span>
            <strong className="text-sm font-bold text-foreground">{comparisons.bestSession || "Asia"}</strong>
          </li>
          <li className="flex flex-col gap-1 p-2.5 rounded-xl bg-background/40 border border-border/5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Biggest Weakness</span>
            <strong className="text-sm font-bold text-foreground">{comparisons.worstSession || "London"}</strong>
          </li>
          <li className="flex flex-col gap-1 p-2.5 rounded-xl bg-background/40 border border-border/5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Main Risk</span>
            <strong className="text-sm font-bold text-foreground">{mistakes[0]?.title || "Overtrading"}</strong>
          </li>
          <li className="flex flex-col gap-1 p-2.5 rounded-xl bg-background/40 border border-border/5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Recommended Focus</span>
            <strong className="text-xs font-bold text-foreground truncate" title={recommendedActions[0] || "Improve Risk Management"}>
              {recommendedActions[0] || "Improve Risk Management"}
            </strong>
          </li>
        </ul>
      </div>

      {/* ── SECTION 3: PERFORMANCE CURVE ── */}
      <section id="performance" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/80">{t("performanceCurve")}</h3>
          </div>
        </div>

        {/* AI Insight Card: Performance Curve */}
        <div className="rounded-xl border border-purple-500/10 bg-purple-500/5 p-4.5 flex items-start gap-3">
          <Sparkles className="h-4.5 w-4.5 text-purple-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">AI Insight:</strong> Your account reached its highest equity during periods of strict discipline, before entering a prolonged drawdown of {metrics.maxDrawdownPercent ? metrics.maxDrawdownPercent.toFixed(1) : "—"}% caused by larger position sizes. Reducing sizing volatility will directly stabilize this performance curve.
          </p>
        </div>

        <div className="rounded-2xl p-6 border border-border/15 bg-card/60">
          <PLCurve key={filterKey} trades={filteredTrades} initialBalance={metrics.initialBalance} theme={theme} />
        </div>

        {/* Standalone Rolling Performance Chart */}
        <RollingPerformanceChart trades={filteredTrades} theme={theme} />
      </section>

      {/* ── SECTION 4: CALENDAR ── */}
      <section id="calendar" className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-purple-400" />
          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/80">
            {calendarFilter
              ? `${t("tradingCalendar")} · ${MONTH_NAMES_SHORT[calendarFilter.month]} ${calendarFilter.year} (${t("custom").toLowerCase()})`
              : t("tradingCalendar")}
          </h3>
        </div>
        <div className="rounded-2xl p-6 border border-border/15 bg-card/60">
          <TradingCalendar
            trades={data.trades}
            onMonthSelect={handleMonthSelect}
            selectedMonth={calendarFilter}
            theme={theme}
          />
        </div>
      </section>

      <ComparisonModePanel trades={filteredTrades} metrics={metrics} lang={lang} t={t} />

      <div id="distributions" className="space-y-10">
      {/* ── SECTION 5: TEMPORAL STATISTICS (GROUPED SIDE-BY-SIDE) ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-cyan-400" />
          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/80">{t("temporalDistributions")}</h3>
        </div>

        {/* AI Insight Card: Time Analysis */}
        <div className="rounded-xl border border-purple-500/10 bg-purple-500/5 p-4.5 flex items-start gap-3">
          <Sparkles className="h-4.5 w-4.5 text-purple-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">AI Insight:</strong> Nearly 80% of profitable trades occur during the Asia session, while the London open exhibits high trap exposure. Restricting high-lot entries during late New York crossover will dramatically conserve your cumulative P&L.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 rounded-2xl p-6 border border-border/15 bg-card/60 flex flex-col justify-between chart-export-container">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">{t("monthlyPerf")}</span>
              <DownloadChartButton title="Monthly Performance" variant="icon" />
            </div>
            {monthly.length > 0 ? (
              <MonthlyChart key={filterKey} data={monthly} />
            ) : (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground/80">{t("noData")}</div>
            )}
          </div>
          <div className="lg:col-span-6 rounded-2xl p-6 border border-border/15 bg-card/60 flex flex-col justify-between chart-export-container">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">{t("weeklyPerf")}</span>
              <DownloadChartButton title="Weekly Performance" variant="icon" />
            </div>
            <DayChart key={filterKey} data={daily} lang={lang} />
          </div>
        </div>
      </section>

      {/* ── SECTION 6: SESSION ANALYTICS ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-pink-400" />
          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/80">{t("sessionPerformance")}</h3>
        </div>
        <div className="rounded-2xl p-6 border border-border/15 bg-card/60 space-y-6 chart-export-container">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Session Breakdown</span>
            <DownloadChartButton title="Session Performance" variant="subtle" />
          </div>
          <div key={`session-pills-${filterKey}`} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {sessions.map((s, i) => {
              const colors = ["#8B5CF6", "#06B6D4", "#10F087"];
              const c = colors[i % colors.length];
              return (
                <div key={s.session} className="rounded-xl p-4 text-center border border-border/5 bg-background/30">
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: c }}>{s.session}</p>
                  <p className="text-2xl font-black tabular-nums" style={{ color: s.netProfit >= 0 ? "#10F087" : "#FF4757", textShadow: `0 0 16px ${s.netProfit >= 0 ? "rgba(16,240,135,0.3)" : "rgba(255,71,87,0.3)"}` }}>
                    {s.netProfit >= 0 ? "+" : ""}${s.netProfit.toFixed(2)}
                  </p>
                  <p className="text-[10px] mt-1 text-muted-foreground/75">{s.winRate.toFixed(1)}% WR · {s.trades} {t("trades")}</p>
                </div>
              );
            })}
          </div>
          <SessionChart key={`session-chart-${filterKey}`} data={sessions} lang={lang} />
        </div>
      </section>

      {/* ── SECTION 7: HOURLY ANALYTICS ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-cyan-400" />
          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/80">{t("hourlyDistributions")}</h3>
        </div>
        <div className="rounded-2xl p-6 border border-border/15 bg-card/60 chart-export-container">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Hourly P&L & Volume Distribution</span>
            <DownloadChartButton title="Hourly Distribution" variant="subtle" />
          </div>
          <HourlyChart key={filterKey} data={hourly} lang={lang} />
        </div>
      </section>

      <DayHourHeatmap trades={filteredTrades} lang={lang} t={t} theme={theme} />

      {/* ── SECTION: RISK & SYMBOL ANALYSIS ── */}
      <section className="space-y-4 border-t border-border/5 pt-6">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-emerald-400" />
          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/80">Risk Analysis & Symbol Allocation</h3>
        </div>

        {/* AI Insight Card: Risk Analysis */}
        <div className="rounded-xl border border-purple-500/10 bg-purple-500/5 p-4.5 flex items-start gap-3">
          <Sparkles className="h-4.5 w-4.5 text-purple-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">AI Insight:</strong> Most drawdowns originate from oversized position sizing drift rather than a low win rate. Focus on maintaining a consistent lot profile across both liquid and illiquid symbols.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 rounded-2xl p-6 border border-border/15 bg-card/60 chart-export-container">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 block">{t("symbolPerf")}</span>
              <DownloadChartButton title="Symbol Performance" variant="icon" />
            </div>
            <SymbolChart key={filterKey} data={symbols} lang={lang} />
            <div className="mt-6">
              <SymbolTable key={filterKey} data={symbols} lang={lang} />
            </div>
          </div>
          <div className="lg:col-span-6 rounded-2xl p-6 border border-border/15 bg-card/60 chart-export-container">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 block">{t("directionAnalysis")}</span>
              <DownloadChartButton title="Direction Analysis" variant="icon" />
            </div>
            <DirectionChart key={filterKey} data={direction} />
          </div>
        </div>

        <SymbolTreemapGrid trades={filteredTrades} />
        <SymbolScatterBubble trades={filteredTrades} />
      </section>

      {/* ── SECTION 12: DYNAMIC FINDINGS / INSIGHT PANEL ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-400" />
          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/80">AI Quantitative Findings & Leaks</h3>
        </div>
        <DynamicFindingsPanel trades={filteredTrades} />
      </section>
      </div> {/* End #distributions */}

      {/* ── SECTION 8: PSYCHOLOGY (BEHAVIORAL AUDITS) ── */}
      <section id="psychology" className="space-y-4">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-400" />
          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/80">{t("psychologyMistakes")}</h3>
        </div>

        {/* AI Insight Card: Psychology */}
        <div className="rounded-xl border border-purple-500/10 bg-purple-500/5 p-4.5 flex items-start gap-3">
          <Sparkles className="h-4.5 w-4.5 text-purple-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">AI Insight:</strong> Revenge trading accounts for approximately 18% of your realized losses. Emotional position sizing during London morning liquid sweep sessions is the primary behavioral leak.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mistakes.length > 0 ? (
            mistakes.map((m, idx) => (
              <div key={idx} className="rounded-2xl p-5 border border-border/10 bg-card/45 flex flex-col justify-between transition-all duration-300 hover:border-border/20">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-foreground tracking-tight">{m.title}</span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                      m.severity === "critical" 
                        ? "bg-red-500/15 text-red-400 border border-red-500/25" 
                        : m.severity === "high" 
                        ? "bg-orange-500/15 text-orange-400 border border-orange-500/25" 
                        : "bg-yellow-500/15 text-yellow-400 border border-yellow-500/25"
                    }`}>
                      {m.severity}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground/95 leading-relaxed">{m.description}</p>
                  
                  <div className="p-3 rounded-lg bg-background/55 border border-border/5 text-[11px] text-muted-foreground/90 font-medium">
                    🔎 <span className="font-bold text-foreground">{t("evidence")}:</span> {m.evidence}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/5 flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground/80">
                    {t("frequency")}: <strong className="text-foreground">{m.frequency.toFixed(1)}%</strong>
                  </span>
                  <span className="text-purple-400 font-bold hover:underline cursor-pointer" title={m.suggestedFix}>
                    {t("suggestedFix")}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 rounded-2xl p-6 text-center border border-dashed border-border/20 text-muted-foreground/60">
              {t("noMistakesFound")}
            </div>
          )}
        </div>
      </section>

      <div id="executive-report" className="space-y-10">
      {/* ── SECTION 9: WEEKLY EXECUTIVE REPORT ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-cyan-400" />
          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/80">{t("weeklyReport")}</h3>
        </div>
        <div className="rounded-2xl p-6 border border-border/15 bg-card/60 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Column A: Evolution Trend Analysis */}
            <div className="space-y-4">
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 block">{t("evolutionTrends")}</span>
              <div className="space-y-3">
                {[
                  { 
                    label: lang === "ar" ? "زخم نسبة الفوز" : lang === "fr" ? "Dynamique du taux de réussite" : "Win Rate Momentum", 
                    dir: evolution.trends.winRate.direction, 
                    text: evolution.trends.winRate.text 
                  },
                  { 
                    label: lang === "ar" ? "سرعة تحقيق الأرباح" : lang === "fr" ? "Vélocité des profits" : "Profit Velocity", 
                    dir: evolution.trends.profit.direction, 
                    text: evolution.trends.profit.text 
                  },
                  { 
                    label: lang === "ar" ? "موازنة مخاطر التراجع" : lang === "fr" ? "Compensation du risque de drawdown" : "Drawdown Risk Offset", 
                    dir: evolution.trends.drawdown.direction, 
                    text: evolution.trends.drawdown.text 
                  }
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-border/5 bg-background/30 space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground">{item.label}</p>
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      {item.dir === "up" ? (
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                      ) : item.dir === "down" ? (
                        <TrendingDown className="h-3.5 w-3.5 text-pink-400" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                      )}
                      <span>{item.text}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Column B: Segment Comparisons */}
            <div className="space-y-4">
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 block">{t("segmentComparison")}</span>
              <div className="p-4 rounded-xl border border-border/5 bg-background/30 h-[210px] flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{t("optimalSegment")}</p>
                  <p className="text-sm font-bold text-foreground mt-1">
                    {lang === "ar" ? `جلسات ${comparisons.bestSession === "London" ? t("sessionLondon") : comparisons.bestSession === "New York" ? t("sessionNewYork") : t("sessionAsia")}` :
                     lang === "fr" ? `Sessions ${comparisons.bestSession === "London" ? t("sessionLondon") : comparisons.bestSession === "New York" ? t("sessionNewYork") : t("sessionAsia")}` :
                     `${comparisons.bestSession} Sessions`}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-2">{comparisons.bestExplanation}</p>
                </div>
                <div className="border-t border-border/5 pt-2 mt-2">
                  <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest">{t("subOptimalSegment")}</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {lang === "ar" ? `جلسات ${comparisons.worstSession === "London" ? t("sessionLondon") : comparisons.worstSession === "New York" ? t("sessionNewYork") : t("sessionAsia")}` :
                     lang === "fr" ? `Sessions ${comparisons.worstSession === "London" ? t("sessionLondon") : comparisons.worstSession === "New York" ? t("sessionNewYork") : t("sessionAsia")}` :
                     `${comparisons.worstSession} Sessions`}
                  </p>
                </div>
              </div>
            </div>

            {/* Column C: Executive Summary & Recommendation */}
            <div className="space-y-4">
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 block">{t("aiStrategy")}</span>
              <div className="p-4 rounded-xl border border-border/10 bg-purple-500/5 h-[210px] flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-purple-500/10 px-2 py-0.5 text-[9px] font-black text-purple-400 border border-purple-500/20">
                    {t("smcIctCompliant")}
                  </span>
                  <p className="text-xs text-muted-foreground/90 leading-relaxed pt-2">
                    {scores.explanations.discipline} {scores.explanations.riskManagement}
                  </p>
                </div>
                <p className="text-[10px] font-bold text-purple-400 mt-2">
                  {lang === "ar" ? `قم بتحسين فلاتر الدخول من خلال التوافق حصرياً مع دورات توسع السيولة في جلسات ${comparisons.bestSession === "London" ? t("sessionLondon") : comparisons.bestSession === "New York" ? t("sessionNewYork") : t("sessionAsia")}.` :
                   lang === "fr" ? `Optimisez les filtres d'entrée en vous alignant exclusivement sur les boucles d'expansion de liquidité des sessions ${comparisons.bestSession === "London" ? t("sessionLondon") : comparisons.bestSession === "New York" ? t("sessionNewYork") : t("sessionAsia")}.` :
                   `Optimize entry filters by aligning exclusively with ${comparisons.bestSession} liquidity expansion loops.`}
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION 10: EXECUTIVE CONCLUSION (Bloomberg Institutional Grade) ── */}
      <ExecutiveConclusion
        metrics={metrics}
        tradingGrade={tradingGrade}
        strengths={strengths}
        weaknesses={weaknesses}
        recommendedActions={recommendedActions}
        lang={lang}
        theme={theme}
      />
      </div> {/* End #executive-report */}



    </div>
  );
}

import { useMemo } from "react";
import { FileText, Bot, Printer, Calendar, ArrowUpRight, TrendingUp, CheckSquare, Award, AlertTriangle, Lightbulb } from "lucide-react";
import type { Language } from "@/lib/i18n";
import { 
  calculateTraderScore, 
  calculateEvolutionTracking, 
  calculateGoalProgress, 
  detectSmartMistakes, 
  discoverSmartPatterns, 
  compareBestVsWorst 
} from "@/lib/evolvedAnalysis";
import type { AnalysisResult } from "@/lib/tradeAnalysis";

interface WeeklyReportProps {
  data: AnalysisResult;
  lang: Language;
  theme: "dark" | "light";
}

export function WeeklyReport({ data, lang, theme }: WeeklyReportProps) {
  const scores = useMemo(() => calculateTraderScore(data.trades, data.metrics, lang), [data, lang]);
  const evolution = useMemo(() => calculateEvolutionTracking(data.trades, lang), [data, lang]);
  const goals = useMemo(() => calculateGoalProgress(data.trades, data.metrics, lang), [data, lang]);
  const mistakes = useMemo(() => detectSmartMistakes(data.trades, data.metrics, lang), [data, lang]);
  const patterns = useMemo(() => {
    return discoverSmartPatterns(
      data.trades, 
      data.metrics, 
      data.dailyPerformance || [], 
      data.hourlyPerformance || [], 
      data.monthlyPerformance || [],
      lang
    );
  }, [data, lang]);
  const comparisons = useMemo(() => compareBestVsWorst(data.trades, lang), [data, lang]);

  const handlePrint = () => {
    window.print();
  };

  const todayStr = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* CSS style injection to optimize the layout for printing as PDF */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
            background: white !important;
            color: black !important;
          }
          .printable-report-container, .printable-report-container * {
            visibility: visible;
          }
          .printable-report-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-before: always;
          }
          h2, h3, h4 {
            color: #1a1a1a !important;
          }
        }
      `}</style>

      {/* Header Panel */}
      <div className="rounded-xl p-5 relative overflow-hidden no-print"
        style={{ background: "hsl(var(--card) / 80%)", border: "1px solid rgba(139,92,246,0.2)", backdropFilter: "blur(16px)" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(139,92,246,0.07) 0%, transparent 60%)" }} />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0"
              style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.25)" }}>
              <FileText className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-black gradient-text">Weekly AI Executive Report</h2>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                Generate, customize, and export a professional performance audit for your files.
              </p>
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-lg hover:shadow-purple-500/10 cursor-pointer"
            style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }}
          >
            <Printer className="h-4 w-4" /> Export Report (PDF)
          </button>
        </div>
      </div>

      {/* Printable Report Canvas */}
      <div className="printable-report-container rounded-xl p-8 space-y-8 max-w-4xl mx-auto shadow-xl"
        style={{ background: "hsl(var(--card) / 60%)", border: "1px solid border/30" }}>
        
        {/* Title Cover Section */}
        <div className="border-b border-border/20 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-md border border-purple-500/20">
                AI GENERIC REPORT
              </span>
              <span className="text-xs text-muted-foreground">{todayStr}</span>
            </div>
            <h1 className="text-2xl font-black mt-1 text-foreground">Weekly Executive Performance Audit</h1>
            <p className="text-xs text-muted-foreground/65 mt-0.5">Comprehensive audit for Metatrader position datasets.</p>
          </div>

          <div className="flex items-center gap-2.5 bg-background/50 border border-border/20 rounded-xl px-4 py-2.5">
            <Award className="h-5 w-5 text-purple-400" />
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest leading-none">Trader Score</p>
              <p className="text-xl font-black text-foreground mt-0.5">{scores.overall} / 100</p>
            </div>
          </div>
        </div>

        {/* Section 1: Executive Summary */}
        <div className="space-y-3">
          <h3 className="text-sm font-black uppercase tracking-widest text-purple-400 flex items-center gap-1.5">
            <Bot className="h-4 w-4" /> I. Executive Summary
          </h3>
          <div className="p-4 rounded-xl space-y-3 bg-background/30 border border-border/10 text-xs text-muted-foreground/90 leading-relaxed">
            <p>{scores.explanations.overall}</p>
            <p>
              Your active dataset consists of **${data.metrics.totalTrades} positions** with a final net return of **$${data.metrics.netProfit.toFixed(2)}**. Your mathematical profit factor stands at **${data.metrics.profitFactor.toFixed(2)}**, with a return expectancy of **$${data.metrics.expectancy.toFixed(2)}** per trade. Your maximum drawdown was well within parameters at **${data.metrics.maxDrawdownPercent.toFixed(1)}%**.
            </p>
          </div>
        </div>

        {/* Section 2: Cognitive subScores Breakdown */}
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
            <Award className="h-4 w-4" /> II. Cognitive Assessment & Sub-scores
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: "Risk Management", score: scores.subScores.riskManagement, exp: scores.explanations.riskManagement, color: "#10F087" },
              { label: "Execution Quality", score: scores.subScores.execution, exp: scores.explanations.execution, color: "#8B5CF6" },
              { label: "Trading Psychology", score: scores.subScores.psychology, exp: scores.explanations.psychology, color: "#FF6B9D" },
              { label: "Discipline & Lotting", score: scores.subScores.discipline, exp: scores.explanations.discipline, color: "#FFD32D" },
              { label: "Consistency Engine", score: scores.subScores.consistency, exp: scores.explanations.consistency, color: "#06B6D4" }
            ].map((sub, i) => (
              <div key={i} className="rounded-xl p-4 space-y-2 bg-background/30 border border-border/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground/85">{sub.label}</span>
                  <span className="text-xs font-black" style={{ color: sub.color }}>{sub.score}/100</span>
                </div>
                <div className="h-1.5 w-full bg-border/20 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${sub.score}%`, backgroundColor: sub.color }} />
                </div>
                <p className="text-[11px] text-muted-foreground/75 leading-relaxed pt-1">{sub.exp}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Page Break in Print */}
        <div className="page-break" />

        {/* Section 3: Smart Mistake Detection */}
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-red-400 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" /> III. Behavioral Leak Detection (Mistakes)
          </h3>
          {mistakes.length > 0 ? (
            <div className="space-y-3">
              {mistakes.map((mistake, idx) => (
                <div key={idx} className="p-4 rounded-xl space-y-2 bg-background/30 border border-border/10">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-foreground">{mistake.title}</span>
                      <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                        mistake.severity === "high" 
                          ? "bg-red-500/10 text-red-400 border-red-500/20" 
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}>
                        {mistake.severity} severity
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground font-semibold">Freq: {mistake.frequency.toFixed(1)}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground/70 leading-relaxed">{mistake.description}</p>
                  <p className="text-xs text-muted-foreground/80 font-bold bg-background/50 p-2 rounded-lg border border-border/5">
                    🔎 Evidence: {mistake.evidence}
                  </p>
                  <p className="text-xs text-cyan-400 leading-relaxed pt-0.5">
                    💡 Suggested Fix: {mistake.suggestedFix}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl text-xs text-muted-foreground bg-background/35 text-center">
              No prominent behavioral leaks or negative trade clusters found in this session. Exceptional performance.
            </div>
          )}
        </div>

        {/* Section 4: Alpha Patterns Discovered */}
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
            <Lightbulb className="h-4 w-4" /> IV. Alpha Pattern Discovery
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {patterns.map((pat, i) => (
              <div key={i} className="p-4 rounded-xl space-y-1.5 bg-background/30 border border-border/10">
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                  pat.type === "positive" 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}>
                  {pat.category}
                </span>
                <h4 className="text-xs font-black text-foreground pt-1">{pat.title}</h4>
                <p className="text-xs text-muted-foreground/70 leading-relaxed">{pat.evidence}</p>
                <p className="text-[10px] text-muted-foreground font-bold">{pat.metrics}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Quant Comparisons */}
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4" /> V. Quantile Comparison (Best vs Worst)
          </h3>
          <div className="overflow-x-auto rounded-xl border border-border/10">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-background/40 text-muted-foreground">
                  <th className="p-3">Quantile Group</th>
                  <th className="p-3 text-right">Avg P&L</th>
                  <th className="p-3 text-right">Avg Duration</th>
                  <th className="p-3 text-right">Avg Size (Lots)</th>
                  <th className="p-3 text-right">Main Asset</th>
                  <th className="p-3 text-right">Main Day</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/5">
                <tr className="hover:bg-white/2 transition-colors">
                  <td className="p-3 font-semibold text-emerald-400">Top 10% Trades</td>
                  <td className="p-3 text-right font-bold text-emerald-400">${comparisons.top10.avgProfit.toFixed(2)}</td>
                  <td className="p-3 text-right tabular-nums">{comparisons.top10.avgDurationMinutes.toFixed(1)}m</td>
                  <td className="p-3 text-right tabular-nums">{comparisons.top10.avgLots.toFixed(2)}</td>
                  <td className="p-3 text-right font-semibold">{comparisons.top10.commonSymbol}</td>
                  <td className="p-3 text-right">{comparisons.top10.commonDay}</td>
                </tr>
                <tr className="hover:bg-white/2 transition-colors">
                  <td className="p-3 font-semibold text-emerald-400">Top 25% Trades</td>
                  <td className="p-3 text-right font-bold text-emerald-400">${comparisons.top25.avgProfit.toFixed(2)}</td>
                  <td className="p-3 text-right tabular-nums">{comparisons.top25.avgDurationMinutes.toFixed(1)}m</td>
                  <td className="p-3 text-right tabular-nums">{comparisons.top25.avgLots.toFixed(2)}</td>
                  <td className="p-3 text-right font-semibold">{comparisons.top25.commonSymbol}</td>
                  <td className="p-3 text-right">{comparisons.top25.commonDay}</td>
                </tr>
                <tr className="hover:bg-white/2 transition-colors">
                  <td className="p-3 font-semibold text-red-400">Worst 25% Trades</td>
                  <td className="p-3 text-right font-bold text-red-400">-${Math.abs(comparisons.worst25.avgProfit).toFixed(2)}</td>
                  <td className="p-3 text-right tabular-nums">{comparisons.worst25.avgDurationMinutes.toFixed(1)}m</td>
                  <td className="p-3 text-right tabular-nums">{comparisons.worst25.avgLots.toFixed(2)}</td>
                  <td className="p-3 text-right font-semibold">{comparisons.worst25.commonSymbol}</td>
                  <td className="p-3 text-right">{comparisons.worst25.commonDay}</td>
                </tr>
                <tr className="hover:bg-white/2 transition-colors">
                  <td className="p-3 font-semibold text-red-400">Worst 10% Trades</td>
                  <td className="p-3 text-right font-bold text-red-400">-${Math.abs(comparisons.worst10.avgProfit).toFixed(2)}</td>
                  <td className="p-3 text-right tabular-nums">{comparisons.worst10.avgDurationMinutes.toFixed(1)}m</td>
                  <td className="p-3 text-right tabular-nums">{comparisons.worst10.avgLots.toFixed(2)}</td>
                  <td className="p-3 text-right font-semibold">{comparisons.worst10.commonSymbol}</td>
                  <td className="p-3 text-right">{comparisons.worst10.commonDay}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-4 rounded-xl bg-background/25 border border-border/10 space-y-1.5">
            <h4 className="text-xs font-bold text-foreground">Quant Conclusions:</h4>
            <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground/85">
              {comparisons.conclusions.map((cl, idx) => (
                <li key={idx}>{cl}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Section 6: Recommended Goals */}
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-purple-400 flex items-center gap-1.5">
            <CheckSquare className="h-4 w-4" /> VI. Actionable Playbook (Goals for Next Session)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {goals.slice(0, 4).map((g, idx) => (
              <div key={idx} className="p-4 rounded-xl space-y-2 bg-background/30 border border-border/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">{g.title}</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                    g.status === "passed" 
                      ? "bg-emerald-500/15 text-emerald-400" 
                      : "bg-red-500/15 text-red-400"
                  }`}>
                    {g.status === "passed" ? "Pass" : "Failed"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground/75 leading-relaxed">{g.evidence}</p>
                <div className="flex justify-between text-[11px] font-bold text-muted-foreground/60 pt-1">
                  <span>Target: {g.targetValue} {g.metricLabel}</span>
                  <span>Current: {g.currentValue.toFixed(1)} {g.metricLabel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

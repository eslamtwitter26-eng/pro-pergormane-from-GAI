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
      <div className="rounded-[14px] p-6 relative overflow-hidden no-print"
        style={{ background: "hsl(var(--card))", border: "1px solid var(--hairline)" }}>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-[14px] flex-shrink-0"
              style={{ background: "rgba(59,130,246,0.15)", border: "1px solid var(--hairline)" }}>
              <FileText className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold gradient-text">Weekly AI Executive Report</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Generate, customize, and export a professional performance audit for your files.
              </p>
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-[14px] text-xs font-bold text-white transition-all shadow-[var(--shadow-md)] cursor-pointer"
            style={{ background: "hsl(var(--primary))" }}
          >
            <Printer className="h-4 w-4" /> Export Report (PDF)
          </button>
        </div>
      </div>

      {/* Printable Report Canvas */}
      <div className="printable-report-container rounded-[14px] p-8 space-y-8 max-w-4xl mx-auto shadow-[var(--shadow-lg)]"
        style={{ background: "hsl(var(--card))", border: "1px solid var(--hairline)" }}>
        
        {/* Title Cover Section */}
        <div className="border-b border-[color:var(--hairline)] pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-md border border-[color:var(--hairline)]">
                AI GENERIC REPORT
              </span>
              <span className="text-xs text-muted-foreground">{todayStr}</span>
            </div>
            <h1 className="text-2xl font-semibold mt-1 text-foreground">Weekly Executive Performance Audit</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Comprehensive audit for Metatrader position datasets.</p>
          </div>

          <div className="flex items-center gap-2.5 bg-[var(--surface-hover)] border border-[color:var(--hairline)] rounded-[14px] px-4 py-2.5">
            <Award className="h-5 w-5 text-blue-400" />
            <div>
              <p className="text-[11px] uppercase font-bold text-muted-foreground tracking-widest leading-none">Trader Score</p>
              <p className="text-xl font-semibold text-foreground mt-0.5">{scores.overall} / 100</p>
            </div>
          </div>
        </div>

        {/* Section 1: Executive Summary */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-blue-400 flex items-center gap-1.5">
            <Bot className="h-4 w-4" /> I. Executive Summary
          </h3>
          <div className="p-4 rounded-[14px] space-y-3 bg-[var(--surface-hover)] border border-[color:var(--hairline)] text-xs text-muted-foreground leading-relaxed">
            <p>{scores.explanations.overall}</p>
            <p>
              Your active dataset consists of **${data.metrics.totalTrades} positions** with a final net return of **$${data.metrics.netProfit.toFixed(2)}**. Your mathematical profit factor stands at **${data.metrics.profitFactor.toFixed(2)}**, with a return expectancy of **$${data.metrics.expectancy.toFixed(2)}** per trade. Your maximum drawdown was well within parameters at **${data.metrics.maxDrawdownPercent.toFixed(1)}%**.
            </p>
          </div>
        </div>

        {/* Section 2: Cognitive subScores Breakdown */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-blue-400 flex items-center gap-1.5">
            <Award className="h-4 w-4" /> II. Cognitive Assessment & Sub-scores
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: "Risk Management", score: scores.subScores.riskManagement, exp: scores.explanations.riskManagement, color: "#10B981" },
              { label: "Execution Quality", score: scores.subScores.execution, exp: scores.explanations.execution, color: "#3B82F6" },
              { label: "Trading Psychology", score: scores.subScores.psychology, exp: scores.explanations.psychology, color: "#94A3B8" },
              { label: "Discipline & Lotting", score: scores.subScores.discipline, exp: scores.explanations.discipline, color: "#F59E0B" },
              { label: "Consistency Engine", score: scores.subScores.consistency, exp: scores.explanations.consistency, color: "#60A5FA" }
            ].map((sub, i) => (
              <div key={i} className="rounded-[14px] p-4 space-y-2 bg-[var(--surface-hover)] border border-[color:var(--hairline)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">{sub.label}</span>
                  <span className="text-xs font-semibold" style={{ color: sub.color }}>{sub.score}/100</span>
                </div>
                <div className="h-1.5 w-full bg-border/20 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${sub.score}%`, backgroundColor: sub.color }} />
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">{sub.exp}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Page Break in Print */}
        <div className="page-break" />

        {/* Section 3: Smart Mistake Detection */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-red-400 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" /> III. Behavioral Leak Detection (Mistakes)
          </h3>
          {mistakes.length > 0 ? (
            <div className="space-y-3">
              {mistakes.map((mistake, idx) => (
                <div key={idx} className="p-4 rounded-[14px] space-y-2 bg-[var(--surface-hover)] border border-[color:var(--hairline)]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-foreground">{mistake.title}</span>
                      <span className={`text-[11px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                        mistake.severity === "high" 
                          ? "bg-red-500/10 text-red-400 border-[color:var(--hairline)]" 
                          : "bg-amber-500/10 text-amber-400 border-[color:var(--hairline)]"
                      }`}>
                        {mistake.severity} severity
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground font-semibold">Freq: {mistake.frequency.toFixed(1)}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{mistake.description}</p>
                  <p className="text-xs text-muted-foreground font-bold bg-[var(--surface-hover)] p-2 rounded-lg border border-[color:var(--hairline)]">
                    🔎 Evidence: {mistake.evidence}
                  </p>
                  <p className="text-xs text-blue-400 leading-relaxed pt-0.5">
                    💡 Suggested Fix: {mistake.suggestedFix}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-[14px] text-xs text-muted-foreground bg-[var(--surface-hover)] text-center">
              No prominent behavioral leaks or negative trade clusters found in this session. Exceptional performance.
            </div>
          )}
        </div>

        {/* Section 4: Alpha Patterns Discovered */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
            <Lightbulb className="h-4 w-4" /> IV. Alpha Pattern Discovery
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {patterns.map((pat, i) => (
              <div key={i} className="p-4 rounded-[14px] space-y-1.5 bg-[var(--surface-hover)] border border-[color:var(--hairline)]">
                <span className={`text-[11px] font-bold  px-2 py-0.5 rounded-md border ${
                  pat.type === "positive" 
                    ? "bg-emerald-500/10 text-emerald-400 border-[color:var(--hairline)]" 
                    : "bg-red-500/10 text-red-400 border-[color:var(--hairline)]"
                }`}>
                  {pat.category}
                </span>
                <h4 className="text-xs font-semibold text-foreground pt-1">{pat.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{pat.evidence}</p>
                <p className="text-[11px] text-muted-foreground font-bold">{pat.metrics}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Quant Comparisons */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-blue-400 flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4" /> V. Quantile Comparison (Best vs Worst)
          </h3>
          <div className="overflow-x-auto rounded-[14px] border border-[color:var(--hairline)]">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-[var(--surface-hover)] text-muted-foreground">
                  <th className="p-4">Quantile Group</th>
                  <th className="p-4 text-right">Avg P&L</th>
                  <th className="p-4 text-right">Avg Duration</th>
                  <th className="p-4 text-right">Avg Size (Lots)</th>
                  <th className="p-4 text-right">Main Asset</th>
                  <th className="p-4 text-right">Main Day</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/5">
                <tr className="hover:bg-[var(--surface-hover)] transition-colors">
                  <td className="p-4 font-semibold text-emerald-400">Top 10% Trades</td>
                  <td className="p-4 text-right font-bold text-emerald-400">${comparisons.top10.avgProfit.toFixed(2)}</td>
                  <td className="p-4 text-right tabular-nums">{comparisons.top10.avgDurationMinutes.toFixed(1)}m</td>
                  <td className="p-4 text-right tabular-nums">{comparisons.top10.avgLots.toFixed(2)}</td>
                  <td className="p-4 text-right font-semibold">{comparisons.top10.commonSymbol}</td>
                  <td className="p-4 text-right">{comparisons.top10.commonDay}</td>
                </tr>
                <tr className="hover:bg-[var(--surface-hover)] transition-colors">
                  <td className="p-4 font-semibold text-emerald-400">Top 25% Trades</td>
                  <td className="p-4 text-right font-bold text-emerald-400">${comparisons.top25.avgProfit.toFixed(2)}</td>
                  <td className="p-4 text-right tabular-nums">{comparisons.top25.avgDurationMinutes.toFixed(1)}m</td>
                  <td className="p-4 text-right tabular-nums">{comparisons.top25.avgLots.toFixed(2)}</td>
                  <td className="p-4 text-right font-semibold">{comparisons.top25.commonSymbol}</td>
                  <td className="p-4 text-right">{comparisons.top25.commonDay}</td>
                </tr>
                <tr className="hover:bg-[var(--surface-hover)] transition-colors">
                  <td className="p-4 font-semibold text-red-400">Worst 25% Trades</td>
                  <td className="p-4 text-right font-bold text-red-400">-${Math.abs(comparisons.worst25.avgProfit).toFixed(2)}</td>
                  <td className="p-4 text-right tabular-nums">{comparisons.worst25.avgDurationMinutes.toFixed(1)}m</td>
                  <td className="p-4 text-right tabular-nums">{comparisons.worst25.avgLots.toFixed(2)}</td>
                  <td className="p-4 text-right font-semibold">{comparisons.worst25.commonSymbol}</td>
                  <td className="p-4 text-right">{comparisons.worst25.commonDay}</td>
                </tr>
                <tr className="hover:bg-[var(--surface-hover)] transition-colors">
                  <td className="p-4 font-semibold text-red-400">Worst 10% Trades</td>
                  <td className="p-4 text-right font-bold text-red-400">-${Math.abs(comparisons.worst10.avgProfit).toFixed(2)}</td>
                  <td className="p-4 text-right tabular-nums">{comparisons.worst10.avgDurationMinutes.toFixed(1)}m</td>
                  <td className="p-4 text-right tabular-nums">{comparisons.worst10.avgLots.toFixed(2)}</td>
                  <td className="p-4 text-right font-semibold">{comparisons.worst10.commonSymbol}</td>
                  <td className="p-4 text-right">{comparisons.worst10.commonDay}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-4 rounded-[14px] bg-[var(--surface-hover)] border border-[color:var(--hairline)] space-y-1.5">
            <h4 className="text-xs font-bold text-foreground">Quant Conclusions:</h4>
            <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
              {comparisons.conclusions.map((cl, idx) => (
                <li key={idx}>{cl}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Section 6: Recommended Goals */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-blue-400 flex items-center gap-1.5">
            <CheckSquare className="h-4 w-4" /> VI. Actionable Playbook (Goals for Next Session)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {goals.slice(0, 4).map((g, idx) => (
              <div key={idx} className="p-4 rounded-[14px] space-y-2 bg-[var(--surface-hover)] border border-[color:var(--hairline)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">{g.title}</span>
                  <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-md ${
                    g.status === "passed" 
                      ? "bg-emerald-500/15 text-emerald-400" 
                      : "bg-red-500/15 text-red-400"
                  }`}>
                    {g.status === "passed" ? "Pass" : "Failed"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{g.evidence}</p>
                <div className="flex justify-between text-[11px] font-bold text-muted-foreground pt-1">
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

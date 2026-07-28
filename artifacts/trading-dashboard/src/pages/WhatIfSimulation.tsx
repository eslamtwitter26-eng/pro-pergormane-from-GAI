import { useState, useMemo } from "react";
import { Sliders, RefreshCw, CheckCircle2, TrendingUp, DollarSign, Activity, Percent, ArrowUpRight, HelpCircle, AlertCircle } from "lucide-react";
import type { Language } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { runWhatIfSimulation, type SimulationRules } from "@/lib/evolvedAnalysis";
import type { AnalysisResult } from "@/lib/tradeAnalysis";

interface WhatIfSimulationProps {
  data: AnalysisResult;
  lang: Language;
  theme: "dark" | "light";
}

export function WhatIfSimulation({ data, lang, theme }: WhatIfSimulationProps) {
  // Local state for simulation rules
  const [rules, setRules] = useState<SimulationRules>({
    riskPercent: undefined, // undefined = actual
    skipFridays: false,
    stopLossLimit: 0, // 0 = disabled
    onlyLondon: false,
    minRRMultiplier: undefined,
    ignoreAfterHour: undefined
  });

  const simulated = useMemo(() => {
    return runWhatIfSimulation(data.trades, data.metrics, rules, lang);
  }, [data, rules, lang]);

  // Handle updates
  const toggleFriday = () => setRules(prev => ({ ...prev, skipFridays: !prev.skipFridays }));
  const toggleLondon = () => setRules(prev => ({ ...prev, onlyLondon: !prev.onlyLondon }));
  
  const handleRiskChange = (val: string) => {
    const risk = val === "actual" ? undefined : parseFloat(val);
    setRules(prev => ({ ...prev, riskPercent: risk }));
  };

  const handleStopLimitChange = (val: number) => {
    setRules(prev => ({ ...prev, stopLossLimit: val }));
  };

  const handleHourChange = (val: string) => {
    const hr = val === "any" ? undefined : parseInt(val);
    setRules(prev => ({ ...prev, ignoreAfterHour: hr }));
  };

  const handleReset = () => {
    setRules({
      riskPercent: undefined,
      skipFridays: false,
      stopLossLimit: 0,
      onlyLondon: false,
      minRRMultiplier: undefined,
      ignoreAfterHour: undefined
    });
  };

  const hasChanges = rules.riskPercent !== undefined || rules.skipFridays || rules.stopLossLimit > 0 || rules.onlyLondon || rules.ignoreAfterHour !== undefined;

  // Formatting helpers
  const fmtMoney = (v: number) => `${v >= 0 ? "+" : ""}$${v.toFixed(2)}`;
  const fmtPercent = (v: number) => `${v.toFixed(1)}%`;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="rounded-[14px] p-6 relative overflow-hidden"
        style={{ background: "hsl(var(--card))", border: "1px solid var(--hairline)" }}>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-[14px] flex-shrink-0"
              style={{ background: "rgba(96,165,250,0.15)", border: "1px solid var(--hairline)" }}>
              <Sliders className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold gradient-text">What-If Core Simulator</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Isolate structural elements, apply custom risk filters, and instantly observe simulated returns.
              </p>
            </div>
          </div>

          {hasChanges && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground bg-white/5 hover:bg-[var(--surface-hover)] transition-all"
            >
              <RefreshCw className="h-3.5 w-3.5 animate-spin-hover" /> Reset Settings
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Parameters Form */}
        <div className="lg:col-span-4 rounded-[14px] p-6 space-y-6"
          style={{ background: "hsl(var(--card))", border: "1px solid var(--hairline)" }}>
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground mb-4">Simulation Rules</h3>
            <div className="space-y-5">
              
              {/* Rule 1: Risk Modeling */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-foreground block">Position Sizing Risk Model</label>
                <select
                  value={rules.riskPercent ?? "actual"}
                  onChange={(e) => handleRiskChange(e.target.value)}
                  className="w-full bg-background border border-[color:var(--hairline)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500/40 text-foreground"
                >
                  <option value="actual">Actual Lot Sizes (Variable)</option>
                  <option value="0.5">Risk exactly 0.5% of balance per trade</option>
                  <option value="1">Risk exactly 1.0% of balance per trade</option>
                  <option value="2">Risk exactly 2.0% of balance per trade</option>
                </select>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Scales all trade outcomes proportionally to fit a standard account model of $10,000.
                </p>
              </div>

              {/* Rule 2: Skip Fridays */}
              <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: "hsl(var(--background) / 40%)" }}>
                <div>
                  <label className="text-xs font-bold text-foreground block">Skip Friday Trading</label>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Omit positions opened on Fridays.</p>
                </div>
                <button
                  onClick={toggleFriday}
                  className={`w-10 h-6 rounded-full p-1 transition-all ${rules.skipFridays ? "bg-blue-500" : "bg-border/30"}`}
                >
                  <div className={`h-4 w-4 rounded-full bg-white transition-all ${rules.skipFridays ? "translate-x-4" : "translate-x-0"}`} />
                </button>
              </div>

              {/* Rule 3: Stop after consecutive losses */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-foreground block">Stop Trading After Losses</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[0, 2, 3, 5].map((val) => (
                    <button
                      key={val}
                      onClick={() => handleStopLimitChange(val)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        rules.stopLossLimit === val 
                          ? "bg-blue-500/20 text-blue-400 border border-[color:var(--hairline)]" 
                          : "bg-[var(--surface-hover)] hover:bg-[var(--surface-hover)] text-muted-foreground border border-[color:var(--hairline)]"
                      }`}
                    >
                      {val === 0 ? "Off" : `${val} Ls`}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Stops execution on any day once a consecutive run of losses occurs, reducing revenge-trading damage.
                </p>
              </div>

              {/* Rule 4: Only London Session */}
              <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: "hsl(var(--background) / 40%)" }}>
                <div>
                  <label className="text-xs font-bold text-foreground block">Restrict to London Session</label>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Omit all trades outside 07:00-13:00 UTC.</p>
                </div>
                <button
                  onClick={toggleLondon}
                  className={`w-10 h-6 rounded-full p-1 transition-all ${rules.onlyLondon ? "bg-blue-500" : "bg-border/30"}`}
                >
                  <div className={`h-4 w-4 rounded-full bg-white transition-all ${rules.onlyLondon ? "translate-x-4" : "translate-x-0"}`} />
                </button>
              </div>

              {/* Rule 5: Ignore trades after Hour */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-foreground block">Hard Stop Hour</label>
                <select
                  value={rules.ignoreAfterHour ?? "any"}
                  onChange={(e) => handleHourChange(e.target.value)}
                  className="w-full bg-background border border-[color:var(--hairline)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500/40 text-foreground"
                >
                  <option value="any">No Time Stop</option>
                  <option value="12">Ignore positions after 12:00 UTC</option>
                  <option value="15">Ignore positions after 15:00 UTC</option>
                  <option value="18">Ignore positions after 18:00 UTC</option>
                  <option value="20">Ignore positions after 20:00 UTC</option>
                </select>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Omit trades opened past this UTC hour to model stopping prior to volatile session closure.
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* Right Side: Results Comparisons & Insights */}
        <div className="lg:col-span-8 space-y-6">
          {/* Comparison Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Net Returns Card */}
            <div className="rounded-[14px] p-4 space-y-3" style={{ background: "hsl(var(--card))", border: "1px solid var(--hairline)" }}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground">Cumulative Net Profit</span>
                <DollarSign className="h-4 w-4 text-blue-400" />
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <p className="text-[11px] text-muted-foreground">Actual</p>
                  <p className="text-sm font-semibold text-muted-foreground">{fmtMoney(simulated.original.netProfit)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-blue-400 font-bold">Simulated</p>
                  <p className="text-xl font-semibold text-foreground">{fmtMoney(simulated.simulated.netProfit)}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-[color:var(--hairline)] flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground font-semibold">Net Difference</span>
                <span className={`text-xs font-semibold tabular-nums ${simulated.diffs.netProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {simulated.diffs.netProfit >= 0 ? "+" : ""}${simulated.diffs.netProfit.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Win Rate Card */}
            <div className="rounded-[14px] p-4 space-y-3" style={{ background: "hsl(var(--card))", border: "1px solid var(--hairline)" }}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground">Accuracy (Win Rate)</span>
                <Percent className="h-4 w-4 text-blue-400" />
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <p className="text-[11px] text-muted-foreground">Actual</p>
                  <p className="text-sm font-semibold text-muted-foreground">{fmtPercent(simulated.original.winRate)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-blue-400 font-bold">Simulated</p>
                  <p className="text-xl font-semibold text-foreground">{fmtPercent(simulated.simulated.winRate)}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-[color:var(--hairline)] flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground font-semibold">Accuracy Delta</span>
                <span className={`text-xs font-semibold tabular-nums ${simulated.diffs.winRate >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {simulated.diffs.winRate >= 0 ? "+" : ""}{simulated.diffs.winRate.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Profit Factor Card */}
            <div className="rounded-[14px] p-4 space-y-3" style={{ background: "hsl(var(--card))", border: "1px solid var(--hairline)" }}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground">Profit Factor (Efficiency)</span>
                <Activity className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <p className="text-[11px] text-muted-foreground">Actual</p>
                  <p className="text-sm font-semibold text-muted-foreground">{simulated.original.profitFactor.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-emerald-400 font-bold">Simulated</p>
                  <p className="text-xl font-semibold text-foreground">{simulated.simulated.profitFactor.toFixed(2)}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-[color:var(--hairline)] flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground font-semibold">PF Delta</span>
                <span className={`text-xs font-semibold tabular-nums ${simulated.diffs.profitFactor >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {simulated.diffs.profitFactor >= 0 ? "+" : ""}{simulated.diffs.profitFactor.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Maximum Drawdown Card */}
            <div className="rounded-[14px] p-4 space-y-3" style={{ background: "hsl(var(--card))", border: "1px solid var(--hairline)" }}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground">Maximum Drawdown</span>
                <TrendingUp className="h-4 w-4 text-amber-400" />
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <p className="text-[11px] text-muted-foreground">Actual</p>
                  <p className="text-sm font-semibold text-muted-foreground">{fmtPercent(simulated.original.maxDrawdown)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-amber-400 font-bold">Simulated</p>
                  <p className="text-xl font-semibold text-foreground">{fmtPercent(simulated.simulated.maxDrawdown)}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-[color:var(--hairline)] flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground font-semibold">Risk Reduction</span>
                <span className={`text-xs font-semibold tabular-nums ${simulated.simulated.maxDrawdown <= simulated.original.maxDrawdown ? "text-emerald-400" : "text-red-400"}`}>
                  {simulated.simulated.maxDrawdown <= simulated.original.maxDrawdown ? "Saved " : "Increased "}{(Math.abs(simulated.original.maxDrawdown - simulated.simulated.maxDrawdown)).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Table Comparison Panel */}
          <div className="rounded-[14px] p-4" style={{ background: "hsl(var(--card))", border: "1px solid var(--hairline)" }}>
            <h3 className="text-xs font-semibold text-muted-foreground mb-4">Detailed Dataset Delta</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[color:var(--hairline)] text-muted-foreground text-left">
                    <th className="pb-2">Metric</th>
                    <th className="pb-2 text-right">Raw History</th>
                    <th className="pb-2 text-right">Simulated Path</th>
                    <th className="pb-2 text-right">Absolute Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/5">
                  <tr>
                    <td className="py-2.5 font-semibold text-foreground">Total Positions Run</td>
                    <td className="py-2.5 text-right font-semibold tabular-nums">{simulated.original.totalTrades}</td>
                    <td className="py-2.5 text-right font-semibold tabular-nums">{simulated.simulated.totalTrades}</td>
                    <td className="py-2.5 text-right font-bold tabular-nums text-blue-400">
                      {simulated.diffs.totalTrades} ({((simulated.diffs.totalTrades / simulated.original.totalTrades) * 100).toFixed(0)}%)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-semibold text-foreground">Mathematical Expectancy</td>
                    <td className="py-2.5 text-right font-semibold tabular-nums">${simulated.original.expectancy.toFixed(2)}</td>
                    <td className="py-2.5 text-right font-semibold tabular-nums">${simulated.simulated.expectancy.toFixed(2)}</td>
                    <td className={`py-2.5 text-right font-bold tabular-nums ${simulated.diffs.expectancy >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {simulated.diffs.expectancy >= 0 ? "+" : ""}${simulated.diffs.expectancy.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Dynamic AI Simulation Insights */}
          <div className="rounded-[14px] p-6 border"
            style={{ 
              background: simulated.simulated.netProfit >= simulated.original.netProfit 
                ? "rgba(16,185,129,0.03)" 
                : "rgba(239,68,68,0.03)",
              borderColor: simulated.simulated.netProfit >= simulated.original.netProfit 
                ? "rgba(16,185,129,0.12)" 
                : "rgba(239,68,68,0.12)"
            }}>
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-3">
              <ArrowUpRight className="h-4 w-4" style={{ color: simulated.simulated.netProfit >= simulated.original.netProfit ? "#10B981" : "#EF4444" }} />
              AI Simulation Conclusions
            </h4>

            {simulated.insights.length > 0 ? (
              <div className="space-y-2">
                {simulated.insights.map((ins, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <CheckCircle2 className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">{ins}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0" />
                <span>Change one or more parameters on the left to recalculate and run the full Monte Carlo path.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

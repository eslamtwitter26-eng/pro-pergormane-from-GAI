import type { SymbolPerformance } from "@/lib/tradeAnalysis";
import type { Language } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface SymbolTableProps {
  data: SymbolPerformance[];
  lang: Language;
}

export function SymbolTable({ data, lang }: SymbolTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {[t(lang, "symbol"), t(lang, "trades"), t(lang, "winRateLabel"), t(lang, "profit"), t(lang, "avgProfit") || "Avg/Trade"].map((h) => (
              <th key={h} className="pb-2 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.85)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 15).map((s) => (
            <tr key={s.symbol} className="border-b border-border/50 hover:bg-card/50 transition-colors">
              <td className="py-2.5 font-mono font-medium text-foreground">{s.symbol}</td>
              <td className="py-2.5 tabular-nums" style={{ color: "rgba(255,255,255,0.85)" }}>{s.trades}</td>
              <td className="py-2.5">
                <span className={cn(
                  "tabular-nums font-medium",
                  s.winRate >= 50 ? "text-emerald-400" : "text-red-400"
                )}>
                  {s.winRate.toFixed(1)}%
                </span>
              </td>
              <td className={cn(
                "py-2.5 tabular-nums font-medium",
                s.netProfit >= 0 ? "text-emerald-400" : "text-red-400"
              )}>
                {s.netProfit >= 0 ? "+" : ""}${s.netProfit.toFixed(2)}
              </td>
              <td className={cn(
                "py-2.5 tabular-nums text-sm",
                s.avgProfit >= 0 ? "text-emerald-400/80" : "text-red-400/80"
              )}>
                {s.avgProfit >= 0 ? "+" : ""}${s.avgProfit.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}



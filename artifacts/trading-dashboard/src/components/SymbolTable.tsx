import type { SymbolPerformance } from "@/lib/tradeAnalysis";
import type { Language } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface SymbolTableProps {
  data: SymbolPerformance[];
  lang: Language;
}

/** Dense but breathable: hairline rules, tabular figures, quiet row hover. */
export function SymbolTable({ data, lang }: SymbolTableProps) {
  const headers = [
    t(lang, "symbol"),
    t(lang, "trades"),
    t(lang, "winRateLabel"),
    t(lang, "profit"),
    t(lang, "avgProfit") || "Avg/Trade",
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--hairline)" }}>
            {headers.map((h, i) => (
              <th
                key={h}
                className={cn(
                  "pb-3 text-[11.5px] font-medium text-muted-foreground",
                  i === 0 ? "text-left" : "text-right"
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 15).map((s) => (
            <tr
              key={s.symbol}
              className="transition-colors hover:bg-[var(--surface-hover)]"
              style={{ borderBottom: "1px solid var(--hairline)" }}
            >
              <td className="py-3 font-mono text-[12.5px] font-medium text-foreground">{s.symbol}</td>
              <td className="py-3 text-right tabular-nums text-muted-foreground">{s.trades}</td>
              <td className="py-3 text-right">
                <span
                  className="tabular-nums font-medium"
                  style={{ color: s.winRate >= 50 ? "#10B981" : "#EF4444" }}
                >
                  {s.winRate.toFixed(1)}%
                </span>
              </td>
              <td
                className="py-3 text-right tabular-nums font-medium"
                style={{ color: s.netProfit >= 0 ? "#10B981" : "#EF4444" }}
              >
                {s.netProfit >= 0 ? "+" : ""}${s.netProfit.toFixed(2)}
              </td>
              <td className="py-3 text-right tabular-nums text-muted-foreground">
                {s.avgProfit >= 0 ? "+" : ""}${s.avgProfit.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

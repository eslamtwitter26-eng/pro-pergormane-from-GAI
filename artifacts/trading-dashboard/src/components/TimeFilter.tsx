import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Language } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export type TimeRange = "all" | "1y" | "6m" | "3m" | "1m" | "1w" | "custom";

interface TimeFilterProps {
  value: TimeRange;
  onChange: (range: TimeRange, from?: Date, to?: Date) => void;
  lang: Language;
}

const OPTIONS: { key: TimeRange; labelKey: string }[] = [
  { key: "all", labelKey: "all" },
  { key: "1y", labelKey: "oneYear" },
  { key: "6m", labelKey: "sixMonths" },
  { key: "3m", labelKey: "threeMonths" },
  { key: "1m", labelKey: "oneMonth" },
  { key: "1w", labelKey: "oneWeek" },
  { key: "custom", labelKey: "custom" },
];

export function getDateRangeFromFilter(range: TimeRange): { from: Date | null; to: Date | null } {
  const now = new Date();
  switch (range) {
    case "1y": return { from: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000), to: null };
    case "6m": return { from: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000), to: null };
    case "3m": return { from: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), to: null };
    case "1m": return { from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), to: null };
    case "1w": return { from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), to: null };
    default: return { from: null, to: null };
  }
}

export function TimeFilter({ value, onChange, lang }: TimeFilterProps) {
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const handlePreset = (key: TimeRange) => {
    if (key === "custom") {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      onChange(key);
    }
  };

  const applyCustom = () => {
    const from = customFrom ? new Date(customFrom) : undefined;
    const to = customTo ? new Date(customTo) : undefined;
    onChange("custom", from, to);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-1">
        {OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => handlePreset(opt.key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              value === opt.key
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border hover:border-primary/50" 
            )}
          >
            {t(lang, opt.labelKey as Parameters<typeof t>[1])}
          </button>
        ))}
      </div>
      {showCustom && (
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground"
          />
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.8)" }}>—</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground"
          />
          <button
            onClick={applyCustom}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
          >
            {t(lang, "apply")}
          </button>
        </div>
      )}
    </div>
  );
}

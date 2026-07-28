import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Language } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { EASE_OUT } from "@/lib/motion";

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

/** Segmented control — the sliding pill is the only thing that moves. */
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

  const inputStyle: React.CSSProperties = {
    background: "hsl(var(--card))",
    border: "1px solid var(--hairline)",
    color: "hsl(var(--foreground))",
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        className="flex flex-wrap items-center gap-0.5 rounded-[12px] p-1"
        style={{ background: "var(--surface-hover)", border: "1px solid var(--hairline)" }}
      >
        {OPTIONS.map((opt) => {
          const active = value === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => handlePreset(opt.key)}
              className={cn(
                "relative rounded-[9px] px-3 py-1.5 text-[12px] font-medium",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {active && (
                <motion.span
                  layoutId="timefilter-pill"
                  transition={{ duration: 0.26, ease: EASE_OUT }}
                  className="absolute inset-0 rounded-[9px]"
                  style={{ background: "hsl(var(--card))", boxShadow: "var(--shadow-xs)" }}
                />
              )}
              <span className="relative">{t(lang, opt.labelKey as Parameters<typeof t>[1])}</span>
            </button>
          );
        })}
      </div>

      {showCustom && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: EASE_OUT }}
          className="flex flex-wrap items-center gap-2"
        >
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="rounded-[10px] px-2.5 py-1.5 text-[12px] outline-none"
            style={inputStyle}
          />
          <span className="text-[12px] text-muted-foreground">—</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="rounded-[10px] px-2.5 py-1.5 text-[12px] outline-none"
            style={inputStyle}
          />
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ y: 0, scale: 0.985 }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
            onClick={applyCustom}
            className="rounded-[10px] px-3.5 py-1.5 text-[12px] font-medium text-white"
            style={{ background: "hsl(var(--primary))", boxShadow: "var(--shadow-xs)" }}
          >
            {t(lang, "apply")}
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}

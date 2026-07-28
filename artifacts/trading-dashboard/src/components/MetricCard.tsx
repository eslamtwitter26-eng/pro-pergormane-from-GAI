import { ReactNode, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { EASE_OUT, HOVER_TRANSITION } from "@/lib/motion";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  className?: string;
  accentColor?: string;
  delay?: number;
}

function useCountUp(target: number, duration = 900, delay = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      const start = performance.now();
      const step = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setVal(target * ease);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(timer);
  }, [target, duration, delay]);
  return val;
}

/**
 * Accents are used only for the small icon chip and, when a trend is present,
 * the value itself. Card borders stay neutral — colour carries meaning, not
 * decoration.
 */
const ACCENT_COLORS: Record<string, { text: string; bg: string }> = {
  purple: { text: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
  blue:   { text: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
  cyan:   { text: "#60A5FA", bg: "rgba(96,165,250,0.1)" },
  green:  { text: "#10B981", bg: "rgba(16,185,129,0.1)" },
  red:    { text: "#EF4444", bg: "rgba(239,68,68,0.1)" },
  amber:  { text: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  pink:   { text: "#94A3B8", bg: "rgba(148,163,184,0.1)" },
};

export function MetricCard({ title, value, subtitle, icon, trend, className, accentColor = "purple", delay = 0 }: MetricCardProps) {
  const colors = ACCENT_COLORS[accentColor] || ACCENT_COLORS.purple;

  const isNumeric = typeof value === "number" && !isNaN(value);
  const animated = useCountUp(isNumeric ? (value as number) : 0, 900, delay);
  const displayValue = isNumeric
    ? animated.toFixed(typeof value === "number" && !Number.isInteger(value) ? 1 : 0)
    : value;

  const valueColor =
    trend === "up" ? "#10B981" :
    trend === "down" ? "#EF4444" :
    "hsl(var(--foreground))";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: EASE_OUT, delay: delay / 1000 }}
      whileHover={{ y: -4, transition: HOVER_TRANSITION }}
      className={cn("group relative rounded-[18px] p-5", className)}
      style={{
        background: "hsl(var(--card))",
        border: "1px solid var(--hairline)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-medium text-muted-foreground">{title}</p>
          <p
            className="ticker-value mt-2 text-[26px] font-semibold leading-none tracking-tight"
            style={{ color: valueColor }}
          >
            {displayValue}
          </p>
          {subtitle && (
            <p className="mt-2 truncate text-[11.5px] leading-relaxed text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {icon && (
          <motion.div
            whileHover={{ rotate: -6, scale: 1.06 }}
            transition={{ duration: 0.26, ease: EASE_OUT }}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px]"
            style={{ background: colors.bg, color: colors.text }}
          >
            {icon}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

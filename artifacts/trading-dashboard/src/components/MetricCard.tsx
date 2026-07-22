import { ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

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

function useCountUp(target: number, duration = 800, delay = 0) {
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

const ACCENT_COLORS: Record<string, { border: string; glow: string; text: string; bg: string }> = {
  purple: { border: "rgba(139,92,246,0.4)", glow: "0 0 30px rgba(139,92,246,0.2)", text: "#8B5CF6", bg: "rgba(139,92,246,0.08)" },
  cyan: { border: "rgba(6,182,212,0.4)", glow: "0 0 30px rgba(6,182,212,0.2)", text: "#06B6D4", bg: "rgba(6,182,212,0.08)" },
  green: { border: "rgba(16,240,135,0.4)", glow: "0 0 30px rgba(16,240,135,0.2)", text: "#10F087", bg: "rgba(16,240,135,0.08)" },
  red: { border: "rgba(255,71,87,0.4)", glow: "0 0 30px rgba(255,71,87,0.2)", text: "#FF4757", bg: "rgba(255,71,87,0.08)" },
  amber: { border: "rgba(255,211,45,0.35)", glow: "0 0 25px rgba(255,211,45,0.15)", text: "#FFD32D", bg: "rgba(255,211,45,0.07)" },
  pink: { border: "rgba(244,114,182,0.4)", glow: "0 0 30px rgba(244,114,182,0.2)", text: "#F472B6", bg: "rgba(244,114,182,0.08)" },
};

export function MetricCard({ title, value, subtitle, icon, trend, className, accentColor = "purple", delay = 0 }: MetricCardProps) {
  const colors = ACCENT_COLORS[accentColor] || ACCENT_COLORS.purple;

  const isNumeric = typeof value === "number" && !isNaN(value);
  const animated = useCountUp(isNumeric ? value as number : 0, 900, delay);
  const displayValue = isNumeric ? animated.toFixed(typeof value === "number" && !Number.isInteger(value) ? 1 : 0) : value;

  const trendTextColor =
    trend === "up" ? "#10F087" :
    trend === "down" ? "#FF4757" :
    colors.text;

  return (
    <div
      className={cn("relative overflow-hidden rounded-xl p-4 animate-slide-up", className)}
      style={{
        background: "hsl(var(--card) / 75%)",
        backdropFilter: "blur(16px)",
        border: `1px solid ${colors.border}`,
        boxShadow: colors.glow,
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Subtle background glow */}
      <div className="absolute inset-0 opacity-40 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 80% 20%, ${colors.bg} 0%, transparent 70%)` }} />

      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-foreground/85">{title}</p>
          <p className="mt-1.5 text-2xl font-black ticker-value" style={{ color: trendTextColor, textShadow: trend === "up" ? "0 0 20px rgba(16,240,135,0.4)" : trend === "down" ? "0 0 20px rgba(255,71,87,0.4)" : `0 0 15px ${colors.text}60` }}>
            {displayValue}
          </p>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground/80">{subtitle}</p>}
        </div>
        {icon && (
          <div className="flex-shrink-0 rounded-lg p-2" style={{ background: colors.bg, color: colors.text }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

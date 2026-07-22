import { ReactNode, useRef } from "react";
import { cn } from "@/lib/utils";
import { DownloadChartButton } from "./charts/DownloadChartButton";

interface SectionCardProps {
  title: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
  accentColor?: string;
  downloadable?: boolean;
}

const COLORS: Record<string, string> = {
  purple: "#8B5CF6",
  cyan: "#06B6D4",
  green: "#10F087",
  amber: "#FFD32D",
};

export function SectionCard({ title, children, className, action, accentColor = "purple", downloadable = true }: SectionCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const color = COLORS[accentColor] || COLORS.purple;
  return (
    <div
      ref={cardRef}
      className={cn("rounded-xl overflow-hidden chart-export-container relative", className)}
      style={{
        background: "hsl(var(--card) / 75%)",
        backdropFilter: "blur(16px)",
        border: `1px solid rgba(${accentColor === "purple" ? "139,92,246" : accentColor === "cyan" ? "6,182,212" : accentColor === "green" ? "16,240,135" : "255,211,45"},0.15)`,
      }}
    >
      <div className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: `1px solid rgba(${accentColor === "purple" ? "139,92,246" : accentColor === "cyan" ? "6,182,212" : accentColor === "green" ? "16,240,135" : "255,211,45"},0.12)` }}>
        <div className="flex items-center gap-2.5">
          <div className="h-4 w-0.5 rounded-full" style={{ background: `linear-gradient(180deg, ${color}, transparent)`, boxShadow: `0 0 8px ${color}80` }} />
          <h3 className="text-sm font-bold text-foreground/90">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {action}
          {downloadable && <DownloadChartButton targetRef={cardRef} title={title} variant="icon" />}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}


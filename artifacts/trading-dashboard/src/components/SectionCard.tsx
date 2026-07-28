import { ReactNode, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DownloadChartButton } from "./charts/DownloadChartButton";
import { EASE_OUT } from "@/lib/motion";

interface SectionCardProps {
  title: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
  accentColor?: string;
  downloadable?: boolean;
}

/**
 * The workhorse container. Neutral border, generous and *equal* padding,
 * a single hairline under the header. Charts get the room; the frame recedes.
 */
export function SectionCard({ title, children, className, action, downloadable = true }: SectionCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, ease: EASE_OUT }}
      className={cn("chart-export-container relative overflow-hidden rounded-[18px]", className)}
      style={{
        background: "hsl(var(--card))",
        border: "1px solid var(--hairline)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        className="flex items-center justify-between gap-4 px-6 py-4"
        style={{ borderBottom: "1px solid var(--hairline)" }}
      >
        <h3 className="truncate text-[14px] font-semibold tracking-tight text-foreground">{title}</h3>
        <div className="flex flex-shrink-0 items-center gap-2">
          {action}
          {downloadable && <DownloadChartButton targetRef={cardRef} title={title} variant="icon" />}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  );
}

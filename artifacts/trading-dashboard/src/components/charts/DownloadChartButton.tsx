import React, { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DownloadChartButtonProps {
  /**
   * Ref of the DOM node containing the chart to capture.
   * If not provided, it will capture its closest parent `.chart-export-container` or `div`.
   */
  targetRef?: React.RefObject<HTMLElement | null>;
  /**
   * Title used for the downloaded filename.
   */
  title?: string;
  /**
   * Optional custom button label or compact icon-only mode.
   */
  variant?: "icon" | "button" | "subtle";
  className?: string;
}

export function DownloadChartButton({
  targetRef,
  title = "chart",
  variant = "subtle",
  className = "",
}: DownloadChartButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Find target element
    let element: HTMLElement | null = targetRef?.current || null;
    if (!element) {
      const btn = e.currentTarget as HTMLElement;
      element = btn.closest(".chart-export-container") as HTMLElement || btn.closest("section") as HTMLElement || btn.parentElement as HTMLElement;
    }

    if (!element) {
      toast.error("Chart element not found for export");
      return;
    }

    setIsExporting(true);

    try {
      // Dynamic import to prevent top-level module load issues
      const html2canvasModule = await import("html2canvas");
      const html2canvas = html2canvasModule.default || html2canvasModule;

      // Small delay to allow any pending renders/animations to settle
      await new Promise((res) => setTimeout(res, 100));

      // Get background color or default
      const computedStyle = window.getComputedStyle(element);
      const bg = computedStyle.backgroundColor !== "rgba(0, 0, 0, 0)" && computedStyle.backgroundColor !== "transparent"
        ? computedStyle.backgroundColor
        : "#0b0f19";

      const canvas = await html2canvas(element, {
        backgroundColor: bg,
        scale: 2, // 2x resolution for retina sharpness
        useCORS: true,
        logging: false,
        allowTaint: true,
        ignoreElements: (el: Element) => {
          // Ignore download buttons inside the export
          return el.classList.contains("no-export");
        }
      });

      const dataUrl = canvas.toDataURL("image/png");
      const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "chart"}-${new Date().toISOString().slice(0, 10)}.png`;

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported ${title} as image`);
    } catch (err) {
      console.error("Failed to capture chart image", err);
      toast.error("Failed to download chart image");
    } finally {
      setIsExporting(false);
    }
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleDownload}
        disabled={isExporting}
        title="Download Chart as PNG"
        className={`no-export p-1.5 rounded-lg border border-border/20 bg-background/50 text-muted-foreground hover:text-foreground hover:bg-background hover:border-purple-500/40 transition-all cursor-pointer flex items-center justify-center ${className}`}
      >
        {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-400" /> : <Download className="h-3.5 w-3.5" />}
      </button>
    );
  }

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={handleDownload}
        disabled={isExporting}
        className={`no-export inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 hover:border-purple-500/50 transition-all cursor-pointer ${className}`}
      >
        {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-400" /> : <Download className="h-3.5 w-3.5 text-purple-400" />}
        <span>{isExporting ? "Exporting..." : "Download Chart"}</span>
      </button>
    );
  }

  // default subtle mode
  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isExporting}
      title="Download Chart"
      className={`no-export inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md border border-border/15 bg-background/40 text-muted-foreground hover:text-foreground hover:bg-card hover:border-purple-500/30 transition-all cursor-pointer ${className}`}
    >
      {isExporting ? <Loader2 className="h-3 w-3 animate-spin text-purple-400" /> : <Download className="h-3 w-3 text-purple-400" />}
      <span>{isExporting ? "Saving..." : "Download Chart"}</span>
    </button>
  );
}

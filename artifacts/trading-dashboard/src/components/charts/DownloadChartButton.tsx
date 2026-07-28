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
        : "#141A24";

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
        className={`no-export flex h-7 w-7 cursor-pointer items-center justify-center rounded-[9px] border border-[color:var(--hairline)] text-muted-foreground transition-all hover:bg-[var(--surface-hover)] hover:text-foreground ${className}`}
      >
        {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" strokeWidth={1.75} />}
      </button>
    );
  }

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={handleDownload}
        disabled={isExporting}
        className={`no-export inline-flex cursor-pointer items-center gap-2 rounded-[10px] border border-[color:var(--hairline)] px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition-all hover:bg-[var(--surface-hover)] hover:text-foreground ${className}`}
      >
        {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" strokeWidth={1.75} />}
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
      className={`no-export inline-flex cursor-pointer items-center gap-1.5 rounded-[9px] border border-[color:var(--hairline)] px-2.5 py-1 text-[11.5px] font-medium text-muted-foreground transition-all hover:bg-[var(--surface-hover)] hover:text-foreground ${className}`}
    >
      {isExporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" strokeWidth={1.75} />}
      <span>{isExporting ? "Saving..." : "Download Chart"}</span>
    </button>
  );
}

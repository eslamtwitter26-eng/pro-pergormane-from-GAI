import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Language } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { EASE_OUT } from "@/lib/motion";

interface FileUploadProps {
  onFileLoaded: (file: File) => void;
  lang: Language;
  isAnalyzing: boolean;
}

/** Three-line skeleton shown while the workbook is parsed. */
function ParsingSkeleton() {
  return (
    <div className="w-full space-y-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="skeleton-shimmer h-3 rounded-full"
          style={{ width: `${[92, 74, 58][i]}%`, animationDelay: `${i * 140}ms` }}
        />
      ))}
    </div>
  );
}

export function FileUpload({ onFileLoaded, lang, isAnalyzing }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext !== "xlsx" && ext !== "xls") {
        setError("Please upload an Excel file (.xlsx or .xls)");
        return;
      }
      onFileLoaded(file);
    },
    [onFileLoaded]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
        className="w-full max-w-[560px]"
      >
        {/* Heading */}
        <div className="mb-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: EASE_OUT, delay: 0.05 }}
            className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-[16px]"
            style={{
              background: "hsl(var(--card))",
              border: "1px solid var(--hairline)",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <FileSpreadsheet className="h-6 w-6 text-[color:hsl(var(--primary))]" strokeWidth={1.75} />
          </motion.div>
          <h1 className="text-[24px] font-semibold tracking-tight text-foreground">
            {t(lang, "uploadTitle")}
          </h1>
          <p className="mx-auto mt-2 max-w-[380px] text-[13.5px] leading-relaxed text-muted-foreground">
            {t(lang, "uploadSubtitle")}
          </p>
        </div>

        {/* Dropzone */}
        <motion.label
          animate={
            isDragging
              ? { scale: 1.008, y: -2 }
              : { scale: 1, y: 0 }
          }
          transition={{ duration: 0.24, ease: EASE_OUT }}
          className={cn(
            "relative flex cursor-pointer flex-col items-center justify-center rounded-[20px] px-10 py-14 text-center",
            !isDragging && !isAnalyzing && "upload-idle",
            isAnalyzing && "pointer-events-none"
          )}
          style={{
            background: "hsl(var(--card))",
            border: `1px ${isDragging ? "solid" : "dashed"} ${
              isDragging ? "rgba(59,130,246,0.55)" : "var(--hairline-strong)"
            }`,
            boxShadow: isDragging
              ? "0 0 0 4px rgba(59,130,246,0.1), var(--shadow-lg)"
              : "var(--shadow-sm)",
          }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
        >
          <input
            type="file"
            accept=".xlsx,.xls"
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={onInputChange}
            disabled={isAnalyzing}
          />

          <AnimatePresence mode="wait">
            {isAnalyzing ? (
              <motion.div
                key="parsing"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: EASE_OUT }}
                className="flex w-full max-w-[300px] flex-col items-center gap-5"
              >
                <p className="text-[14px] font-medium text-foreground">{t(lang, "analyzing")}</p>
                <ParsingSkeleton />
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: EASE_OUT }}
                className="flex flex-col items-center"
              >
                <motion.div
                  animate={isDragging ? { y: -4, scale: 1.06 } : { y: [0, -3, 0] }}
                  transition={
                    isDragging
                      ? { duration: 0.24, ease: EASE_OUT }
                      : { duration: 3.4, repeat: Infinity, ease: "easeInOut" }
                  }
                  className="mb-5 flex h-11 w-11 items-center justify-center rounded-[12px]"
                  style={{
                    background: isDragging ? "rgba(59,130,246,0.14)" : "var(--surface-hover)",
                    color: isDragging ? "#3B82F6" : "hsl(var(--muted-foreground))",
                  }}
                >
                  <Upload className="h-5 w-5" strokeWidth={1.75} />
                </motion.div>
                <p className="text-[15px] font-medium tracking-tight text-foreground">
                  {isDragging ? "Drop your file here" : t(lang, "uploadSubtitle")}
                </p>
                <p className="mt-2 text-[12.5px] text-muted-foreground">{t(lang, "uploadHint")}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.label>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: EASE_OUT }}
              className="mt-4 flex items-center gap-2.5 rounded-[12px] px-4 py-3 text-[13px]"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.22)",
                color: "#EF4444",
              }}
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" strokeWidth={1.75} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

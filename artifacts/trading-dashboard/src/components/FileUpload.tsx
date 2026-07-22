import { useCallback, useState } from "react";
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Language } from "@/lib/i18n";
import { t } from "@/lib/i18n";

interface FileUploadProps {
  onFileLoaded: (file: File) => void;
  lang: Language;
  isAnalyzing: boolean;
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
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <FileSpreadsheet className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">{t(lang, "uploadTitle")}</h1>
          <p className="mt-2 text-muted-foreground">{t(lang, "uploadSubtitle")}</p>
        </div>

        <label
          className={cn(
            "relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-200",
            isDragging
              ? "border-primary bg-primary/5 scale-[1.02]"
              : "border-border hover:border-primary/50 hover:bg-card",
            isAnalyzing && "pointer-events-none opacity-60"
          )}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
        >
          <input
            type="file"
            accept=".xlsx,.xls"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={onInputChange}
            disabled={isAnalyzing}
          />
          {isAnalyzing ? (
            <>
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              <p className="text-lg font-medium text-foreground">{t(lang, "analyzing")}</p>
            </>
          ) : (
            <>
              <Upload className={cn("mb-4 h-12 w-12 transition-colors", isDragging ? "text-primary" : "text-muted-foreground")} />
              <p className="text-lg font-semibold text-foreground">
                {isDragging ? "Drop your file here" : t(lang, "uploadSubtitle")}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{t(lang, "uploadHint")}</p>
            </>
          )}
        </label>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

import { Sun, Moon, Upload } from "lucide-react";
import type { Language } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface NavbarProps {
  lang: Language;
  setLang: (l: Language) => void;
  theme: "dark" | "light";
  setTheme: (t: "dark" | "light") => void;
  onUploadNew: () => void;
  hasData: boolean;
}

const LANGS: { code: Language; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "ar", label: "ع" },
  { code: "fr", label: "FR" },
];

export function Navbar({ lang, setLang, theme, setTheme, onUploadNew, hasData }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-xs font-bold text-primary-foreground">TA</span>
          </div>
          <span className="hidden font-bold text-foreground sm:block">{t(lang, "appTitle")}</span>
        </div>

        <div className="flex items-center gap-2">
          {hasData && (
            <button
              onClick={onUploadNew}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              <Upload className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t(lang, "uploadNew")}</span>
            </button>
          )}

          <div className="flex items-center rounded-lg border border-border bg-background p-0.5">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  lang === l.code
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {l.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </nav>
  );
}

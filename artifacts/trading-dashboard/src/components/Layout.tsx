import { ReactNode } from "react";
import { BarChart2, BookOpen, Brain, Sun, Moon, Upload, LogOut, Bot, Sliders, FileText } from "lucide-react";
import type { Language } from "@/lib/i18n";
import { t, isRTL } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type ActiveTab = "analytics" | "glossary" | "psychology" | "coach" | "simulation" | "weekly-report";

interface LayoutProps {
  lang: Language;
  setLang: (l: Language) => void;
  theme: "dark" | "light";
  setTheme: (t: "dark" | "light") => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onUploadNew: () => void;
  onLogout: () => void;
  hasData: boolean;
  children: ReactNode;
}

const LANGS: { code: Language; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "ar", label: "ع" },
  { code: "fr", label: "FR" },
];

const TABS: { key: ActiveTab; icon: typeof BarChart2; labelKey: "analyticsTab" | "glossaryTab" | "psychologyTab" | "coachTab" | "simulationTab" | "weeklyTab" }[] = [
  { key: "analytics", icon: BarChart2, labelKey: "analyticsTab" },
  { key: "glossary", icon: BookOpen, labelKey: "glossaryTab" },
  { key: "psychology", icon: Brain, labelKey: "psychologyTab" },
  { key: "coach", icon: Bot, labelKey: "coachTab" },
  { key: "simulation", icon: Sliders, labelKey: "simulationTab" },
  { key: "weekly-report", icon: FileText, labelKey: "weeklyTab" },
];

export function Layout({
  lang, setLang, theme, setTheme, activeTab, setActiveTab, onUploadNew, onLogout, hasData, children
}: LayoutProps) {
  const rtl = isRTL(lang);

  return (
    <div className={cn("flex h-screen overflow-hidden bg-background", rtl && "flex-row-reverse")}>
      {/* Left Sidebar */}
      <aside className="flex w-[72px] flex-shrink-0 flex-col items-center border-r border-border/10 py-6 justify-between"
        style={theme === "dark"
          ? { background: "#06070a" }
          : { background: "#fcfcfd" }}>

        {/* Logo */}
        <div className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 hover:scale-105"
          style={{ 
            background: "linear-gradient(135deg, #8B5CF6, #06B6D4)", 
            boxShadow: "0 0 20px rgba(139, 92, 246, 0.3)",
            border: "1px solid rgba(255, 255, 255, 0.05)" 
          }}>
          <span className="text-xs font-black text-white tracking-wider">EG</span>
        </div>

        {/* Tabs */}
        <nav className="flex flex-col items-center gap-2 w-full px-2">
          {TABS.map(({ key, icon: Icon, labelKey }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn("sidebar-tab", activeTab === key && "active")}
              title={t(lang, labelKey)}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[9px] mt-1 font-semibold tracking-wide">{t(lang, labelKey).split(" ")[0]}</span>
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-2 w-full flex justify-center">
          <button
            onClick={onLogout}
            className="rounded-xl p-2.5 transition-all text-red-500/50 hover:text-red-500 hover:bg-red-500/5"
            title={t(lang, "logout")}
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border/10 px-8 py-3.5"
          style={theme === "dark"
            ? { background: "rgba(6, 7, 10, 0.8)", backdropFilter: "blur(24px)" }
            : { background: "rgba(252, 252, 253, 0.8)", backdropFilter: "blur(24px)" }}>
          <div>
            <h1 className="font-extrabold text-[10px] uppercase tracking-widest text-muted-foreground/60">{t(lang, "appTitle")}</h1>
            <p className="text-lg font-black text-foreground mt-0.5 tracking-tight flex items-center gap-2">
              {activeTab === "analytics" ? t(lang, "analyticsTab") :
               activeTab === "glossary" ? t(lang, "glossaryTab") :
               activeTab === "psychology" ? t(lang, "psychologyTab") :
               activeTab === "coach" ? t(lang, "coachTab") :
               activeTab === "simulation" ? t(lang, "simulationTab") :
               t(lang, "weeklyTab")}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Language switcher */}
            <div className="flex items-center gap-1 rounded-lg bg-border/5 p-1 border border-border/10">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[10px] font-black transition-all",
                    lang === l.code 
                      ? "bg-purple-500/15 text-purple-400 border border-purple-500/20 shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {/* Theme selector */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-lg border border-border/10 p-2 text-muted-foreground hover:text-foreground hover:bg-border/5 transition-all"
              title={theme === "dark" ? t(lang, "lightMode") : t(lang, "darkMode")}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Import Button */}
            {hasData && (
              <button
                onClick={onUploadNew}
                className="flex items-center gap-1.5 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-extrabold text-xs px-3.5 py-2 shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Import CSV/Excel</span>
              </button>
            )}

            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"
                style={{ boxShadow: "0 0 8px rgba(16, 240, 135, 0.8)" }} />
              <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">{t(lang, "liveAnalysis")}</span>
            </div>
          </div>
        </header>

        <div className="max-w-[1550px] mx-auto w-full px-8 py-8 md:space-y-8 space-y-6">{children}</div>
      </main>
    </div>
  );
}

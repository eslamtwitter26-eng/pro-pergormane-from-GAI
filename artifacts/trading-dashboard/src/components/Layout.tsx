import { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart2, BookOpen, Brain, Sun, Moon, Upload, LogOut, Bot, Sliders, FileText } from "lucide-react";
import type { Language } from "@/lib/i18n";
import { t, isRTL } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { EASE_OUT, buttonHover } from "@/lib/motion";

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

const RAIL_COLLAPSED = 68;
const RAIL_EXPANDED = 232;

/** Label that slides in as the rail expands. */
function RailLabel({ show, children }: { show: boolean; children: ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.span
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -6 }}
          transition={{ duration: 0.18, ease: EASE_OUT }}
          className="truncate"
        >
          {children}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

export function Layout({
  lang, setLang, theme, setTheme, activeTab, setActiveTab, onUploadNew, onLogout, hasData, children
}: LayoutProps) {
  const rtl = isRTL(lang);
  const [expanded, setExpanded] = useState(false);

  const pageTitle =
    activeTab === "analytics" ? t(lang, "analyticsTab") :
    activeTab === "glossary" ? t(lang, "glossaryTab") :
    activeTab === "psychology" ? t(lang, "psychologyTab") :
    activeTab === "coach" ? t(lang, "coachTab") :
    activeTab === "simulation" ? t(lang, "simulationTab") :
    t(lang, "weeklyTab");

  return (
    <div className={cn("flex h-screen overflow-hidden bg-background", rtl && "flex-row-reverse")}>
      {/* ── Navigation rail — collapsed by default, expands on hover ── */}
      <motion.aside
        initial={false}
        animate={{ width: expanded ? RAIL_EXPANDED : RAIL_COLLAPSED }}
        transition={{ duration: 0.28, ease: EASE_OUT }}
        onHoverStart={() => setExpanded(true)}
        onHoverEnd={() => setExpanded(false)}
        className={cn(
          "relative z-50 flex flex-shrink-0 flex-col justify-between overflow-hidden py-5",
          rtl ? "border-l" : "border-r"
        )}
        style={{
          background: theme === "dark" ? "#0D121B" : "#FFFFFF",
          borderColor: "var(--hairline)",
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-[18px]">
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px]"
            style={{ background: "hsl(var(--primary))", boxShadow: "var(--shadow-sm)" }}
          >
            <span className="text-[11px] font-semibold tracking-tight text-white">EG</span>
          </div>
          <div className="min-w-0 overflow-hidden">
            <RailLabel show={expanded}>
              <span className="block truncate text-[13px] font-semibold tracking-tight text-foreground">
                EG-Finance
              </span>
            </RailLabel>
          </div>
        </div>

        {/* Sections */}
        <nav className="flex w-full flex-col gap-1 px-3">
          {TABS.map(({ key, icon: Icon, labelKey }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn("sidebar-tab", active && "active")}
                title={!expanded ? t(lang, labelKey) : undefined}
              >
                {/* Active marker — a quiet 2px rule, not a glow */}
                {active && (
                  <motion.span
                    layoutId="rail-active"
                    transition={{ duration: 0.28, ease: EASE_OUT }}
                    className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full"
                    style={{ background: "hsl(var(--primary))" }}
                  />
                )}
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                <RailLabel show={expanded}>{t(lang, labelKey)}</RailLabel>
              </button>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="px-3">
          <button
            onClick={onLogout}
            className="sidebar-tab hover:!text-[color:hsl(var(--destructive))]"
            title={!expanded ? t(lang, "logout") : undefined}
          >
            <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} />
            <RailLabel show={expanded}>{t(lang, "logout")}</RailLabel>
          </button>
        </div>
      </motion.aside>

      {/* ── Main column ── */}
      <main className="flex-1 overflow-y-auto">
        <header
          className="sticky top-0 z-40 flex items-center justify-between px-9 py-4"
          style={{
            background: theme === "dark" ? "rgba(11, 15, 23, 0.72)" : "rgba(248, 250, 252, 0.75)",
            backdropFilter: "saturate(180%) blur(20px)",
            WebkitBackdropFilter: "saturate(180%) blur(20px)",
            borderBottom: "1px solid var(--hairline)",
          }}
        >
          <div className="min-w-0">
            <p className="text-[11px] font-medium tracking-tight text-muted-foreground">
              {t(lang, "appTitle")}
            </p>
            <AnimatePresence mode="wait">
              <motion.h1
                key={activeTab}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: EASE_OUT }}
                className="mt-0.5 truncate text-[19px] font-semibold tracking-tight text-foreground"
              >
                {pageTitle}
              </motion.h1>
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-3">
            {/* Language */}
            <div
              className="flex items-center gap-0.5 rounded-[10px] p-0.5"
              style={{ background: "var(--surface-hover)", border: "1px solid var(--hairline)" }}
            >
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={cn(
                    "rounded-[7px] px-2.5 py-1 text-[11px] font-medium",
                    lang === l.code
                      ? "bg-[color:hsl(var(--card))] text-foreground shadow-[var(--shadow-xs)]"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {/* Appearance */}
            <motion.button
              {...buttonHover}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-[10px] p-2 text-muted-foreground hover:bg-[var(--surface-hover)] hover:text-foreground"
              style={{ border: "1px solid var(--hairline)" }}
              title={theme === "dark" ? t(lang, "lightMode") : t(lang, "darkMode")}
            >
              {theme === "dark"
                ? <Sun className="h-4 w-4" strokeWidth={1.75} />
                : <Moon className="h-4 w-4" strokeWidth={1.75} />}
            </motion.button>

            {/* Import */}
            {hasData && (
              <motion.button
                {...buttonHover}
                onClick={onUploadNew}
                className="flex items-center gap-2 rounded-[10px] px-3.5 py-2 text-[12px] font-medium text-white"
                style={{ background: "hsl(var(--primary))", boxShadow: "var(--shadow-sm)" }}
              >
                <Upload className="h-3.5 w-3.5" strokeWidth={2} />
                <span>Import CSV/Excel</span>
              </motion.button>
            )}

            {/* Status */}
            <div
              className="flex items-center gap-2 rounded-full px-3 py-1.5"
              style={{ border: "1px solid var(--hairline)" }}
            >
              <motion.span
                animate={{ opacity: [0.45, 1, 0.45] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "#10B981" }}
              />
              <span className="text-[11px] font-medium text-muted-foreground">
                {t(lang, "liveAnalysis")}
              </span>
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1520px] px-9 py-9">{children}</div>
      </main>
    </div>
  );
}

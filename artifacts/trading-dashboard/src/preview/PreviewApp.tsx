/**
 * UI preview shell.
 *
 * Renders the real `Layout` and the real page components against demo data,
 * skipping only the email gate and the file upload (which need network access
 * and a MetaTrader export respectively). Application code is imported, never
 * duplicated — what you see here is the shipping interface.
 */
import { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Layout, type ActiveTab } from "@/components/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { Glossary } from "@/pages/Glossary";
import { Psychology } from "@/pages/Psychology";
import { AICoach } from "@/pages/AICoach";
import { WhatIfSimulation } from "@/pages/WhatIfSimulation";
import { WeeklyReport } from "@/pages/WeeklyReport";
import { FileUpload } from "@/components/FileUpload";
import { LoginPage } from "@/pages/LoginPage";
import { useI18n } from "@/components/I18nProvider";
import { buildDemoAnalysis } from "./demoData";
import { pageVariants } from "@/lib/motion";
import { Toaster } from "sonner";
import { X } from "lucide-react";

type Screen = "app" | "upload" | "login";

const SCREENS: { id: Screen; label: string }[] = [
  { id: "app", label: "Dashboard" },
  { id: "upload", label: "Upload" },
  { id: "login", label: "Sign in" },
];

/** Floating switcher so the other two screens are reachable in a static file. */
function ScreenSwitcher({
  screen, setScreen, theme, setTheme,
}: {
  screen: Screen;
  setScreen: (s: Screen) => void;
  theme: "dark" | "light";
  setTheme: (t: "dark" | "light") => void;
}) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
      className="fixed bottom-6 left-1/2 z-[999] flex -translate-x-1/2 items-center gap-1 rounded-[14px] p-1.5"
      style={{
        background: theme === "dark" ? "rgba(20,26,36,0.92)" : "rgba(255,255,255,0.92)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        border: "1px solid var(--hairline)",
        boxShadow: "var(--shadow-xl)",
      }}
    >
      <span className="px-2.5 text-[11px] font-medium text-muted-foreground">Preview</span>
      {SCREENS.map((s) => (
        <button
          key={s.id}
          onClick={() => setScreen(s.id)}
          className={`rounded-[9px] px-3 py-1.5 text-[12px] font-medium transition-colors ${
            screen === s.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
          style={screen === s.id ? { background: "rgba(59,130,246,0.14)" } : undefined}
        >
          {s.label}
        </button>
      ))}
      <div className="mx-1 h-4 w-px" style={{ background: "var(--hairline)" }} />
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="rounded-[9px] px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground"
      >
        {theme === "dark" ? "Light" : "Dark"}
      </button>
      <button
        onClick={() => setDismissed(true)}
        title="Hide"
        className="ml-0.5 flex h-7 w-7 items-center justify-center rounded-[9px] text-muted-foreground hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" strokeWidth={1.75} />
      </button>
    </motion.div>
  );
}

export default function PreviewApp() {
  const { lang, setLang } = useI18n();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeTab, setActiveTab] = useState<ActiveTab>("analytics");
  const [screen, setScreen] = useState<Screen>("app");

  // Demo data through the real analysis pipeline.
  const data = useMemo(() => buildDemoAnalysis(), []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") { root.classList.add("dark"); root.classList.remove("light"); }
    else { root.classList.add("light"); root.classList.remove("dark"); }
  }, [theme]);

  const chrome = (
    <ScreenSwitcher screen={screen} setScreen={setScreen} theme={theme} setTheme={setTheme} />
  );

  if (screen === "login") {
    return (
      <div className="dark">
        <LoginPage onAccessGranted={() => setScreen("app")} />
        {chrome}
      </div>
    );
  }

  if (screen === "upload") {
    return (
      <div className={theme}>
        <div className="flex h-screen bg-background">
          <aside
            className="flex w-[68px] flex-shrink-0 flex-col items-center py-5"
            style={{
              background: theme === "dark" ? "#0D121B" : "#FFFFFF",
              borderRight: "1px solid var(--hairline)",
            }}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-[10px]"
              style={{ background: "hsl(var(--primary))", boxShadow: "var(--shadow-sm)" }}
            >
              <span className="text-[11px] font-semibold tracking-tight text-white">EG</span>
            </div>
          </aside>
          <main className="flex-1 overflow-y-auto">
            <FileUpload onFileLoaded={() => setScreen("app")} lang={lang} isAnalyzing={false} />
          </main>
        </div>
        {chrome}
      </div>
    );
  }

  return (
    <div className={theme}>
      <Toaster position="top-right" theme={theme} />
      <Layout
        lang={lang} setLang={setLang}
        theme={theme} setTheme={setTheme}
        activeTab={activeTab} setActiveTab={setActiveTab}
        onUploadNew={() => setScreen("upload")}
        onLogout={() => setScreen("login")}
        hasData
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="md:space-y-8 space-y-6"
          >
            {activeTab === "analytics" && <Dashboard data={data} theme={theme} />}
            {activeTab === "glossary" && <Glossary lang={lang} data={data} theme={theme} />}
            {activeTab === "psychology" && <Psychology data={data} theme={theme} />}
            {activeTab === "coach" && <AICoach data={data} theme={theme} />}
            {activeTab === "simulation" && <WhatIfSimulation data={data} lang={lang} theme={theme} />}
            {activeTab === "weekly-report" && <WeeklyReport data={data} lang={lang} theme={theme} />}
          </motion.div>
        </AnimatePresence>
      </Layout>
      {chrome}
    </div>
  );
}

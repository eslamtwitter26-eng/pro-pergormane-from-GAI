import { useState, useEffect, useCallback } from "react";
import { FileUpload } from "@/components/FileUpload";
import { Layout, type ActiveTab } from "@/components/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { Glossary } from "@/pages/Glossary";
import { Psychology } from "@/pages/Psychology";
import { LoginPage } from "@/pages/LoginPage";
import { AICoach } from "@/pages/AICoach";
import { WhatIfSimulation } from "@/pages/WhatIfSimulation";
import { WeeklyReport } from "@/pages/WeeklyReport";
import { parseMetaTraderExcel } from "@/lib/excelParser";
import { analyzeAll } from "@/lib/tradeAnalysis";
import type { AnalysisResult } from "@/lib/tradeAnalysis";
import { useI18n } from "@/components/I18nProvider";
import { Toaster } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { pageVariants, EASE_OUT } from "@/lib/motion";

type Theme = "dark" | "light";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!sessionStorage.getItem("egfx_auth");
  });
  const { lang, setLang } = useI18n();
  const [theme, setTheme] = useState<Theme>("dark");
  const [activeTab, setActiveTab] = useState<ActiveTab>("analytics");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("dark");
    root.classList.remove("light");
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") { root.classList.add("dark"); root.classList.remove("light"); }
    else { root.classList.add("light"); root.classList.remove("dark"); }
  }, [theme]);

  const handleAccessGranted = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  const handleFileLoaded = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const { trades, equityCurve } = await parseMetaTraderExcel(file);
      if (trades.length === 0) {
        setError("No trade data found in the file. Please make sure this is a MetaTrader Positions report exported as Excel (.xlsx).");
        return;
      }
      const result = analyzeAll(trades, equityCurve);
      setAnalysisResult(result);
      setActiveTab("analytics");
    } catch (e) {
      console.error(e);
      setError("Failed to parse the file. Please make sure it's a valid MetaTrader Excel export.");
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleUploadNew = useCallback(() => {
    setAnalysisResult(null);
    setError(null);
    setActiveTab("analytics");
  }, []);

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem("egfx_auth");
    setIsAuthenticated(false);
    setAnalysisResult(null);
    setError(null);
    setActiveTab("analytics");
  }, []);

  /* ── Gate: show login if not authenticated ── */
  if (!isAuthenticated) {
    return (
      <div className="dark">
        <LoginPage onAccessGranted={handleAccessGranted} />
      </div>
    );
  }

  /* ── Upload screen (authenticated but no data yet) ── */
  if (!analysisResult) {
    return (
      <div className={theme === "dark" ? "dark" : "light"}>
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
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: EASE_OUT }}
                className="mx-auto max-w-2xl px-8 pt-8"
              >
                <div
                  className="rounded-[12px] px-4 py-3 text-[13px]"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)", color: "#EF4444" }}
                >
                  {error}
                </div>
              </motion.div>
            )}
            <FileUpload onFileLoaded={handleFileLoaded} lang={lang} isAnalyzing={isAnalyzing} />
          </main>
        </div>
      </div>
    );
  }

  /* ── Main dashboard ── */
  return (
    <div className={theme === "dark" ? "dark" : "light"}>
      <Toaster position="top-right" theme={theme} />
      <Layout
        lang={lang} setLang={setLang}
        theme={theme} setTheme={setTheme}
        activeTab={activeTab} setActiveTab={setActiveTab}
        onUploadNew={handleUploadNew} onLogout={handleLogout} hasData={true}
      >
        {/* Page transition — 250ms cross-fade, identical routing/conditions. */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="md:space-y-8 space-y-6"
          >
            {activeTab === "analytics" && <Dashboard data={analysisResult} theme={theme} />}
            {activeTab === "glossary" && <Glossary lang={lang} data={analysisResult} theme={theme} />}
            {activeTab === "psychology" && <Psychology data={analysisResult} theme={theme} />}
            {activeTab === "coach" && <AICoach data={analysisResult} theme={theme} />}
            {activeTab === "simulation" && <WhatIfSimulation data={analysisResult} lang={lang} theme={theme} />}
            {activeTab === "weekly-report" && <WeeklyReport data={analysisResult} lang={lang} theme={theme} />}
          </motion.div>
        </AnimatePresence>
      </Layout>
    </div>
  );
}

export default App;

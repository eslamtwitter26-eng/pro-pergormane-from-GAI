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
          <aside className="flex w-[72px] flex-shrink-0 flex-col items-center justify-center border-r border-border/30 py-4"
            style={theme === "dark"
              ? { background: "rgba(6, 8, 22, 0.9)" }
              : { background: "rgba(255, 255, 255, 0.9)" }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)", boxShadow: "0 0 20px rgba(139, 92, 246, 0.4)" }}>
              <span className="text-xs font-black text-white">EG</span>
            </div>
          </aside>
          <main className="flex-1 overflow-y-auto">
            {error && (
              <div className="mx-auto max-w-2xl px-6 pt-6">
                <div className="rounded-xl px-4 py-3 text-sm"
                  style={{ background: "rgba(255,71,87,0.1)", border: "1px solid rgba(255,71,87,0.3)", color: "#FF4757" }}>
                  {error}
                </div>
              </div>
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
        {activeTab === "analytics" && <Dashboard data={analysisResult} theme={theme} />}
        {activeTab === "glossary" && <Glossary lang={lang} data={analysisResult} theme={theme} />}
        {activeTab === "psychology" && <Psychology data={analysisResult} theme={theme} />}
        {activeTab === "coach" && <AICoach data={analysisResult} theme={theme} />}
        {activeTab === "simulation" && <WhatIfSimulation data={analysisResult} lang={lang} theme={theme} />}
        {activeTab === "weekly-report" && <WeeklyReport data={analysisResult} lang={lang} theme={theme} />}
      </Layout>
    </div>
  );
}

export default App;

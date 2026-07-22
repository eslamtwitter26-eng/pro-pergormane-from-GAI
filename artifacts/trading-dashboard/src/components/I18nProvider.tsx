import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { type Language, t as translateFunc, isRTL as rtlCheck } from "@/lib/i18n";

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: any, variables?: Record<string, string | number>) => string;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem("egfx_lang");
    if (saved === "ar" || saved === "fr" || saved === "en") {
      return saved as Language;
    }
    return "en";
  });

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("egfx_lang", newLang);
  }, []);

  useEffect(() => {
    const dir = rtlCheck(lang) ? "rtl" : "ltr";
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback((key: any, variables?: Record<string, string | number>): string => {
    let text = translateFunc(lang, key);
    if (variables) {
      Object.entries(variables).forEach(([k, v]) => {
        text = text.replace(new RegExp(`{${k}}`, "g"), String(v));
      });
    }
    return text;
  }, [lang]);

  const isRTL = rtlCheck(lang);

  return (
    <I18nContext.Provider value={{ lang, setLang, t, isRTL }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

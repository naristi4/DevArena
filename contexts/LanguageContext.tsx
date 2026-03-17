"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { en, type Translations } from "@/locales/en";
import { es }                    from "@/locales/es";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Language = "en" | "es";

const TRANSLATIONS: Record<Language, Translations> = { en, es };

interface LanguageContextValue {
  language:    Language;
  setLanguage: (lang: Language) => void;
  t:           Translations;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const LanguageContext = createContext<LanguageContextValue>({
  language:    "en",
  setLanguage: () => {},
  t:           en,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Always start with "en" so server and client render the same HTML.
  // After hydration, read the persisted preference and update silently.
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("devarena_language");
      if (stored === "en" || stored === "es") setLanguageState(stored as Language);
    } catch {
      // localStorage unavailable (private mode, etc.)
    }
  }, []);

  function setLanguage(lang: Language) {
    setLanguageState(lang);
    try {
      localStorage.setItem("devarena_language", lang);
    } catch {
      // noop
    }
  }

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, t: TRANSLATIONS[language] }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}

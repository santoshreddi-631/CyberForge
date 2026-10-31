"use client";

import { useSyncExternalStore, useCallback } from "react";
import { LanguageCode } from "@/types";
import en from "@/messages/en.json";
import hi from "@/messages/hi.json";

export type Messages = typeof en;

const dictionaries: Record<LanguageCode, Messages> = {
  en,
  hi,
};

const STORAGE_KEY = "csm_language";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener("storage", callback);
  window.addEventListener("csm-language-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("csm-language-change", callback);
  };
}

function getSnapshot(): LanguageCode {
  if (typeof window === "undefined") {
    return "en";
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "hi") {
      return saved;
    }
  } catch {
    // Ignore localStorage errors
  }
  return "en";
}

function getServerSnapshot(): LanguageCode {
  return "en";
}

export function useLanguage() {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const switchLanguage = useCallback((newLang: LanguageCode) => {
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      document.documentElement.lang = newLang;
      window.dispatchEvent(new Event("csm-language-change"));
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  return {
    lang,
    setLanguage: switchLanguage,
    t: dictionaries[lang],
    isMounted: true,
  };
}

export default useLanguage;

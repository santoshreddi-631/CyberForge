"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { useLanguage } from "@/hooks/useLanguage";
import { Languages } from "lucide-react";

export interface LanguageSwitcherProps {
  className?: string;
  compact?: boolean;
}

export function LanguageSwitcher({ className, compact = false }: LanguageSwitcherProps) {
  const { lang, setLanguage, isMounted } = useLanguage();

  if (!isMounted) {
    return (
      <div className={cn("h-8 w-20 bg-slate-800/40 rounded-lg animate-pulse", className)} />
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border border-slate-700/80 bg-slate-900/80 p-0.5 text-xs font-medium text-slate-300",
        className
      )}
      role="group"
      aria-label="Language selection"
    >
      <Languages className="w-3.5 h-3.5 ml-2 mr-1 text-slate-400 shrink-0" aria-hidden="true" />
      <button
        type="button"
        onClick={() => setLanguage("en")}
        aria-pressed={lang === "en"}
        className={cn(
          "rounded-md px-2 py-1 transition-colors",
          lang === "en"
            ? "bg-teal-500/20 text-teal-300 font-semibold"
            : "hover:text-slate-100 hover:bg-slate-800/60"
        )}
      >
        {compact ? "EN" : "English"}
      </button>
      <button
        type="button"
        onClick={() => setLanguage("hi")}
        aria-pressed={lang === "hi"}
        className={cn(
          "rounded-md px-2 py-1 transition-colors",
          lang === "hi"
            ? "bg-teal-500/20 text-teal-300 font-semibold"
            : "hover:text-slate-100 hover:bg-slate-800/60"
        )}
      >
        {compact ? "हि" : "हिन्दी"}
      </button>
    </div>
  );
}

export default LanguageSwitcher;

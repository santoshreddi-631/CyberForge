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
  const { lang, setLanguage } = useLanguage();

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-[#E4DEFD] bg-[#F0EDFF] p-1 text-xs font-medium text-[#171638] shadow-sm",
        className
      )}
      role="group"
      aria-label="Language selection"
    >
      <Languages className="w-3.5 h-3.5 ml-2 mr-1 text-[#6035E8] shrink-0" aria-hidden="true" />
      <button
        type="button"
        onClick={() => setLanguage("en")}
        aria-pressed={lang === "en"}
        className={cn(
          "rounded-full px-2.5 py-1 transition-all duration-150 font-medium cursor-pointer",
          lang === "en"
            ? "bg-[#6035E8] text-white font-bold shadow-sm"
            : "text-[#545277] hover:text-[#171638] hover:bg-white/60"
        )}
      >
        {compact ? "EN" : "English"}
      </button>
      <button
        type="button"
        onClick={() => setLanguage("hi")}
        aria-pressed={lang === "hi"}
        className={cn(
          "rounded-full px-2.5 py-1 transition-all duration-150 font-medium cursor-pointer",
          lang === "hi"
            ? "bg-[#6035E8] text-white font-bold shadow-sm"
            : "text-[#545277] hover:text-[#171638] hover:bg-white/60"
        )}
      >
        {compact ? "हि" : "हिन्दी"}
      </button>
    </div>
  );
}

export default LanguageSwitcher;

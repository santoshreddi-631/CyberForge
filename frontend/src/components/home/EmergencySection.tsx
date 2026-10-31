"use client";

import React from "react";
import { PhoneCall, ExternalLink, ShieldAlert, Clock } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { DonutRing } from "@/components/ui/DecorativeShapes";

export function EmergencySection() {
  const { lang, t } = useLanguage();
  const isHi = lang === "hi";

  return (
    <div className="w-full px-3 sm:px-6 lg:px-8 py-8 mb-6">
      <section className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] sm:rounded-[3.5rem] bg-white border border-[#EAE6FD] p-8 sm:p-12 lg:p-16 shadow-[0_20px_60px_rgba(96,53,232,0.08)]">
        {/* Decorative Donut Accent */}
        <DonutRing
          color="yellow"
          size="md"
          className="absolute -top-10 -right-10 opacity-70 pointer-events-none"
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{isHi ? t.home.emergencyAction : "Active Financial Fraud Emergency?"}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#171638] tracking-tight leading-tight">
              {isHi ? t.home.emergencyHeadline : "Report Immediately to Official Authorities"}
            </h2>
            <p className="text-base text-[#6E6D8F] leading-relaxed font-normal">
              {isHi
                ? t.home.emergencyDesc
                : "If you have just sent money to a scammer, act quickly. Filing a complaint immediately with the National Cyber Crime Reporting Portal activates banking lien protocols to freeze unauthorized transactions."}
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#FFF8E6] border border-[#FFE699] text-xs font-bold text-[#A87B00]">
              <Clock className="w-4 h-4 shrink-0 text-[#D19B00]" />
              <span>
                {isHi
                  ? t.home.goldenHour
                  : "Golden Hour: Report within 2-3 hours of an incident for the highest fund recovery chance."}
              </span>
            </div>
          </div>

          {/* Helpline and Portal CTAs */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-4 shrink-0 w-full lg:w-auto">
            <a
              href="tel:1930"
              className="inline-flex items-center justify-center gap-3.5 px-8 py-4 rounded-full bg-[#08C9C5] hover:bg-[#06B5B1] active:bg-[#059E9A] text-[#171638] font-black text-base shadow-[0_10px_25px_rgba(8,201,197,0.35)] transition-all hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-[#08C9C5]/40"
            >
              <PhoneCall className="w-5 h-5 shrink-0" />
              <div className="text-left">
                <div className="text-[10px] uppercase font-bold text-[#171638]/80 tracking-wider">
                  {isHi ? t.home.callHelpline : "Call National Helpline"}
                </div>
                <div className="text-xl leading-tight font-black tracking-wide">1930</div>
              </div>
            </a>

            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-[#F0EDFF] hover:bg-[#6035E8] hover:text-white text-[#6035E8] font-black text-sm border-2 border-[#6035E8]/20 transition-all hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-[#6035E8]/30 shadow-sm"
            >
              <span>{isHi ? t.home.govCyberPortal : "Official Cyber Crime Portal"}</span>
              <ExternalLink className="w-4 h-4 shrink-0" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default EmergencySection;

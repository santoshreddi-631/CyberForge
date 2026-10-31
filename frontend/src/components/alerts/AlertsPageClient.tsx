"use client";

import React from "react";
import { Bell, TrendingUp, Sparkles, AlertCircle } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useLanguage } from "@/hooks/useLanguage";
import { AlertsFeedContainer } from "./AlertsFeedContainer";

export function AlertsPageClient() {
  const { lang, t } = useLanguage();
  const isHi = lang === "hi";

  return (
    <PageContainer maxWidth="narrow">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <PageHeader
        breadcrumbs={[
          { label: t.nav.home, href: "/" },
          { label: t.nav.alerts },
        ]}
        title={t.alerts.title}
        description={t.alerts.subtitle}
        badge={
          <StatusBadge
            status="high"
            label={t.alerts.badge}
            size="sm"
          />
        }
      />

      {/* ── Educational Guide on Alert Mechanics ───────────────────── */}
      <div className="mb-6 rounded-[2rem] bg-white border border-[#EAE6FD] p-6 sm:p-7 space-y-4 text-xs text-[#545277] shadow-sm">
        <div className="flex items-center gap-2.5 font-black text-[#171638] text-sm sm:text-base">
          <div className="w-8 h-8 rounded-full bg-[#6035E8]/10 text-[#6035E8] flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <span>{t.alerts.guideTitle}</span>
        </div>
        <p className="text-[#545277] leading-relaxed text-xs sm:text-sm font-medium">
          {t.alerts.guideDesc}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          <div className="p-4 rounded-2xl bg-[#FFF9EB] border border-[#FDE68A] space-y-1">
            <div className="flex items-center gap-2 font-bold text-amber-900 text-xs sm:text-sm">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <span>{t.alerts.spikeTitle}</span>
            </div>
            <p className="text-[11px] sm:text-xs text-amber-800 leading-relaxed font-medium">
              {t.alerts.spikeDesc}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#E6FAF9] border border-[#99F0ED] space-y-1">
            <div className="flex items-center gap-2 font-bold text-teal-950 text-xs sm:text-sm">
              <Sparkles className="w-4 h-4 text-[#08C9C5]" />
              <span>{t.alerts.newTypeTitle}</span>
            </div>
            <p className="text-[11px] sm:text-xs text-teal-900 leading-relaxed font-medium">
              {t.alerts.newTypeDesc}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2 pt-3 border-t border-[#EAE6FD] text-[11px] text-[#837FA8] leading-relaxed font-medium">
          <AlertCircle className="w-3.5 h-3.5 text-[#837FA8] shrink-0 mt-0.5" />
          <span>
            {isHi
              ? "अलर्ट केवल सांख्यिकीय सामुदायिक संकेत हैं और किसी व्यक्ति या व्यवसाय के विरुद्ध कानूनी दोष सिद्ध नहीं करते।"
              : "Alerts represent statistical community signals and do not constitute legal proof of guilt against any person or business in an area."}
          </span>
        </div>
      </div>

      {/* ── Main Feed Container ────────────────────────────────────── */}
      <AlertsFeedContainer />
    </PageContainer>
  );
}

export default AlertsPageClient;

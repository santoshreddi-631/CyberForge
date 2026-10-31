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
      <div className="mb-6 rounded-xl bg-slate-900/60 border border-slate-800 p-4 sm:p-5 space-y-3 text-xs text-slate-300">
        <div className="flex items-center gap-2 font-bold text-slate-100">
          <Bell className="w-4 h-4 text-teal-400" />
          <span>{t.alerts.guideTitle}</span>
        </div>
        <p className="text-slate-400 leading-relaxed text-[11px] sm:text-xs">
          {t.alerts.guideDesc}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-amber-300">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{t.alerts.spikeTitle}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {t.alerts.spikeDesc}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-teal-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.alerts.newTypeTitle}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {t.alerts.newTypeDesc}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
          <AlertCircle className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
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

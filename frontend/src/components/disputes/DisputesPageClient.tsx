"use client";

import React from "react";
import Link from "next/link";
import { Scale, CheckCircle2, AlertTriangle, Search, Map } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useLanguage } from "@/hooks/useLanguage";
import { DisputeFormContainer } from "./DisputeFormContainer";

export function DisputesPageClient() {
  const { lang, t } = useLanguage();
  const isHi = lang === "hi";

  return (
    <PageContainer maxWidth="narrow">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <PageHeader
        breadcrumbs={[
          { label: t.nav.home, href: "/" },
          { label: t.nav.disputes },
        ]}
        title={t.disputes.title}
        description={t.disputes.subtitle}
        badge={
          <StatusBadge
            status="disputed"
            label={t.disputes.badge}
            size="sm"
          />
        }
      />

      {/* ── Explanatory & Policy Guide ─────────────────────────────── */}
      <div className="mb-6 rounded-xl bg-slate-900/60 border border-slate-800 p-5 space-y-4 text-xs text-slate-300">
        <div className="flex items-center gap-2 font-bold text-slate-100">
          <Scale className="w-4 h-4 text-teal-400" />
          <span>{t.disputes.guideTitle}</span>
        </div>

        <p className="text-slate-400 leading-relaxed text-[11px] sm:text-xs">
          {t.disputes.guideDesc}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="font-semibold text-teal-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              {t.disputes.step1}
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {t.disputes.step1Desc}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="font-semibold text-amber-300 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              {t.disputes.step2}
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {t.disputes.step2Desc}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="font-semibold text-rose-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              {t.disputes.step3}
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {t.disputes.step3Desc}
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] text-slate-400">
          <span>
            {isHi
              ? "पहले देखना चाहते हैं कि जनता को आपका नंबर कैसा दिखता है?"
              : "Want to check what the public sees for your number first?"}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/lookup">
              <PrimaryButton variant="outline" size="sm" className="text-xs h-7" leftIcon={<Search className="w-3 h-3" />}>
                {isHi ? t.nav.lookup : "Check in Lookup"}
              </PrimaryButton>
            </Link>
            <Link href="/map">
              <PrimaryButton variant="ghost" size="sm" className="text-xs h-7" leftIcon={<Map className="w-3 h-3" />}>
                {isHi ? t.nav.map : "View Scam Map"}
              </PrimaryButton>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Main Dispute Form Container ────────────────────────────── */}
      <DisputeFormContainer />
    </PageContainer>
  );
}

export default DisputesPageClient;

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
      <div className="mb-6 rounded-[2rem] bg-white border border-[#EAE6FD] p-6 sm:p-7 space-y-4 text-xs text-[#545277] shadow-sm">
        <div className="flex items-center gap-2.5 font-black text-[#171638] text-sm sm:text-base">
          <div className="w-8 h-8 rounded-full bg-[#6035E8]/10 text-[#6035E8] flex items-center justify-center shrink-0">
            <Scale className="w-4 h-4" />
          </div>
          <span>{t.disputes.guideTitle}</span>
        </div>

        <p className="text-[#545277] leading-relaxed text-xs sm:text-sm font-medium">
          {t.disputes.guideDesc}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
          <div className="p-4 rounded-2xl bg-[#E6FAF9] border border-[#99F0ED] space-y-1">
            <span className="font-bold text-teal-950 flex items-center gap-1.5 text-xs sm:text-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#08C9C5]" />
              {t.disputes.step1}
            </span>
            <p className="text-[11px] text-teal-900 leading-relaxed font-medium">
              {t.disputes.step1Desc}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFF9EB] border border-[#FDE68A] space-y-1">
            <span className="font-bold text-amber-900 flex items-center gap-1.5 text-xs sm:text-sm">
              <Scale className="w-3.5 h-3.5 text-amber-600" />
              {t.disputes.step2}
            </span>
            <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
              {t.disputes.step2Desc}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-1">
            <span className="font-bold text-rose-900 flex items-center gap-1.5 text-xs sm:text-sm">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              {t.disputes.step3}
            </span>
            <p className="text-[11px] text-rose-800 leading-relaxed font-medium">
              {t.disputes.step3Desc}
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-[#EAE6FD] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] text-[#837FA8] font-medium">
          <span>
            {isHi
              ? "पहले देखना चाहते हैं कि जनता को आपका नंबर कैसा दिखता है?"
              : "Want to check what the public sees for your number first?"}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/lookup">
              <PrimaryButton variant="purple" size="sm" className="text-xs h-8" leftIcon={<Search className="w-3 h-3" />}>
                {isHi ? t.nav.lookup : "Check in Lookup"}
              </PrimaryButton>
            </Link>
            <Link href="/map">
              <PrimaryButton variant="outline" size="sm" className="text-xs h-8" leftIcon={<Map className="w-3 h-3" />}>
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

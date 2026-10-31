"use client";

import React from "react";
import { ShieldAlert } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { useLanguage } from "@/hooks/useLanguage";
import { ReportFormContainer } from "./ReportFormContainer";

export function ReportPageClient() {
  const { t } = useLanguage();

  return (
    <PageContainer maxWidth="narrow">
      {/* Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: t.nav.home, href: "/" },
          { label: t.nav.report },
        ]}
        title={t.report.title}
        description={t.report.subtitle}
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-sm">
            <ShieldAlert className="w-3.5 h-3.5" />
            {t.common.anonymous}
          </span>
        }
      />

      {/* Anti-abuse notice */}
      <div className="mb-6 p-4 rounded-2xl bg-amber-50/90 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900 shadow-sm">
        <span className="text-amber-500 font-bold text-base shrink-0 leading-none">⚠</span>
        <p className="leading-relaxed font-medium">
          {t.report.abuseNotice}
        </p>
      </div>

      {/* Main Form */}
      <ReportFormContainer />
    </PageContainer>
  );
}

export default ReportPageClient;

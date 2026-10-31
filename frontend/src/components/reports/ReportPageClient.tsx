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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/20">
            <ShieldAlert className="w-3.5 h-3.5" />
            {t.common.anonymous}
          </span>
        }
      />

      {/* Anti-abuse notice */}
      <div className="mb-6 p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/50 flex items-start gap-3 text-xs text-amber-200/80">
        <span className="text-amber-400 font-bold text-sm shrink-0 mt-0.5">⚠</span>
        <p className="leading-relaxed">
          {t.report.abuseNotice}
        </p>
      </div>

      {/* Main Form */}
      <ReportFormContainer />
    </PageContainer>
  );
}

export default ReportPageClient;

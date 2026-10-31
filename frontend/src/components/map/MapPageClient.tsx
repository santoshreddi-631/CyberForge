"use client";

import React from "react";
import { Map } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useLanguage } from "@/hooks/useLanguage";
import { ScamMapContainer } from "./ScamMapContainer";

export function MapPageClient() {
  const { t } = useLanguage();

  return (
    <PageContainer maxWidth="wide">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <PageHeader
        breadcrumbs={[
          { label: t.nav.home, href: "/" },
          { label: t.nav.map },
        ]}
        title={t.map.title}
        description={t.map.subtitle}
        badge={
          <StatusBadge
            status="under_review"
            label={t.map.badge}
            size="sm"
          />
        }
      />

      {/* ── Community Safety & Neighborhood Fair Use Disclaimer ────── */}
      <div className="mb-6 p-4 rounded-2xl bg-white border border-[#EAE6FD] text-xs text-[#545277] flex items-start gap-3.5 shadow-sm">
        <div className="p-2 rounded-xl bg-[#6035E8]/10 text-[#6035E8] shrink-0 mt-0.5">
          <Map className="w-4 h-4" />
        </div>
        <div className="space-y-1 leading-relaxed">
          <p className="font-bold text-[#171638] text-xs sm:text-sm">
            {t.map.disclaimerTitle}
          </p>
          <p className="text-[#837FA8] font-medium">
            {t.map.disclaimerDesc}
          </p>
        </div>
      </div>

      {/* ── Main Map Interface & Controls ──────────────────────────── */}
      <ScamMapContainer />
    </PageContainer>
  );
}

export default MapPageClient;

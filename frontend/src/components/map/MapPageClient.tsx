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
      <div className="mb-6 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
        <div className="p-1 rounded-md bg-teal-500/10 text-teal-400 shrink-0 mt-0.5">
          <Map className="w-4 h-4" />
        </div>
        <div className="space-y-1 leading-relaxed">
          <p className="font-semibold text-slate-200">
            {t.map.disclaimerTitle}
          </p>
          <p className="text-slate-400">
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

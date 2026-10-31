import React from "react";
import type { Metadata } from "next";
import { Map } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ScamMapContainer } from "@/components/map";

export const metadata: Metadata = {
  title: "Community Scam Map | Geospatial Cyber Fraud Trends in India",
  description:
    "Explore aggregated area-level scam trends and cyber fraud hotspots across India over the past 7 days based on community reports.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Community Scam Map | Local Cyber Fraud Activity",
    description:
      "Interactive map showing aggregated scam activity across monitored Indian localities over the last 7 days. Helps citizens identify local fraud patterns.",
    type: "website",
  },
};

export default function ScamMapPage() {
  return (
    <PageContainer maxWidth="wide">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Scam Map" },
        ]}
        title="Community Scam Map"
        description="Visualizing aggregated scam activity across areas over the past 7 days. This map helps citizens and small businesses identify emerging local scam trends to stay vigilant against fraudulent calls, messages, and links."
        badge={
          <StatusBadge
            status="under_review"
            label="7-Day Rolling Intelligence"
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
            About Community Scam Map Data
          </p>
          <p className="text-slate-400">
            Incident clusters represent aggregated reports received by our community safety network over the past seven days.
            Reports do not indicate or imply that an entire locality, neighborhood, or merchant community is fraudulent.
            Exact reporter locations, addresses, and individual identities are never exposed.
          </p>
        </div>
      </div>

      {/* ── Main Interactive Map Container ─────────────────────────── */}
      <ScamMapContainer />
    </PageContainer>
  );
}

import React from "react";
import type { Metadata } from "next";
import { Bell, TrendingUp, Sparkles, AlertCircle } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AlertsFeedContainer } from "@/components/alerts";

export const metadata: Metadata = {
  title: "Community Scam Alerts | Live Cyber Threat Feed in India",
  description:
    "Monitor community-reported scam surges (SPIKE) and newly observed fraud vectors (NEW_TYPE) across Indian localities to protect your neighborhood from emerging cyber threats.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Community Scam Alerts | Live Anomaly Signals",
    description:
      "Real-time anomaly alerts flagging unusual reporting spikes and newly detected scam categories across monitored Indian PIN codes.",
    type: "website",
  },
};

export default function AlertsPage() {
  return (
    <PageContainer maxWidth="narrow">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Threat Alerts" },
        ]}
        title="Community Scam Alerts"
        description="Alerts highlight notable shifts in community scam reports across monitored areas. They reflect localized reporting spikes and newly emerging scam categories, helping citizens stay ahead of evolving fraud campaigns."
        badge={
          <StatusBadge
            status="high"
            label="Live Threat Feed"
            size="sm"
          />
        }
      />

      {/* ── Educational Guide on Alert Mechanics ───────────────────── */}
      <div className="mb-6 rounded-xl bg-slate-900/60 border border-slate-800 p-4 sm:p-5 space-y-3 text-xs text-slate-300">
        <div className="flex items-center gap-2 font-bold text-slate-100">
          <Bell className="w-4 h-4 text-teal-400" />
          <span>Understanding Anomaly Signals</span>
        </div>
        <p className="text-slate-400 leading-relaxed text-[11px] sm:text-xs">
          To prevent alarm fatigue, alerts fire only when unusual activity is detected by our trust rules, never for routine individual reports:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-amber-300">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Volume Spike (SPIKE)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Triggered when verified reports in an area over 24 hours at least double the prior 7-day daily baseline (minimum 5 reports).
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-teal-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>New Vector (NEW_TYPE)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Triggered when a scam pattern is reported in an area that was not seen in that locality during the preceding 30 days.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
          <AlertCircle className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
          <span>
            Alerts represent statistical community signals and do not constitute legal proof of guilt against any person or business in an area.
          </span>
        </div>
      </div>

      {/* ── Main Feed Container ────────────────────────────────────── */}
      <AlertsFeedContainer />
    </PageContainer>
  );
}

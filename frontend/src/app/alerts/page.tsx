import React from "react";
import type { Metadata } from "next";
import { AlertsPageClient } from "@/components/alerts/AlertsPageClient";

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
  return <AlertsPageClient />;
}

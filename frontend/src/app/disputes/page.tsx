import React from "react";
import type { Metadata } from "next";
import { DisputesPageClient } from "@/components/disputes/DisputesPageClient";

export const metadata: Metadata = {
  title: "Business Report Dispute | ",
  description:
    "Official dispute and challenge portal for legitimate businesses, merchants, and entities to contest incorrect or malicious community scam reports.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Business Report Dispute | ",
    description:
      "If you represent a business and believe a community scam report is incorrect, submit a challenge with official credentials for review.",
    type: "website",
  },
};

export default function DisputesPage() {
  return <DisputesPageClient />;
}

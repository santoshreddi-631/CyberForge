import React from "react";
import type { Metadata } from "next";
import { MapPageClient } from "@/components/map/MapPageClient";

export const metadata: Metadata = {
  title: " | Geospatial Cyber Fraud Trends in India",
  description:
    "Explore aggregated area-level scam trends and cyber fraud hotspots across India over the past 7 days based on community reports.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: " | Local Cyber Fraud Activity",
    description:
      "Interactive map showing aggregated scam activity across monitored Indian localities over the last 7 days. Helps citizens identify local fraud patterns.",
    type: "website",
  },
};

export default function ScamMapPage() {
  return <MapPageClient />;
}

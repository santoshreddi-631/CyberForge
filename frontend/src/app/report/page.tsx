import React from "react";
import type { Metadata } from "next";
import { ReportPageClient } from "@/components/reports/ReportPageClient";

export const metadata: Metadata = {
  title: "Report a Scam | Community Scam Map",
  description:
    "Report a suspicious phone number, UPI ID, website link, or SMS sender to help protect your community from online fraud and scams in India.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Report a Scam | Community Scam Map",
    description:
      "Submit a scam report to protect your community. Reports are reviewed and added to the Community Scam Map intelligence network.",
    type: "website",
  },
};

export default function ReportPage() {
  return <ReportPageClient />;
}

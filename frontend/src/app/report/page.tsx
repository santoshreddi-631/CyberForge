import React from "react";
import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { ReportFormContainer } from "@/components/reports";

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
  return (
    <PageContainer maxWidth="narrow">
      {/* Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Report a Scam" },
        ]}
        title="Report a Scam"
        description="Submit a suspicious phone number, UPI ID, website, or SMS sender ID to help protect thousands of people across India."
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/20">
            <ShieldAlert className="w-3.5 h-3.5" />
            Anonymous
          </span>
        }
      />

      {/* Anti-abuse notice */}
      <div className="mb-6 p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/50 flex items-start gap-3 text-xs text-amber-200/80">
        <span className="text-amber-400 font-bold text-sm shrink-0 mt-0.5">⚠</span>
        <p className="leading-relaxed">
          This form is for reporting suspected fraud only. Misuse, spam, or false reports may result in restricted access.
          All submissions are reviewed before being made public.
        </p>
      </div>

      {/* Main Form */}
      <ReportFormContainer />
    </PageContainer>
  );
}

import { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const metadata: Metadata = {
  title: "Report Fraud | Community Scam Map",
  description: "Report an incident of cyber fraud, UPI scam, phishing call, or financial fraud to alert the community.",
};

export default function ReportPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Report Cyber Fraud"
        description="Help protect fellow citizens by submitting incident details, UPI handles, and suspect phone numbers."
        badge={<StatusBadge status="under_review" label="Reporting Queue Ready" />}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Report Fraud" },
        ]}
      />
      <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center text-slate-400">
        <p className="text-sm">Fraud reporting workflow foundation prepared for Phase 2 implementation.</p>
      </div>
    </PageContainer>
  );
}

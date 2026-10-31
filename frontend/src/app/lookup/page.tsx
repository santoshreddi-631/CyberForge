import { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const metadata: Metadata = {
  title: "Check Scam | Community Scam Map",
  description: "Verify Indian phone numbers, UPI IDs, bank accounts, and links against community fraud records.",
};

export default function LookupPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Check Fraud & Scam Records"
        description="Search suspect phone numbers, UPI IDs, bank accounts, or suspicious links before transferring funds."
        badge={<StatusBadge status="cleared" label="Database Active" />}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Check Scam" },
        ]}
      />
      <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center text-slate-400">
        <p className="text-sm">Lookup interface foundation prepared for Phase 2 implementation.</p>
      </div>
    </PageContainer>
  );
}

import { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const metadata: Metadata = {
  title: "Business Disputes | Community Scam Map",
  description: "Official portal for legitimate businesses, merchants, and entities to contest or rectify false fraud flags.",
};

export default function DisputesPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Business Dispute & Rectification Portal"
        description="Legitimate businesses can verify their credentials (GSTIN / PAN / Certificate of Incorporation) to contest mistaken reports."
        badge={<StatusBadge status="disputed" label="Dispute Desk" />}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Business Disputes" },
        ]}
      />
      <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center text-slate-400">
        <p className="text-sm">Business dispute resolution workflow foundation prepared for Phase 2 implementation.</p>
      </div>
    </PageContainer>
  );
}

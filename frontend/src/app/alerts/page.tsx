import { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const metadata: Metadata = {
  title: "Live Alerts | Community Scam Map",
  description: "Real-time threat alerts on trending cyber scams, fake APKs, and active phishing campaigns in India.",
};

export default function AlertsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Live Threat Alerts"
        description="High-priority notices and trending scam patterns detected across citizen reports."
        badge={<StatusBadge status="high" label="Threat Feed Active" />}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Alerts" },
        ]}
      />
      <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center text-slate-400">
        <p className="text-sm">Threat alerts feed foundation prepared for Phase 2 implementation.</p>
      </div>
    </PageContainer>
  );
}

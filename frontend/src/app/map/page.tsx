import { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const metadata: Metadata = {
  title: "Scam Map | Community Scam Map",
  description: "Interactive geospatial visualization of cyber fraud clusters across Indian states and districts.",
};

export default function MapPage() {
  return (
    <PageContainer maxWidth="wide">
      <PageHeader
        title="Live Scam Map"
        description="Geographic distribution of reported cyber fraud incidents across Indian states and union territories."
        badge={<StatusBadge status="cleared" label="GIS Engine Initialized" />}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Scam Map" },
        ]}
      />
      <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center text-slate-400">
        <p className="text-sm">Geospatial map foundation prepared for Phase 2 integration.</p>
      </div>
    </PageContainer>
  );
}

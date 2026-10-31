import React, { Suspense } from "react";
import { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { LookupClientContainer } from "@/components/lookup/LookupClientContainer";

export const metadata: Metadata = {
  title: "Check Before You Trust | Community Scam Map",
  description:
    "Check suspicious numbers, payment IDs and links before interacting or making a payment.",
};

export default function LookupPage() {
  return (
    <PageContainer maxWidth="default">
      <PageHeader
        title="Check Before You Trust"
        description="Check suspicious numbers, payment IDs and links before interacting or making a payment."
        badge={<StatusBadge status="cleared" label="Verification Engine Active" />}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Check an Identifier" },
        ]}
      />

      {/* Client container wrapped in Suspense boundary for useSearchParams compatibility */}
      <Suspense
        fallback={
          <div className="w-full max-w-4xl mx-auto space-y-6 pt-4">
            <LoadingSkeleton variant="card" count={1} className="h-44" />
            <LoadingSkeleton variant="row" count={2} />
          </div>
        }
      >
        <LookupClientContainer />
      </Suspense>
    </PageContainer>
  );
}

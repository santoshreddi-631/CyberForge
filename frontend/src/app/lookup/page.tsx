import React, { Suspense } from "react";
import { Metadata } from "next";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { LookupPageClient } from "@/components/lookup/LookupPageClient";

export const metadata: Metadata = {
  title: "Check Before You Trust | Community Scam Map",
  description:
    "Check suspicious numbers, payment IDs and links before interacting or making a payment.",
};

export default function LookupPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-4xl mx-auto space-y-6 pt-4">
          <LoadingSkeleton variant="card" count={1} className="h-44" />
          <LoadingSkeleton variant="row" count={2} />
        </div>
      }
    >
      <LookupPageClient />
    </Suspense>
  );
}

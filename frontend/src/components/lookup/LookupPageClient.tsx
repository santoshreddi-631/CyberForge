"use client";

import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useLanguage } from "@/hooks/useLanguage";
import { LookupClientContainer } from "./LookupClientContainer";

export function LookupPageClient() {
  const { t } = useLanguage();

  return (
    <PageContainer maxWidth="default">
      <PageHeader
        title={t.lookup.title}
        description={t.lookup.subtitle}
        badge={<StatusBadge status="cleared" label={t.lookup.badge} />}
        breadcrumbs={[
          { label: t.nav.home, href: "/" },
          { label: t.lookup.breadcrumb },
        ]}
      />
      <LookupClientContainer />
    </PageContainer>
  );
}

export default LookupPageClient;

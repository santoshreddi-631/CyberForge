"use client";

import React from "react";
import Link from "next/link";
import {
  TrendingUp,
  Sparkles,
  MapPin,
  Clock,
  Search,
  Map,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react";
import { AlertItemContract } from "@/lib/contracts";
import { MONITORED_AREAS, getScamTypeLabel } from "@/lib/constants/reportOptions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useLanguage } from "@/hooks/useLanguage";

interface AlertCardProps {
  alert: AlertItemContract;
  className?: string;
}

export function AlertCard({ alert, className = "" }: AlertCardProps) {
  const { lang, t } = useLanguage();
  const isHi = lang === "hi";

  const isSpike = alert.type?.toUpperCase() === "SPIKE";
  const isNewType = alert.type?.toUpperCase() === "NEW_TYPE";

  // Resolve area details if not explicitly in alert payload
  const areaInfo = React.useMemo(() => {
    if (alert.locality && alert.city) {
      return { locality: alert.locality, city: alert.city };
    }
    const matched = MONITORED_AREAS.find((a) => a.code === alert.pincode);
    if (matched) {
      return { locality: matched.area, city: matched.city };
    }
    return { locality: `PIN ${alert.pincode}`, city: isHi ? "निगरानी क्षेत्र" : "Monitored Area" };
  }, [alert, isHi]);

  const scamLabel = alert.scam_type ? getScamTypeLabel(alert.scam_type) : null;

  return (
    <article
      className={`rounded-[2rem] border transition-all p-6 sm:p-7 shadow-lg shadow-[#6035E8]/5 bg-white text-[#171638] ${
        isSpike
          ? "border-amber-200/90 hover:border-amber-300"
          : isNewType
          ? "border-[#99F0ED] hover:border-[#08C9C5]"
          : "border-[#EAE6FD] hover:border-[#6035E8]/40"
      } ${className}`}
      aria-labelledby={`alert-title-${alert.pincode}-${alert.type}`}
    >
      {/* ── Top Bar: Type Badge, Area, & Timestamp ────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-4 border-b border-[#EAE6FD]">
        <div className="flex items-center gap-2">
          {isSpike ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#FFF9EB] text-amber-800 border border-[#FDE68A]">
              <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
              {isHi ? "रिपोर्ट में उछाल (SPIKE)" : "Volume Surge (SPIKE)"}
            </span>
          ) : isNewType ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#E6FAF9] text-teal-900 border border-[#99F0ED]">
              <Sparkles className="w-3.5 h-3.5 text-[#08C9C5]" />
              {isHi ? "नया फ्रॉड वेक्टर (NEW_TYPE)" : "New Vector (NEW_TYPE)"}
            </span>
          ) : (
            <StatusBadge status="high" label={alert.type} size="sm" />
          )}

          {alert.window && (
            <span className="text-[11px] font-mono font-bold text-[#545277] px-2.5 py-1 rounded-full bg-[#F6F4FE] border border-[#EAE6FD]">
              {isHi ? "अवधि:" : "Window:"} {alert.window}
            </span>
          )}
        </div>

        {/* Timestamp if provided by the API */}
        {(alert.timestamp || alert.created_at) && (
          <div className="flex items-center gap-1.5 text-xs text-[#837FA8] font-medium">
            <Clock className="w-3.5 h-3.5 text-[#837FA8]" />
            <time dateTime={alert.timestamp || alert.created_at}>
              {new Date(alert.timestamp || alert.created_at || "").toLocaleString(isHi ? "hi-IN" : "en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </time>
          </div>
        )}
      </div>

      {/* ── Body: Alert Details ────────────────────────────────────── */}
      <div className="py-4 space-y-3">
        {/* Title & Area */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#545277] font-medium">
            <MapPin className="w-3.5 h-3.5 text-[#6035E8] shrink-0" />
            <span>
              {areaInfo.locality}, {areaInfo.city} • PIN:{" "}
              <strong className="font-mono text-[#171638] font-bold">{alert.pincode}</strong>
            </span>
          </div>

          <h3
            id={`alert-title-${alert.pincode}-${alert.type}`}
            className="text-base sm:text-lg font-black text-[#171638] tracking-tight"
          >
            {isSpike
              ? (isHi
                  ? `${areaInfo.locality} में रिपोर्ट में भारी उछाल दर्ज`
                  : `Report Surge Detected in ${areaInfo.locality}`)
              : isNewType
              ? (isHi
                  ? `नया स्कैम पैटर्न रिपोर्ट हुआ: ${scamLabel || "अवर्गीकृत"}`
                  : `New Scam Pattern Reported: ${scamLabel || "Unclassified Type"}`)
              : alert.title || `Scam Alert for PIN ${alert.pincode}`}
          </h3>
        </div>

        {/* Explanatory Narrative based on strict API Contract meaning */}
        <p className="text-xs sm:text-sm text-[#545277] leading-relaxed font-medium">
          {isSpike ? (
            <>
              {isHi ? (
                <>
                  पिछले <strong className="text-[#171638]">{alert.window || "24 घंटों"}</strong> में इस क्षेत्र में समुदाय रिपोर्टों में उल्लेखनीय वृद्धि देखी गई है।
                  {alert.count !== undefined && (
                    <>
                      {" "}सिस्टम ने{" "}
                      <strong className="text-amber-700 font-mono font-bold">
                        {alert.count} रिपोर्टें
                      </strong>{" "}
                      दर्ज की हैं
                      {alert.baseline_per_day !== undefined && (
                        <>
                          , जबकि पिछले 7 दिनों का दैनिक औसत{" "}
                          <span className="font-mono text-[#171638] font-bold">
                            {alert.baseline_per_day.toFixed(1)}/दिन
                          </span>{" "}
                          था।
                        </>
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  Community reports in this area increased significantly in the last{" "}
                  <strong className="text-[#171638]">{alert.window || "24 hours"}</strong>.
                  {alert.count !== undefined && (
                    <>
                      {" "}The system recorded{" "}
                      <strong className="text-amber-700 font-mono font-bold">
                        {alert.count} reports
                      </strong>
                      {alert.baseline_per_day !== undefined && (
                        <>
                          , compared to the prior daily baseline average of{" "}
                          <span className="font-mono text-[#171638] font-bold">
                            {alert.baseline_per_day.toFixed(1)}/day
                          </span>.
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          ) : isNewType ? (
            <>
              {isHi ? (
                <>
                  एक नई धोखाधड़ी श्रेणी ({scamLabel || alert.scam_type}), जो पिछले 30 दिनों में इस इलाके में नहीं देखी गई थी, पिछले{" "}
                  <strong className="text-[#171638]">{alert.window || "24 घंटों"}</strong> में रिपोर्ट की गई है। अज्ञात संचार माध्यमों से सतर्क रहें।
                </>
              ) : (
                <>
                  A scam category ({scamLabel || alert.scam_type}) not observed in this area over
                  the preceding 30 days was reported within the last{" "}
                  <strong className="text-[#171638]">{alert.window || "24 hours"}</strong>. Stay cautious of unfamiliar communication channels.
                </>
              )}
            </>
          ) : (
            alert.summary || (isHi ? "सिस्टम द्वारा असामान्य रिपोर्टिंग गतिविधि चिह्नित की गई है।" : "Unusual community reporting activity flagged by the intelligence engine.")
          )}
        </p>

        {/* Quantitative Metrics Chips (only when provided by API) */}
        {isSpike && (alert.count !== undefined || alert.baseline_per_day !== undefined) && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            {alert.count !== undefined && (
              <div className="p-3 rounded-2xl bg-[#FFF9EB] border border-[#FDE68A] space-y-0.5">
                <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">
                  {isHi ? "घटना संख्या" : "Incident Volume"}
                </span>
                <span className="text-lg font-black font-mono text-amber-700">
                  {alert.count}
                </span>
                <span className="text-[10px] text-amber-800 ml-1 font-medium">
                  {isHi ? `(अवधि: ${alert.window || "24h"})` : `in ${alert.window || "24h"}`}
                </span>
              </div>
            )}

            {alert.baseline_per_day !== undefined && (
              <div className="p-3 rounded-2xl bg-[#F6F4FE] border border-[#EAE6FD] space-y-0.5">
                <span className="text-[10px] text-[#837FA8] font-bold uppercase tracking-wider block">
                  {isHi ? "दैनिक औसत" : "Baseline Average"}
                </span>
                <span className="text-lg font-black font-mono text-[#171638]">
                  {alert.baseline_per_day.toFixed(1)}
                </span>
                <span className="text-[10px] text-[#545277] ml-1 font-medium">
                  {isHi ? "रिपोर्ट/दिन" : "reports/day"}
                </span>
              </div>
            )}

            {alert.count !== undefined &&
              alert.baseline_per_day !== undefined &&
              alert.baseline_per_day > 0 && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 space-y-0.5 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider block">
                    {isHi ? "उछाल अनुपात" : "Surge Multiple"}
                  </span>
                  <span className="text-lg font-black font-mono text-rose-600">
                    {(alert.count / alert.baseline_per_day).toFixed(1)}x
                  </span>
                  <span className="text-[10px] text-rose-700 ml-1 font-medium">
                    {isHi ? "औसत से अधिक" : "of baseline"}
                  </span>
                </div>
              )}
          </div>
        )}

        {isNewType && alert.scam_type && (
          <div className="p-3.5 rounded-2xl bg-[#E6FAF9] border border-[#99F0ED] text-xs flex items-center justify-between">
            <span className="text-teal-900 font-medium">{isHi ? "नया देखा गया पैटर्न:" : "Newly Observed Pattern:"}</span>
            <span className="font-bold text-[#08C9C5] font-mono">
              {scamLabel}
            </span>
          </div>
        )}
      </div>

      {/* ── Footer: Responsible Notice & Action Shortcuts ─────────── */}
      <div className="pt-4 border-t border-[#EAE6FD] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <p className="text-[11px] text-[#837FA8] flex items-center gap-1.5 font-medium">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>
            {isHi
              ? "सामुदायिक संकेत • भुगतान अनुरोधों पर भरोसा करने से पहले स्वतंत्र रूप से पुष्टि करें।"
              : "Community signal • Independently verify before trusting payment requests."}
          </span>
        </p>

        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto shrink-0">
          <Link href={`/map`}>
            <PrimaryButton
              variant="outline"
              size="sm"
              className="text-xs"
              leftIcon={<Map className="w-3 h-3" />}
            >
              {isHi ? t.nav.map : "View on Map"}
            </PrimaryButton>
          </Link>
          <Link href={`/lookup`}>
            <PrimaryButton
              variant="purple"
              size="sm"
              className="text-xs"
              leftIcon={<Search className="w-3 h-3" />}
            >
              {isHi ? t.nav.lookup : "Lookup"}
            </PrimaryButton>
          </Link>
          <Link href={`/report`}>
            <PrimaryButton
              variant="primary"
              size="sm"
              className="text-xs"
              leftIcon={<ShieldAlert className="w-3 h-3" />}
            >
              {isHi ? t.nav.report : "Report Scam"}
            </PrimaryButton>
          </Link>
        </div>
      </div>
    </article>
  );
}

export default AlertCard;

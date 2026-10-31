"use client";

import React from "react";
import Link from "next/link";
import {
  MapPin,
  AlertTriangle,
  Flame,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import { MapClusterItem } from "@/lib/contracts";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { REPORT_SCAM_TYPES } from "@/lib/constants/reportOptions";
import { useLanguage } from "@/hooks/useLanguage";

interface ClusterDetailCardProps {
  cluster: MapClusterItem;
  onClose?: () => void;
  className?: string;
}

const SCAM_TYPE_HI: Record<string, string> = {
  "fake-kyc-link": "फ़िशिंग लिंक / नकली KYC",
  "aadhaar-pan": "आधार / पैन / KYC फ्रॉड",
  "upi-fraud": "UPI / भुगतान धोखाधड़ी",
  "part-time-job": "पार्ट-टाइम जॉब स्कैम",
  "lottery-kbc": "लॉटरी / इनाम स्कैम",
  "courier-customs": "पार्सल / सीमा शुल्क जुर्माना",
  "loan-app": "लोन ऐप उत्पीड़न",
  "deepfake-impersonation": "डिजिटल अरेस्ट / डीपफेक",
  "crypto-investment": "क्रिप्टो / निवेश धोखाधड़ी",
  "electricity-bill": "बिजली बिल स्कैम",
  "phishing-url": "फ़िशिंग लिंक / नकली वेबसाइट",
};

export function getScamTypeLabel(scamType: string, isHi: boolean = false): string {
  if (isHi) {
    const key = scamType.toLowerCase().replace(/_/g, "-");
    if (SCAM_TYPE_HI[key]) return SCAM_TYPE_HI[key];
  }
  const match = REPORT_SCAM_TYPES.find(
    (item) => item.type === scamType || item.type.replace(/-/g, "_") === scamType.replace(/-/g, "_")
  );
  if (match) {
    return match.label;
  }
  return scamType
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function ClusterDetailCard({ cluster, onClose, className = "" }: ClusterDetailCardProps) {
  const { lang, t } = useLanguage();
  const isHi = lang === "hi";

  const normalizedSeverity = cluster.severity?.toUpperCase() || "MED";
  const scamLabel = getScamTypeLabel(cluster.top_scam_type, isHi);

  const getSeverityDescription = (sev: string) => {
    switch (sev) {
      case "CRIT":
        return isHi
          ? "पिछले 7 दिनों में इस क्षेत्र में उच्च मात्रा में धोखाधड़ी दर्ज की गई है। निवासियों को अत्यधिक सतर्क रहने की सलाह दी जाती है।"
          : "High volume of scam activity reported in this area over the past 7 days. High vigilance advised for residents.";
      case "HIGH":
        return isHi
          ? "पिछले 7 दिनों में इस क्षेत्र में स्कैम रिपोर्टों में वृद्धि देखी गई है। अप्रत्याशित भुगतान अनुरोधों की पुष्टि करें।"
          : "Elevated scam reports noted in this area over the past 7 days. Verify unexpected payment requests.";
      case "MED":
      default:
        return isHi
          ? "पिछले 7 दिनों में इस क्षेत्र में मध्यम स्कैम रिपोर्टें दर्ज की गई हैं। सामान्य सावधानी बरतने की सलाह दी जाती है।"
          : "Moderate scam reports recorded in this area over the past 7 days. Standard caution recommended.";
    }
  };

  const getSeverityLabel = (sev: string) => {
    switch (sev) {
      case "CRIT":
        return isHi ? "गंभीर गतिविधि" : "Critical Activity";
      case "HIGH":
        return isHi ? "बढ़ी हुई गतिविधि" : "Elevated Activity";
      case "MED":
      default:
        return isHi ? "मध्यम गतिविधि" : "Moderate Activity";
    }
  };

  return (
    <div
      className={`rounded-xl border border-slate-700/80 bg-slate-900/95 p-5 shadow-2xl backdrop-blur-md text-slate-100 ${className}`}
      role="region"
      aria-label={`Details for ${cluster.locality}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-teal-500/10 text-teal-400">
              <MapPin className="w-4 h-4" />
            </span>
            <h3 className="text-lg font-bold text-slate-100 tracking-tight">
              {cluster.locality}
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            {cluster.city} • PIN: <span className="font-mono text-slate-300 font-semibold">{cluster.pincode}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge
            status={
              normalizedSeverity === "CRIT"
                ? "critical"
                : normalizedSeverity === "HIGH"
                ? "high"
                : "medium"
            }
            label={getSeverityLabel(normalizedSeverity)}
            size="sm"
          />
          {onClose && (
            <button
              onClick={onClose}
              type="button"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              aria-label="Close cluster details"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 my-4">
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            {isHi ? t.map.reports7Days : "Reports (7 Days)"}
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold font-mono text-teal-300">
              {cluster.count}
            </span>
            <span className="text-xs text-slate-400">
              {isHi ? "सत्यापित घटनाएं" : "verified incidents"}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            {isHi ? "जोखिम रेटिंग" : "Severity Rating"}
          </span>
          <div className="flex items-center gap-1.5 mt-1.5">
            {normalizedSeverity === "CRIT" ? (
              <Flame className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span className="text-sm font-semibold text-slate-200 font-mono">
              {normalizedSeverity}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Pattern */}
      <div className="mb-4 p-3 rounded-lg bg-slate-950/40 border border-slate-800/80 space-y-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {isHi ? t.map.dominantPattern : "Primary Scam Pattern"}
        </span>
        <p className="text-sm font-semibold text-teal-200">
          {scamLabel}
        </p>
        <p className="text-xs text-slate-400 leading-relaxed">
          {getSeverityDescription(normalizedSeverity)}
        </p>
      </div>

      {/* Privacy Guarantee Note */}
      <div className="mb-4 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
        <span className="text-teal-400 mt-0.5 shrink-0">ℹ</span>
        <span>
          <strong>{isHi ? "नागरिक सुरक्षा सूचना:" : "Community Protection Notice:"}</strong>{" "}
          {isHi
            ? "डेटा केवल क्षेत्र स्तर पर समूहीकृत घटनाओं का प्रतिनिधित्व करता है। व्यक्तिगत नागरिक और शिकायतकर्ता पूरी तरह से गुमनाम रहते हैं।"
            : "Data represents aggregated incident counts mapped to neighborhood centers from PRD Appendix B. Individual victims and reporters remain strictly anonymous."}
        </span>
      </div>

      {/* Action Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800">
        <Link href={`/lookup`}>
          <PrimaryButton
            variant="outline"
            size="sm"
            className="w-full text-xs justify-center"
            leftIcon={<Search className="w-3.5 h-3.5" />}
          >
            {isHi ? t.lookup.checkAnother : "Check an Identifier"}
          </PrimaryButton>
        </Link>
        <Link href={`/report`}>
          <PrimaryButton
            variant="primary"
            size="sm"
            className="w-full text-xs justify-center font-semibold"
            leftIcon={<ShieldAlert className="w-3.5 h-3.5" />}
          >
            {isHi ? t.home.reportIncident : "Report Incident"}
          </PrimaryButton>
        </Link>
      </div>
    </div>
  );
}

export default ClusterDetailCard;

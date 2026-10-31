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
      className={`rounded-[2rem] border border-[#EAE6FD] bg-white p-6 shadow-xl shadow-[#6035E8]/10 text-[#171638] ${className}`}
      role="region"
      aria-label={`Details for ${cluster.locality}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#EAE6FD]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#6035E8]/10 text-[#6035E8]">
              <MapPin className="w-4 h-4" />
            </span>
            <h3 className="text-xl font-black text-[#171638] tracking-tight">
              {cluster.locality}
            </h3>
          </div>
          <p className="text-xs text-[#545277] font-medium">
            {cluster.city} • PIN: <span className="font-mono text-[#171638] font-bold">{cluster.pincode}</span>
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
              className="p-1.5 rounded-full text-[#837FA8] hover:text-[#171638] hover:bg-[#F0EDFF] transition-colors cursor-pointer"
              aria-label="Close cluster details"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 my-4">
        <div className="p-4 rounded-2xl bg-[#F6F4FE] border border-[#EAE6FD]">
          <span className="text-[11px] font-bold text-[#837FA8] uppercase tracking-wider block">
            {isHi ? t.map.reports7Days : "Reports (7 Days)"}
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black font-mono text-[#08C9C5]">
              {cluster.count}
            </span>
            <span className="text-xs text-[#545277] font-medium">
              {isHi ? "सत्यापित घटनाएं" : "verified incidents"}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#F6F4FE] border border-[#EAE6FD]">
          <span className="text-[11px] font-bold text-[#837FA8] uppercase tracking-wider block">
            {isHi ? "जोखिम रेटिंग" : "Severity Rating"}
          </span>
          <div className="flex items-center gap-1.5 mt-1.5">
            {normalizedSeverity === "CRIT" ? (
              <Flame className="w-4 h-4 text-rose-500 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            )}
            <span className="text-sm font-bold text-[#171638] font-mono">
              {normalizedSeverity}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Pattern */}
      <div className="mb-4 p-4 rounded-2xl bg-[#F0EDFF] border border-[#DDD6FE] space-y-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#6035E8]">
          {isHi ? t.map.dominantPattern : "Primary Scam Pattern"}
        </span>
        <p className="text-base font-black text-[#171638]">
          {scamLabel}
        </p>
        <p className="text-xs text-[#545277] leading-relaxed font-medium">
          {getSeverityDescription(normalizedSeverity)}
        </p>
      </div>

      {/* Privacy Guarantee Note */}
      <div className="mb-4 p-3 rounded-xl bg-[#F6F4FE] border border-[#EAE6FD] text-[11px] text-[#545277] leading-relaxed flex items-start gap-2">
        <span className="text-[#6035E8] font-bold mt-0.5 shrink-0">ℹ</span>
        <span>
          <strong className="text-[#171638]">{isHi ? "नागरिक सुरक्षा सूचना:" : "Community Protection Notice:"}</strong>{" "}
          {isHi
            ? "डेटा केवल क्षेत्र स्तर पर समूहीकृत घटनाओं का प्रतिनिधित्व करता है। व्यक्तिगत नागरिक और शिकायतकर्ता पूरी तरह से गुमनाम रहते हैं।"
            : "Data represents aggregated incident counts mapped to neighborhood centers from PRD Appendix B. Individual victims and reporters remain strictly anonymous."}
        </span>
      </div>

      {/* Action Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 border-t border-[#EAE6FD]">
        <Link href={`/lookup`}>
          <PrimaryButton
            variant="purple"
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
            className="w-full text-xs justify-center font-bold"
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

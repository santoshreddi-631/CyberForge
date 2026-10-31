"use client";

import React from "react";
import { Phone, QrCode, Globe, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { LookupIdentifierType } from "@/types";
import { useLanguage } from "@/hooks/useLanguage";

export const REPORT_IDENTIFIER_OPTIONS = [
  {
    type: "phone" as LookupIdentifierType,
    label: "Phone Number",
    labelHi: "फ़ोन नंबर",
    shortLabel: "Phone",
    shortLabelHi: "फ़ोन",
    icon: Phone,
    placeholder: "e.g. +91 98765 43210 or 1800 xxx xxxx",
    placeholderHi: "उदा. +91 98765 43210 या 1800 xxx xxxx",
  },
  {
    type: "upi" as LookupIdentifierType,
    label: "UPI ID",
    labelHi: "UPI ID",
    shortLabel: "UPI",
    shortLabelHi: "UPI",
    icon: QrCode,
    placeholder: "e.g. merchant@okaxis",
    placeholderHi: "उदा. merchant@okaxis",
  },
  {
    type: "url" as LookupIdentifierType,
    label: "URL / Website",
    labelHi: "वेबसाइट / लिंक",
    shortLabel: "Link",
    shortLabelHi: "लिंक",
    icon: Globe,
    placeholder: "e.g. https://sbi-kyc-update.in",
    placeholderHi: "उदा. https://sbi-kyc-update.in",
  },
  {
    type: "sender_id" as LookupIdentifierType,
    label: "SMS Sender ID",
    labelHi: "SMS सेंडर ID",
    shortLabel: "SMS ID",
    shortLabelHi: "SMS ID",
    icon: MessageSquare,
    placeholder: "e.g. HDFCBK or VM-SBIINB",
    placeholderHi: "उदा. HDFCBK या VM-SBIINB",
  },
];

interface ReportIdentifierSelectorProps {
  selectedType: LookupIdentifierType;
  onSelect: (type: LookupIdentifierType) => void;
  disabled?: boolean;
}

export function ReportIdentifierSelector({
  selectedType,
  onSelect,
  disabled = false,
}: ReportIdentifierSelectorProps) {
  const { lang } = useLanguage();
  const isHi = lang === "hi";

  return (
    <div
      role="tablist"
      aria-label="Select identifier type to report"
      className="grid grid-cols-2 sm:grid-cols-4 gap-2"
    >
      {REPORT_IDENTIFIER_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const isSelected = selectedType === opt.type;
        return (
          <button
            key={opt.type}
            role="tab"
            type="button"
            aria-selected={isSelected}
            disabled={disabled}
            onClick={() => onSelect(opt.type)}
            className={cn(
              "flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-teal-400 select-none border",
              isSelected
                ? "bg-teal-500/15 text-teal-300 border-teal-500/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border-slate-800",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <Icon className={cn("w-4 h-4 shrink-0", isSelected ? "text-teal-400" : "text-slate-500")} />
            <span className="hidden sm:inline">{isHi ? opt.labelHi : opt.label}</span>
            <span className="sm:hidden">{isHi ? opt.shortLabelHi : opt.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}


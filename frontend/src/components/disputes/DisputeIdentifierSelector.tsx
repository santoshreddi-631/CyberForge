"use client";

import React from "react";
import { Phone, QrCode, Globe, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { LookupIdentifierType } from "@/types";
import { useLanguage } from "@/hooks/useLanguage";

export interface DisputeIdentifierOption {
  type: LookupIdentifierType;
  label: string;
  labelHi: string;
  shortLabel: string;
  shortLabelHi: string;
  icon: React.ElementType;
  placeholder: string;
  placeholderHi: string;
  helperText: string;
  helperTextHi: string;
}

export const DISPUTE_IDENTIFIER_OPTIONS: DisputeIdentifierOption[] = [
  {
    type: "phone",
    label: "Phone / Landline",
    labelHi: "फ़ोन / लैंडलाइन",
    shortLabel: "Phone",
    shortLabelHi: "फ़ोन",
    icon: Phone,
    placeholder: "e.g. +91 80 4100 2233 or 1800 1600",
    placeholderHi: "उदा. +91 80 4100 2233 या 1800 1600",
    helperText: "Official business contact number or customer support line",
    helperTextHi: "आधिकारिक व्यावसायिक संपर्क नंबर या ग्राहक सहायता हेल्पलाइन",
  },
  {
    type: "upi",
    label: "Merchant UPI ID",
    labelHi: "व्यापारी UPI ID",
    shortLabel: "UPI",
    shortLabelHi: "UPI",
    icon: QrCode,
    placeholder: "e.g. freshbakes@okaxis or business@upi",
    placeholderHi: "उदा. freshbakes@okaxis या business@upi",
    helperText: "Official registered merchant UPI VPA",
    helperTextHi: "आधिकारिक पंजीकृत व्यापारी UPI VPA हैंडल",
  },
  {
    type: "url",
    label: "Business Website",
    labelHi: "व्यावसायिक वेबसाइट",
    shortLabel: "Website",
    shortLabelHi: "वेबसाइट",
    icon: Globe,
    placeholder: "e.g. https://freshbakes.in",
    placeholderHi: "उदा. https://freshbakes.in",
    helperText: "Official business website domain or portal URL",
    helperTextHi: "आधिकारिक व्यावसायिक वेबसाइट डोमेन या पोर्टल URL",
  },
  {
    type: "sender_id",
    label: "SMS Header / Sender ID",
    labelHi: "SMS हेडर / सेंडर ID",
    shortLabel: "SMS Header",
    shortLabelHi: "SMS हेडर",
    icon: MessageSquare,
    placeholder: "e.g. FRSHBK or HDFCBK",
    placeholderHi: "उदा. FRSHBK या HDFCBK",
    helperText: "TRAI-registered 6-character DLT SMS sender header",
    helperTextHi: "TRAI द्वारा पंजीकृत 6-अक्षरों का आधिकारिक DLT SMS हेडर",
  },
];

interface DisputeIdentifierSelectorProps {
  selectedType: LookupIdentifierType;
  onSelect: (type: LookupIdentifierType) => void;
  disabled?: boolean;
}

export function DisputeIdentifierSelector({
  selectedType,
  onSelect,
  disabled = false,
}: DisputeIdentifierSelectorProps) {
  const { lang } = useLanguage();
  const isHi = lang === "hi";

  return (
    <div
      role="tablist"
      aria-label="Select disputed identifier type"
      className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 rounded-2xl sm:rounded-full bg-[#F0EDFF] border border-[#EAE6FD]"
    >
      {DISPUTE_IDENTIFIER_OPTIONS.map((opt) => {
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
              "flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[#6035E8] select-none cursor-pointer",
              isSelected
                ? "bg-[#6035E8] text-white shadow-md shadow-[#6035E8]/20"
                : "text-[#545277] hover:text-[#171638] hover:bg-white/80",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <Icon className={cn("w-4 h-4 shrink-0", isSelected ? "text-[#FFC928]" : "text-[#837FA8]")} />
            <span className="hidden sm:inline">{isHi ? opt.labelHi : opt.label}</span>
            <span className="sm:hidden">{isHi ? opt.shortLabelHi : opt.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}

export default DisputeIdentifierSelector;

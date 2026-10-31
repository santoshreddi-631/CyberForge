"use client";

import React from "react";
import { Phone, QrCode, Globe, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { LookupIdentifierType } from "@/types";

export interface IdentifierTypeOption {
  type: LookupIdentifierType;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  placeholder: string;
  helper: string;
}

export const IDENTIFIER_OPTIONS: IdentifierTypeOption[] = [
  {
    type: "phone",
    label: "Phone Number",
    shortLabel: "Phone",
    icon: Phone,
    placeholder: "e.g. +91 98765 43210, 1800 1600, or 1930",
    helper: "Accepts 10-digit mobiles, toll-free (1800/1860), or official helplines.",
  },
  {
    type: "upi",
    label: "UPI ID",
    shortLabel: "UPI",
    icon: QrCode,
    placeholder: "e.g. username@okaxis, merchant@upi",
    helper: "Accepts standard VPA formats (handle@bank or mobile@vpa).",
  },
  {
    type: "url",
    label: "URL / Website",
    shortLabel: "Link",
    icon: Globe,
    placeholder: "e.g. https://sbi-kyc.in/pay or suspected-link.com",
    helper: "Accepts full links or website domains.",
  },
  {
    type: "sender_id",
    label: "SMS Sender ID",
    shortLabel: "SMS ID",
    icon: MessageSquare,
    placeholder: "e.g. HDFCBK, SBIINB, or VM-AXISBK",
    helper: "Accepts 6-letter SMS headers with or without telecom prefix.",
  },
];

export interface IdentifierTypeSelectorProps {
  selectedType: LookupIdentifierType;
  onSelectType: (type: LookupIdentifierType) => void;
  disabled?: boolean;
}

export function IdentifierTypeSelector({
  selectedType,
  onSelectType,
  disabled = false,
}: IdentifierTypeSelectorProps) {
  return (
    <div
      role="tablist"
      aria-label="Select suspicious identifier type"
      className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 rounded-xl bg-slate-900/90 border border-slate-800"
    >
      {IDENTIFIER_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const isSelected = selectedType === opt.type;

        return (
          <button
            key={opt.type}
            role="tab"
            type="button"
            aria-selected={isSelected}
            disabled={disabled}
            onClick={() => onSelectType(opt.type)}
            className={cn(
              "flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-teal-400 select-none",
              isSelected
                ? "bg-teal-500/15 text-teal-300 border border-teal-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <Icon className={cn("w-4 h-4 shrink-0", isSelected ? "text-teal-400" : "text-slate-500")} />
            <span className="hidden sm:inline">{opt.label}</span>
            <span className="sm:hidden">{opt.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}

export default IdentifierTypeSelector;

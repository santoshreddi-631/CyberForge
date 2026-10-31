import React from "react";
import { cn } from "@/lib/utils/cn";
import { ShieldAlert, ShieldCheck, Clock, AlertTriangle, AlertCircle, Shield } from "lucide-react";
import { ScamStatus, RiskLevel } from "@/types";

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: ScamStatus | RiskLevel | string;
  size?: "sm" | "md";
  showIcon?: boolean;
  label?: string;
}

export function StatusBadge({
  status,
  size = "md",
  showIcon = true,
  label,
  className,
  ...props
}: StatusBadgeProps) {
  const normalized = status.toLowerCase().replace(/[\s-]/g, "_");

  let text = label;
  let bgClasses = "bg-[#F0EDFF] text-[#6035E8] border-[#E4DEFD]";
  let icon = <Shield className="w-3.5 h-3.5" />;

  switch (normalized) {
    case "verified":
    case "verified_scam":
    case "confirmed":
    case "critical":
      text = text || "Verified Scam";
      bgClasses = "bg-rose-100 text-rose-700 border-rose-200";
      icon = <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />;
      break;

    case "high":
    case "high_risk":
      text = text || "High Risk";
      bgClasses = "bg-rose-50 text-rose-600 border-rose-200";
      icon = <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />;
      break;

    case "under_review":
    case "investigating":
    case "flagged":
    case "medium":
      text = text || (normalized === "under_review" ? "Under Review" : "Flagged");
      bgClasses = "bg-amber-100 text-amber-800 border-amber-200";
      icon = <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
      break;

    case "disputed":
      text = text || "Disputed";
      bgClasses = "bg-[#F0EDFF] text-[#6035E8] border-[#DCD3FC]";
      icon = <AlertTriangle className="w-3.5 h-3.5 text-[#6035E8] shrink-0" />;
      break;

    case "cleared":
    case "safe":
    case "low":
    case "resolved":
      text = text || (normalized === "safe" ? "Low Risk / Safe" : "Cleared");
      bgClasses = "bg-emerald-100 text-emerald-800 border-emerald-200";
      icon = <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
      break;

    default:
      text = text || status;
      bgClasses = "bg-[#F0EDFF] text-[#6035E8] border-[#E4DEFD]";
      icon = <Shield className="w-3.5 h-3.5 text-[#6035E8] shrink-0" />;
      break;
  }

  const sizeClasses = {
    sm: "px-2.5 py-0.5 text-[11px] gap-1",
    md: "px-3.5 py-1 text-xs gap-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-black uppercase tracking-wider select-none shadow-sm",
        bgClasses,
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {showIcon && icon}
      <span>{text}</span>
    </span>
  );
}

export default StatusBadge;

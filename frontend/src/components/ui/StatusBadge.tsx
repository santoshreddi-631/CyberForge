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
  let bgClasses = "bg-slate-800 text-slate-300 border-slate-700";
  let icon = <Shield className="w-3.5 h-3.5" />;

  switch (normalized) {
    case "verified":
    case "verified_scam":
    case "confirmed":
    case "critical":
      text = text || "Verified Scam";
      bgClasses = "bg-rose-950/60 text-rose-300 border-rose-800/80 shadow-rose-950/40";
      icon = <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      break;

    case "high":
    case "high_risk":
      text = text || "High Risk";
      bgClasses = "bg-rose-900/40 text-rose-200 border-rose-700/60";
      icon = <AlertCircle className="w-3.5 h-3.5 text-rose-300 shrink-0" />;
      break;

    case "under_review":
    case "investigating":
    case "flagged":
    case "medium":
      text = text || (normalized === "under_review" ? "Under Review" : "Flagged");
      bgClasses = "bg-amber-950/50 text-amber-300 border-amber-800/70";
      icon = <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      break;

    case "disputed":
      text = text || "Disputed";
      bgClasses = "bg-indigo-950/50 text-indigo-300 border-indigo-700/60";
      icon = <AlertTriangle className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
      break;

    case "cleared":
    case "safe":
    case "low":
    case "resolved":
      text = text || (normalized === "safe" ? "Low Risk / Safe" : "Cleared");
      bgClasses = "bg-emerald-950/50 text-emerald-300 border-emerald-800/70";
      icon = <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      break;

    default:
      text = text || status;
      bgClasses = "bg-slate-800/80 text-slate-300 border-slate-700";
      icon = <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
  }

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5 font-medium",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border shadow-xs tracking-wide select-none",
        sizeStyles[size],
        bgClasses,
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

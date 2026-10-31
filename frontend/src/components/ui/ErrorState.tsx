import React from "react";
import { cn } from "@/lib/utils/cn";
import { AlertCircle, RotateCcw } from "lucide-react";
import { PrimaryButton } from "./PrimaryButton";

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  onRetry?: () => void;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function ErrorState({
  title = "Failed to Load Intelligence Data",
  description = "A network or service disruption prevented data retrieval. Please check your connection or retry.",
  onRetry,
  action,
  icon,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 md:p-10 rounded-xl border border-rose-900/40 bg-rose-950/20 text-rose-200",
        className
      )}
      {...props}
    >
      <div className="w-12 h-12 rounded-full bg-rose-900/30 flex items-center justify-center text-rose-400 mb-4 ring-1 ring-rose-700/50">
        {icon || <AlertCircle className="w-6 h-6" />}
      </div>
      <h3 className="text-base font-semibold text-rose-100 mb-1.5">{title}</h3>
      <p className="text-sm text-slate-300 max-w-md leading-relaxed mb-6">{description}</p>
      {action ? (
        action
      ) : onRetry ? (
        <PrimaryButton
          variant="secondary"
          size="sm"
          onClick={onRetry}
          leftIcon={<RotateCcw className="w-4 h-4" />}
        >
          Try Again
        </PrimaryButton>
      ) : null}
    </div>
  );
}

export default ErrorState;

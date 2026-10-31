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
        "flex flex-col items-center justify-center text-center p-8 md:p-12 rounded-[2rem] border border-rose-200 bg-white shadow-sm text-[#171638]",
        className
      )}
      {...props}
    >
      <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-4 shadow-sm">
        {icon || <AlertCircle className="w-7 h-7" />}
      </div>
      <h3 className="text-base sm:text-lg font-black text-rose-950 mb-1.5">{title}</h3>
      <p className="text-xs sm:text-sm text-[#545277] max-w-md leading-relaxed mb-6 font-medium">{description}</p>
      {action ? (
        action
      ) : onRetry ? (
        <PrimaryButton
          variant="purple"
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

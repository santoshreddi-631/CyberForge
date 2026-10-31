import React from "react";
import { cn } from "@/lib/utils/cn";

export interface LoadingSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "card" | "row" | "text" | "circle";
  count?: number;
}

export function LoadingSkeleton({
  variant = "text",
  count = 1,
  className,
  ...props
}: LoadingSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  const getVariantClasses = () => {
    switch (variant) {
      case "card":
        return "h-32 w-full rounded-xl";
      case "row":
        return "h-12 w-full rounded-lg";
      case "circle":
        return "h-10 w-10 rounded-full shrink-0";
      case "text":
      default:
        return "h-4 w-full rounded";
    }
  };

  return (
    <div className="flex flex-col gap-2.5 w-full" aria-busy="true" aria-live="polite">
      {items.map((i) => (
        <div
          key={i}
          className={cn(
            "bg-slate-800/60 animate-pulse border border-slate-700/30",
            getVariantClasses(),
            className
          )}
          {...props}
        />
      ))}
    </div>
  );
}

export default LoadingSkeleton;

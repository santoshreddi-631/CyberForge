import React from "react";
import { cn } from "@/lib/utils/cn";
import { SearchX } from "lucide-react";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({
  title = "No Intelligence Records Found",
  description = "No reported cyber fraud incidents match your search criteria. Always exercise caution before transferring funds.",
  icon,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 md:p-12 rounded-[2rem] border border-dashed border-[#DDD6FE] bg-white shadow-sm",
        className
      )}
      {...props}
    >
      <div className="w-14 h-14 rounded-full bg-[#F0EDFF] flex items-center justify-center text-[#6035E8] mb-4 shadow-sm">
        {icon || <SearchX className="w-7 h-7" />}
      </div>
      <h3 className="text-base sm:text-lg font-black text-[#171638] mb-1.5">{title}</h3>
      <p className="text-xs sm:text-sm text-[#545277] max-w-md leading-relaxed mb-6 font-medium">{description}</p>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
}

export default EmptyState;

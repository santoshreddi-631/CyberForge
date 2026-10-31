import React from "react";
import { cn } from "@/lib/utils/cn";

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  maxWidth?: "narrow" | "default" | "wide" | "full";
}

export function PageContainer({
  maxWidth = "default",
  className,
  children,
  ...props
}: PageContainerProps) {
  const maxWidthStyles = {
    narrow: "max-w-4xl",
    default: "max-w-7xl",
    wide: "max-w-[1440px]",
    full: "max-w-full",
  };

  return (
    <div
      className={cn(
        "w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8",
        maxWidthStyles[maxWidth],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default PageContainer;

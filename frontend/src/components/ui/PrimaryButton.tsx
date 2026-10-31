"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Loader2 } from "lucide-react";

export interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "purple" | "yellow" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const PrimaryButton = React.forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-bold transition-all duration-200 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#08C9C5] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]";

    const variantStyles = {
      primary:
        "bg-[#08C9C5] hover:bg-[#06B5B1] active:bg-[#059E9A] text-[#171638] shadow-[0_8px_20px_rgba(8,201,197,0.25)] hover:shadow-[0_10px_25px_rgba(8,201,197,0.35)]",
      secondary:
        "bg-white hover:bg-purple-50 active:bg-purple-100 text-[#6035E8] border-2 border-[#6035E8]/30 hover:border-[#6035E8] shadow-sm",
      purple:
        "bg-[#6035E8] hover:bg-[#5421D6] active:bg-[#4316BD] text-white shadow-[0_8px_20px_rgba(96,53,232,0.25)] hover:shadow-[0_10px_25px_rgba(96,53,232,0.35)]",
      yellow:
        "bg-[#FFC928] hover:bg-[#F3BD1E] active:bg-[#DFAB13] text-[#171638] shadow-[0_8px_20px_rgba(255,201,40,0.25)]",
      outline:
        "bg-white/10 hover:bg-white/20 active:bg-white/30 text-white border-2 border-white/60 hover:border-white",
      danger:
        "bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white shadow-sm",
      ghost:
        "bg-transparent hover:bg-[#6035E8]/10 text-[#6035E8] hover:text-[#5421D6]",
    };

    const sizeStyles = {
      sm: "h-9 px-4 text-xs gap-1.5",
      md: "h-11 px-5 text-sm gap-2",
      lg: "h-13 px-7 text-base gap-2.5",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

PrimaryButton.displayName = "PrimaryButton";

export default PrimaryButton;

"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

export interface DonutRingProps {
  color?: "yellow" | "purple" | "teal" | "lavender" | "white";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  animate?: boolean;
}

export function DonutRing({
  color = "yellow",
  size = "md",
  className,
  animate = false,
}: DonutRingProps) {
  const sizeStyles = {
    xs: "w-10 h-10 border-[6px]",
    sm: "w-16 h-16 border-[10px]",
    md: "w-28 h-28 border-[16px]",
    lg: "w-44 h-44 border-[24px]",
    xl: "w-60 h-60 border-[32px]",
  };

  const colorStyles = {
    yellow: "border-[#FFC928]",
    purple: "border-[#6035E8]",
    teal: "border-[#08C9C5]",
    lavender: "border-[#E0D8FD]",
    white: "border-white/25",
  };

  return (
    <div
      aria-hidden="true"
      className={cn(
        "rounded-full pointer-events-none select-none shrink-0 transition-transform duration-700",
        sizeStyles[size],
        colorStyles[color],
        animate && "motion-safe:animate-[pulse_8s_ease-in-out_infinite]",
        className
      )}
    />
  );
}

export interface CircularOutlineProps {
  color?: "white" | "purple" | "yellow" | "teal";
  size?: "sm" | "md" | "lg";
  className?: string;
  dashed?: boolean;
}

export function CircularOutline({
  color = "white",
  size = "md",
  className,
  dashed = false,
}: CircularOutlineProps) {
  const sizeStyles = {
    sm: "w-14 h-14",
    md: "w-28 h-28",
    lg: "w-48 h-48",
  };

  const colorStyles = {
    white: "border-white/20",
    purple: "border-[#6035E8]/20",
    yellow: "border-[#FFC928]/30",
    teal: "border-[#08C9C5]/30",
  };

  return (
    <div
      aria-hidden="true"
      className={cn(
        "rounded-full border pointer-events-none select-none shrink-0",
        dashed ? "border-dashed" : "border-solid",
        sizeStyles[size],
        colorStyles[color],
        className
      )}
    />
  );
}

export interface DotGridProps {
  rows?: number;
  cols?: number;
  color?: "white" | "purple" | "slate";
  className?: string;
}

export function DotGrid({
  rows = 4,
  cols = 6,
  color = "white",
  className,
}: DotGridProps) {
  const dotColor = {
    white: "bg-white/30",
    purple: "bg-[#6035E8]/25",
    slate: "bg-slate-400/30",
  };

  return (
    <div
      aria-hidden="true"
      className={cn("grid gap-2 pointer-events-none select-none", className)}
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
      }}
    >
      {Array.from({ length: rows * cols }).map((_, i) => (
        <span
          key={i}
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor[color])}
        />
      ))}
    </div>
  );
}


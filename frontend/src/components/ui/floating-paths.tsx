"use client";

import React, { useMemo } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function FloatingPathsBackground({
  position = -1,
  children,
  className,
}: {
  position?: number;
  className?: string;
  children: React.ReactNode;
}) {
  // Pre-generate smooth, continuous wave paths that span from edge to edge (-100 to 800)
  // These full-bleed paths never cut off, never vanish, and never snap into different shapes.
  const paths = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const yBase = 30 + i * 20;
      const yAmp = (18 + (i % 4) * 8) * (position > 0 ? 1 : -1);
      return {
        id: i,
        d: `M -100 ${yBase} C 160 ${yBase + yAmp}, 420 ${yBase - yAmp}, 800 ${yBase + yAmp * 0.5}`,
        strokeWidth: 1 + (i % 3) * 0.5,
        opacity: 0.12 + (i % 4) * 0.04,
        duration: 16 + ((i * 3) % 10),
        yFloat: 8 + (i % 3) * 5,
        xFloat: i % 2 === 0 ? 10 : -10,
      };
    });
  }, [position]);

  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      {/* Isolated GPU composite layer: prevents any repaints or layout shifts on child elements */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden select-none"
        style={{ contain: "strict", transform: "translateZ(0)" }}
        aria-hidden="true"
      >
        <svg
          className="h-full w-full text-[#6035E8]/20"
          viewBox="0 0 700 320"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
        >
          {paths.map((path) => (
            <motion.path
              key={path.id}
              d={path.d}
              stroke="currentColor"
              strokeWidth={path.strokeWidth}
              strokeOpacity={path.opacity}
              fill="none"
              strokeLinecap="round"
              initial={false}
              animate={{
                y: [0, path.yFloat, -path.yFloat, 0],
                x: [0, path.xFloat, 0],
              }}
              transition={{
                duration: path.duration,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </svg>
      </div>

      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
}

export default FloatingPathsBackground;

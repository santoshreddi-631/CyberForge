"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Plus, Map, Bell } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useLanguage } from "@/hooks/useLanguage";

export function MobileBottomNavigation() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const tabs = [
    { name: t.nav.home, href: "/", icon: Home },
    { name: t.nav.lookup, href: "/lookup", icon: Search },
    { name: t.nav.report, href: "/report", icon: Plus, isCta: true },
    { name: t.nav.map, href: "/map", icon: Map },
    { name: t.nav.alerts, href: "/alerts", icon: Bell },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-[#EAE6FD] shadow-[0_-8px_30px_rgba(96,53,232,0.06)] backdrop-blur-lg pb-[env(safe-area-inset-bottom)]"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;

          if (tab.isCta) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center justify-center -mt-5 group focus:outline-none"
                aria-label={tab.name}
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#08C9C5] hover:bg-[#06B5B1] active:bg-[#059E9A] text-[#171638] shadow-lg shadow-[#08C9C5]/35 transition-transform active:scale-95 border-2 border-white">
                  <Plus className="w-6 h-6 stroke-[3]" />
                </div>
                <span className="text-[10px] font-bold text-[#6035E8] mt-1">
                  {tab.name}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-1 text-xs transition-colors",
                isActive
                  ? "text-[#6035E8] font-bold"
                  : "text-[#6E6D8F] hover:text-[#171638]"
              )}
            >
              <Icon className="w-5 h-5 mb-1 shrink-0" />
              <span className="text-[10px] truncate max-w-[64px]">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileBottomNavigation;

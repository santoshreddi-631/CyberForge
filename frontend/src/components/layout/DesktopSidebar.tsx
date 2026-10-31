"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  PlusCircle,
  Map,
  Bell,
  Scale,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useLanguage } from "@/hooks/useLanguage";

export interface DesktopSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export function DesktopSidebar({
  isCollapsed = false,
  onToggleCollapse,
  className,
}: DesktopSidebarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navigation = [
    { name: t.nav.home, href: "/", icon: Home },
    { name: t.nav.lookup, href: "/lookup", icon: Search },
    { name: t.nav.report, href: "/report", icon: PlusCircle, badge: "New" },
    { name: t.nav.map, href: "/map", icon: Map },
    { name: t.nav.alerts, href: "/alerts", icon: Bell },
    { name: t.nav.disputes, href: "/disputes", icon: Scale },
  ];

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col border-r border-slate-800 bg-slate-950/70 backdrop-blur-md transition-all duration-200 shrink-0 select-none",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Navigation items list */}
      <div className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.name : undefined}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative",
                isActive
                  ? "bg-teal-500/10 text-teal-300 font-semibold border-l-2 border-teal-500"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-900"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 shrink-0 transition-colors",
                  isActive ? "text-teal-400" : "text-slate-400 group-hover:text-slate-200"
                )}
              />
              {!isCollapsed && (
                <span className="truncate flex-1">{item.name}</span>
              )}
              {!isCollapsed && item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Sidebar Footer - Citizen Grid Status */}
      <div className="p-3 border-t border-slate-800/80">
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="flex flex-col overflow-hidden">
              <span className="font-medium text-slate-200 truncate">Grid Operational</span>
              <span className="text-[10px] text-slate-400 truncate">Syncing nationwide intel</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-2" title="Grid Operational">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
        )}

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-full mt-2 flex items-center justify-center p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-900 text-xs transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>
    </aside>
  );
}

export default DesktopSidebar;

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldAlert, Menu, X, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { PrimaryButton } from "../ui/PrimaryButton";
import { useLanguage } from "@/hooks/useLanguage";

export interface AppHeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export function AppHeader({ onToggleSidebar, isSidebarOpen }: AppHeaderProps) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: t.nav.home, href: "/" },
    { name: t.nav.lookup, href: "/lookup" },
    { name: t.nav.map, href: "/map" },
    { name: t.nav.alerts, href: "/alerts" },
    { name: t.nav.disputes, href: "/disputes" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#EAE6FD] bg-white/90 backdrop-blur-md shadow-[0_4px_20px_rgba(96,53,232,0.03)]">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="hidden lg:flex p-2 rounded-xl text-[#34335C] hover:text-[#6035E8] hover:bg-[#F0EDFF] focus:outline-none transition-colors"
              aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link href="/" className="flex items-center gap-3 group focus:outline-none">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#6035E8] text-white shadow-md shadow-[#6035E8]/25 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-[#171638] group-hover:text-[#6035E8] transition-colors leading-tight">
                ScamWatch
              </span>
              <span className="text-[10px] font-bold text-[#6035E8] tracking-wider uppercase">
                 · India Citizen Defense
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 bg-[#F6F4FE] p-1.5 rounded-full border border-[#EAE6FD]">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 text-sm font-semibold rounded-full transition-all duration-150",
                  isActive
                    ? "bg-[#6035E8] text-white shadow-sm"
                    : "text-[#34335C] hover:text-[#6035E8] hover:bg-white"
                )}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right Header Actions */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher compact />

          <Link href="/report" className="hidden sm:inline-flex">
            <PrimaryButton
              size="sm"
              variant="primary"
              leftIcon={<PlusCircle className="w-4 h-4" />}
              className="font-black shadow-md shadow-[#08C9C5]/20"
            >
              {t.nav.report}
            </PrimaryButton>
          </Link>

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-[#171638] hover:bg-[#F0EDFF] focus:outline-none transition-colors"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#EAE6FD] bg-white px-4 pt-3 pb-6 space-y-2 shadow-xl animate-in slide-in-from-top-2 duration-150">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "block px-4 py-3 text-sm font-bold rounded-2xl transition-colors",
                  isActive
                    ? "bg-[#6035E8] text-white"
                    : "text-[#171638] hover:bg-[#F6F4FE]"
                )}
              >
                {link.name}
              </Link>
            );
          })}

          <div className="pt-2">
            <Link
              href="/report"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#08C9C5] text-[#171638] font-black text-sm shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t.nav.report}</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export default AppHeader;

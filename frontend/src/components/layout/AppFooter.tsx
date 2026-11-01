"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ExternalLink, Phone, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { DonutRing, DotGrid } from "@/components/ui/DecorativeShapes";

export function AppFooter() {
  const currentYear = 2026;
  const { t } = useLanguage();

  const navLinks = [
    { label: t.nav.home, href: "/" },
    { label: t.nav.lookup, href: "/lookup" },
    { label: t.nav.report, href: "/report" },
    { label: t.nav.map, href: "/map" },
    { label: t.nav.alerts, href: "/alerts" },
    { label: t.nav.disputes, href: "/disputes" },
  ];

  return (
    <footer className="relative mt-12 bg-gradient-to-b from-[#1E1447] via-[#171638] to-[#120F2D] text-purple-200/90 text-xs sm:text-sm rounded-t-[2.5rem] sm:rounded-t-[3.5rem] overflow-hidden">
      {/* Decorative Circles in Footer */}
      <DonutRing
        color="yellow"
        size="lg"
        className="absolute -top-16 -right-16 opacity-30 pointer-events-none"
      />
      <DonutRing
        color="purple"
        size="md"
        className="absolute bottom-4 left-6 opacity-40 pointer-events-none"
      />
      <DotGrid
        color="white"
        rows={4}
        cols={5}
        className="absolute top-12 left-10 opacity-20 pointer-events-none"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 pb-24 md:pb-16 z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 pb-12 border-b border-purple-800/40">
          {/* Brand & Mission */}
          <div className="space-y-4 lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3 text-white group">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#6035E8] text-white shadow-lg shadow-[#6035E8]/30 group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black text-white tracking-tight">
                  ScamWatch
                </span>
                <span className="text-[11px] font-bold text-[#FFC928] tracking-wider uppercase">
                   · India Citizen Cyber Defense Grid
                </span>
              </div>
            </Link>
            <p className="text-purple-200/80 text-xs sm:text-sm leading-relaxed max-w-md">
              {t.footer.about}
            </p>
            <div className="flex items-center gap-2 text-xs text-purple-200/90 pt-1">
              <ShieldCheck className="w-4 h-4 text-[#08C9C5] shrink-0" />
              <span>{t.footer.subtext}</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FFC928]" />
              <span>{t.footer.quickNav}</span>
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-[#FFC928] transition-colors focus:outline-none"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Emergency & Official Resources */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#08C9C5]" />
              <span>{t.footer.emergency}</span>
            </h4>
            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="text-[11px] text-purple-200 font-medium">{t.footer.helplineName}</div>
                <a
                  href="tel:1930"
                  className="text-xl font-black text-[#FFC928] hover:text-white transition-colors flex items-center gap-2 mt-1"
                >
                  <Phone className="w-4 h-4" />
                  <span>1930</span>
                </a>
              </div>

              <div>
                <a
                  href="https://cybercrime.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-white hover:text-[#08C9C5] transition-colors font-semibold"
                >
                  <span>cybercrime.gov.in</span>
                  <ExternalLink className="w-3.5 h-3.5 text-purple-300" />
                </a>
                <p className="text-[11px] text-purple-200/70 mt-1">
                  {t.footer.govPortal}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-purple-300/70">
          <p>© {currentYear} ScamWatch (). Built for Indian Citizen Cyber Safety.</p>
          <div className="flex items-center gap-6">
            <Link href="/lookup" className="hover:text-white transition-colors">Verify Identifier</Link>
            <Link href="/report" className="hover:text-white transition-colors">Report Incident</Link>
            <Link href="/disputes" className="hover:text-white transition-colors">Business Dispute</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default AppFooter;

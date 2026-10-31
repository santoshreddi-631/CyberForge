"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ExternalLink, Phone, ShieldCheck } from "lucide-react";

export function AppFooter() {
  const currentYear = 2026;

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Check an Identifier", href: "/lookup" },
    { label: "Report a Scam", href: "/report" },
    { label: "Live Scam Map", href: "/map" },
    { label: "Threat Alerts", href: "/alerts" },
    { label: "Business Disputes", href: "/disputes" },
  ];

  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400 text-xs sm:text-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-24 md:pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 pb-12 border-b border-slate-800/80">
          {/* Brand & About */}
          <div className="space-y-4 lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 text-slate-100 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400 group-hover:bg-teal-500/20 transition-colors">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold text-white tracking-tight">
                  Community Scam Map
                </span>
                <span className="text-[10px] font-semibold text-teal-400 tracking-wider uppercase">
                  India Citizen Cyber Defense Grid
                </span>
              </div>
            </Link>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-md">
              A community-driven cybersecurity intelligence network helping citizens across India verify suspicious phone numbers, UPI handles, bank accounts, and fraudulent websites.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Dedicated to proactive cyber fraud prevention across Indian communities.</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              Navigation
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-teal-300 transition-colors focus:outline-none"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Emergency & Official Resources */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              Emergency Helplines
            </h4>
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[11px] text-slate-400 font-medium">National Cyber Helpline</div>
                <a
                  href="tel:1930"
                  className="text-base font-black text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-1.5 mt-0.5"
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
                  className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
                >
                  <span>cybercrime.gov.in</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                </a>
                <p className="text-[11px] text-slate-400 mt-1">
                  Official Government of India Cyber Crime Reporting Portal
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Notice & Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p className="text-center md:text-left max-w-2xl leading-relaxed">
            Privacy-First Architecture: Personal reporter identities and pinpoint coordinates are never disclosed. All map coordinates are aggregated at area level.
          </p>
          <div className="text-center md:text-right shrink-0">
            <p>© {currentYear} Community Scam Map. Built for citizen awareness in India.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default AppFooter;

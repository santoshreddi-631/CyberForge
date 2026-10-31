"use client";

import React from "react";
import Link from "next/link";
import { Search, AlertTriangle, Map, Bell, ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { DonutRing, CircularOutline } from "@/components/ui/DecorativeShapes";

export function QuickActions() {
  const { lang, t } = useLanguage();
  const isHi = lang === "hi";

  const actionCards = [
    {
      title: isHi ? t.home.qaCheckTitle : "Check an Identifier",
      description: isHi ? t.home.qaCheckDesc : "Check whether a phone number, UPI ID, URL or SMS sender ID has been reported.",
      destination: "/lookup",
      icon: Search,
      iconBg: "bg-purple-100 text-[#6035E8]",
      ctaColor: "text-[#6035E8]",
      cta: isHi ? "शुरू करें" : "Check Now",
    },
    {
      title: isHi ? t.home.qaReportTitle : "Report a Scam",
      description: isHi ? t.home.qaReportDesc : "Help others by reporting suspicious identifiers and fraudulent transactions.",
      destination: "/report",
      icon: AlertTriangle,
      iconBg: "bg-amber-100 text-amber-700",
      ctaColor: "text-amber-700",
      badge: isHi ? "दूसरों की रक्षा करें" : "Protect Others",
      cta: isHi ? "रिपोर्ट करें" : "Report Now",
    },
    {
      title: isHi ? t.home.qaMapTitle : "Explore Scam Map",
      description: isHi ? t.home.qaMapDesc : "Discover reported scam activity and geographic risk clusters across areas.",
      destination: "/map",
      icon: Map,
      iconBg: "bg-teal-100 text-[#08C9C5]",
      ctaColor: "text-[#08C9C5]",
      cta: isHi ? "नक्शा खोलें" : "Open Map",
    },
    {
      title: isHi ? t.home.qaAlertsTitle : "View Alerts",
      description: isHi ? t.home.qaAlertsDesc : "Stay informed about emerging scam patterns, fake APKs, and phishing campaigns.",
      destination: "/alerts",
      icon: Bell,
      iconBg: "bg-rose-100 text-rose-600",
      ctaColor: "text-rose-600",
      badge: isHi ? "लाइव फीड" : "Live Feed",
      cta: isHi ? "अलर्ट देखें" : "View Alerts",
    },
  ];

  return (
    <section className="relative py-16 md:py-24 bg-[#F6F4FE] overflow-hidden">
      {/* Decorative donut at boundary */}
      <DonutRing
        color="yellow"
        size="md"
        className="absolute -top-12 right-12 opacity-80 pointer-events-none hidden md:block"
      />
      <CircularOutline
        color="purple"
        size="md"
        className="absolute bottom-6 left-6 opacity-30 pointer-events-none"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-2xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EAE6FD] text-xs font-black text-[#6035E8] uppercase tracking-wider mb-3">
            <span className="w-2 h-2 rounded-full bg-[#FFC928]" />
            <span>{isHi ? "त्वरित नागरिक उपकरण" : "Citizen Action Grid"}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#171638] tracking-tight leading-tight">
            {isHi ? t.home.quickActionsTitle : "Community Action Center"}
          </h2>
          <p className="mt-3 text-base text-[#6E6D8F] leading-relaxed">
            {isHi ? t.home.quickActionsSubtitle : "Direct tools to verify suspected cyber fraud, submit intel, and monitor regional threats."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {actionCards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.title}
                href={card.destination}
                className="group relative flex flex-col justify-between p-7 rounded-[2rem] bg-white border border-[#EAE6FD] shadow-[0_12px_36px_rgba(96,53,232,0.06)] hover:shadow-[0_20px_50px_rgba(96,53,232,0.14)] hover:-translate-y-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#6035E8]/20"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-200 shadow-sm ${card.iconBg}`}
                    >
                      <Icon className="w-7 h-7" />
                    </div>

                    <div className="flex items-center gap-2">
                      {card.badge && (
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-[#F0EDFF] text-[#6035E8] border border-[#E0D8FD]">
                          {card.badge}
                        </span>
                      )}
                      <div className="w-8 h-8 rounded-full bg-[#F6F4FE] group-hover:bg-[#6035E8] flex items-center justify-center transition-colors">
                        <ArrowUpRight className="w-4 h-4 text-[#6035E8] group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-black text-[#171638] group-hover:text-[#6035E8] transition-colors">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-sm text-[#6E6D8F] leading-relaxed font-normal">
                    {card.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#F0EDFF] flex items-center justify-between text-xs font-black">
                  <span className={card.ctaColor}>{card.cta}</span>
                  <span className="text-[#6035E8] group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default QuickActions;

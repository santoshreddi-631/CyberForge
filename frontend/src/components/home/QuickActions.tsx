import React from "react";
import Link from "next/link";
import { Search, AlertTriangle, Map, Bell, ArrowUpRight } from "lucide-react";

interface ActionCard {
  title: string;
  description: string;
  destination: string;
  icon: React.ElementType;
  accent: string;
  badge?: string;
}

const actionCards: ActionCard[] = [
  {
    title: "Check an Identifier",
    description: "Check whether a phone number, UPI ID, URL or SMS sender ID has been reported.",
    destination: "/lookup",
    icon: Search,
    accent: "text-sky-400 bg-sky-500/10 border-sky-500/20 group-hover:border-sky-500/40",
  },
  {
    title: "Report a Scam",
    description: "Help others by reporting suspicious identifiers and fraudulent transactions.",
    destination: "/report",
    icon: AlertTriangle,
    accent: "text-amber-400 bg-amber-500/10 border-amber-500/20 group-hover:border-amber-500/40",
    badge: "Protect Others",
  },
  {
    title: "Explore Scam Map",
    description: "Discover reported scam activity and geographic risk clusters across areas.",
    destination: "/map",
    icon: Map,
    accent: "text-teal-400 bg-teal-500/10 border-teal-500/20 group-hover:border-teal-500/40",
  },
  {
    title: "View Alerts",
    description: "Stay informed about emerging scam patterns, fake APKs, and phishing campaigns.",
    destination: "/alerts",
    icon: Bell,
    accent: "text-rose-400 bg-rose-500/10 border-rose-500/20 group-hover:border-rose-500/40",
    badge: "Live Feed",
  },
];

export function QuickActions() {
  return (
    <section className="py-12 md:py-16 border-b border-slate-800/80 bg-slate-950/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Community Action Center
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Direct tools to verify suspected cyber fraud, submit intel, and monitor regional threats.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {actionCards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.title}
                href={card.destination}
                className="group relative flex flex-col justify-between p-5 sm:p-6 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all duration-150 hover:-translate-y-0.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-11 h-11 rounded-lg flex items-center justify-center border transition-colors ${card.accent}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      {card.badge && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {card.badge}
                        </span>
                      )}
                      <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 transition-colors" />
                    </div>
                  </div>

                  <h3 className="text-base font-semibold text-slate-100 group-hover:text-teal-300 transition-colors">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 group-hover:text-slate-200">
                  <span className="font-medium">Get started</span>
                  <span className="text-teal-400 font-semibold text-xs tracking-wider">→</span>
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

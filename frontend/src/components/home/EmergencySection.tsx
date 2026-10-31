import React from "react";
import { PhoneCall, ExternalLink, ShieldAlert, Clock } from "lucide-react";

export function EmergencySection() {
  return (
    <section className="py-12 md:py-16 bg-slate-900/40 border-b border-slate-800/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 md:p-10 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs font-semibold">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>Active Financial Fraud Emergency?</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Report Immediately to Official Authorities
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                If you have just sent money to a scammer, act quickly. Filing a complaint immediately with the National Cyber Crime Reporting Portal activates banking lien protocols to freeze unauthorized transactions.
              </p>
              <div className="flex items-center gap-2 text-xs text-amber-300/90 pt-1">
                <Clock className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Golden Hour: Report within 2-3 hours of an incident for the highest fund recovery chance.</span>
              </div>
            </div>

            {/* Helpline and Portal CTAs */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3.5 shrink-0 w-full lg:w-auto">
              <a
                href="tel:1930"
                className="inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 active:bg-teal-600 text-slate-950 font-bold text-base shadow-lg shadow-teal-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                <PhoneCall className="w-5 h-5 shrink-0" />
                <div className="text-left">
                  <div className="text-[10px] uppercase font-semibold text-slate-900/80 tracking-wider">
                    Call National Helpline
                  </div>
                  <div className="text-lg leading-tight font-black tracking-wide">1930</div>
                </div>
              </a>

              <a
                href="https://cybercrime.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-100 font-semibold text-sm border border-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                <span>Official Cyber Crime Portal</span>
                <ExternalLink className="w-4 h-4 shrink-0 text-slate-400" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EmergencySection;

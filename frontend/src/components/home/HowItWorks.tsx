"use client";

import React from "react";
import { Search, Send, ShieldCheck, ArrowRight } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

export function HowItWorks() {
  const { lang, t } = useLanguage();
  const isHi = lang === "hi";

  const steps = [
    {
      number: "01",
      title: isHi ? "जांचें" : "Check",
      description: isHi
        ? "किसी भी संदिग्ध फ़ोन नंबर, UPI ID, वेबसाइट लिंक या SMS प्रेषक ID की जांच करें।"
        : "Check a suspicious phone number, UPI ID, URL or SMS sender ID.",
      icon: Search,
      accentBorder: "border-sky-500/30 text-sky-400 bg-sky-500/10",
    },
    {
      number: "02",
      title: isHi ? "रिपोर्ट करें" : "Report",
      description: isHi
        ? "समुदाय की सुरक्षा के लिए संदिग्ध धोखाधड़ी या फ्रॉड प्रयासों की तुरंत शिकायत दर्ज करें।"
        : "Submit information about a suspected scam to help the community.",
      icon: Send,
      accentBorder: "border-amber-500/30 text-amber-400 bg-amber-500/10",
    },
    {
      number: "03",
      title: isHi ? "सुरक्षित रहें" : "Protect",
      description: isHi
        ? "सामुदायिक रिपोर्टों, क्षेत्रीय नक्शे और ताज़ा अलर्ट के ज़रिए खुद को और परिवार को सुरक्षित रखें।"
        : "Stay aware of suspicious activity through community reports, area maps and alerts.",
      icon: ShieldCheck,
      accentBorder: "border-teal-500/30 text-teal-400 bg-teal-500/10",
    },
  ];

  return (
    <section className="py-12 md:py-20 border-b border-slate-800/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700/80 text-xs font-semibold text-teal-400 mb-3">
            <span>{isHi ? "सरल 3-चरणीय प्रक्रिया" : "Simple 3-Step Process"}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {isHi ? t.home.howItWorksTitle : "How It Works"}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-400 leading-relaxed">
            {isHi
              ? t.home.howItWorksSubtitle
              : "Community-powered cyber fraud verification protects citizens before financial damage occurs."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isLast = idx === steps.length - 1;

            return (
              <div
                key={step.number}
                className="relative flex flex-col p-6 sm:p-7 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700/90 transition-colors"
              >
                {/* Step indicator header */}
                <div className="flex items-center justify-between mb-5">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center border ${step.accentBorder}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="font-mono text-2xl font-black text-slate-700 select-none">
                    {step.number}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-100 mb-2.5">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {step.description}
                </p>

                {/* Arrow connector between steps on desktop */}
                {!isLast && (
                  <div className="hidden lg:block absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-500 shadow-sm">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;

"use client";

import React from "react";
import { Search, Send, ShieldCheck, ArrowRight } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { DonutRing, DotGrid } from "@/components/ui/DecorativeShapes";

export function HowItWorks() {
  const { lang, t } = useLanguage();
  const isHi = lang === "hi";

  const steps = [
    {
      number: "01",
      numberColor: "text-[#FFC928]",
      numberBg: "bg-[#FFC928]/15 text-[#D19B00]",
      title: isHi ? "जांचें" : "Check",
      description: isHi
        ? "किसी भी संदिग्ध फ़ोन नंबर, UPI ID, वेबसाइट लिंक या SMS प्रेषक ID की जांच करें।"
        : "Check a suspicious phone number, UPI ID, URL or SMS sender ID before interacting or sending funds.",
      icon: Search,
      iconColor: "text-[#FFC928] bg-[#FFF8E6] border-[#FFE699]",
    },
    {
      number: "02",
      numberColor: "text-[#6035E8]",
      numberBg: "bg-[#6035E8]/15 text-[#6035E8]",
      title: isHi ? "रिपोर्ट करें" : "Report",
      description: isHi
        ? "समुदाय की सुरक्षा के लिए संदिग्ध धोखाधड़ी या फ्रॉड प्रयासों की तुरंत शिकायत दर्ज करें।"
        : "Submit information about a suspected scam with channel and screenshot proof to corroborate threats.",
      icon: Send,
      iconColor: "text-[#6035E8] bg-[#F0EDFF] border-[#DCD3FC]",
    },
    {
      number: "03",
      numberColor: "text-[#08C9C5]",
      numberBg: "bg-[#08C9C5]/15 text-[#06A5A1]",
      title: isHi ? "सुरक्षित रहें" : "Protect",
      description: isHi
        ? "सामुदायिक रिपोर्टों, क्षेत्रीय नक्शे और ताज़ा अलर्ट के ज़रिए खुद को और परिवार को सुरक्षित रखें।"
        : "Stay ahead of fraudulent campaigns through 25-area rolling map clusters and instant spike alerts.",
      icon: ShieldCheck,
      iconColor: "text-[#08C9C5] bg-[#E6FAF9] border-[#B2F3F1]",
    },
  ];

  return (
    <section className="relative py-16 md:py-24 bg-white overflow-hidden rounded-[2.5rem] sm:rounded-[3.5rem] my-4 sm:my-6 mx-3 sm:mx-6 lg:mx-8 shadow-[0_10px_40px_rgba(96,53,232,0.05)] border border-[#EAE6FD]">
      {/* Decorative Accents */}
      <DonutRing
        color="purple"
        size="lg"
        className="absolute -bottom-20 -left-16 opacity-15 pointer-events-none"
      />
      <DotGrid
        color="purple"
        rows={4}
        cols={5}
        className="absolute top-10 right-10 opacity-30 pointer-events-none hidden sm:grid"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F0EDFF] text-xs font-black text-[#6035E8] uppercase tracking-wider mb-3">
            <span className="w-2 h-2 rounded-full bg-[#08C9C5]" />
            <span>{isHi ? "सरल 3-चरणीय प्रक्रिया" : "How It Works"}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#171638] tracking-tight">
            {isHi ? t.home.howItWorksTitle : "Three Simple Steps to Defense"}
          </h2>
          <p className="mt-3 text-base text-[#6E6D8F] leading-relaxed">
            {isHi
              ? t.home.howItWorksSubtitle
              : "Community-powered cyber fraud verification protects citizens before financial damage occurs."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isLast = idx === steps.length - 1;

            return (
              <div
                key={step.number}
                className="relative flex flex-col p-8 rounded-[2rem] bg-[#F6F4FE] border border-[#EAE6FD] hover:bg-[#F0EDFF] hover:-translate-y-1.5 transition-all duration-200 shadow-sm"
              >
                {/* Header with Step Number & Icon */}
                <div className="flex items-center justify-between mb-6">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${step.iconColor}`}
                  >
                    <Icon className="w-7 h-7" />
                  </div>
                  <span className={`text-4xl font-black tracking-tight ${step.numberColor}`}>
                    {step.number}
                  </span>
                </div>

                <h3 className="text-2xl font-black text-[#171638] mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-[#6E6D8F] leading-relaxed font-normal">
                  {step.description}
                </p>

                {/* Arrow connector between steps on desktop */}
                {!isLast && (
                  <div className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white border border-[#EAE6FD] items-center justify-center text-[#6035E8] shadow-md">
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
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

"use client";

import React from "react";
import Link from "next/link";
import { KeyRound, CheckCheck, Link2Off, UserCheck, ShieldAlert, ArrowRight } from "lucide-react";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { DonutRing } from "@/components/ui/DecorativeShapes";
import { useLanguage } from "@/hooks/useLanguage";

export function StayAlertSection() {
  const { lang, t } = useLanguage();
  const isHi = lang === "hi";

  const reminders = [
    {
      text: isHi
        ? "किसी भी परिस्थिति में अपना OTP किसी के साथ साझा न करें।"
        : "Never share OTPs with anyone under any circumstances.",
      icon: KeyRound,
    },
    {
      text: isHi
        ? "UPI ऐप में अनुरोध स्वीकृत करने से पहले स्वतंत्र रूप से पुष्टि करें।"
        : "Verify payment requests independently before approving in your UPI app.",
      icon: CheckCheck,
    },
    {
      text: isHi
        ? "SMS, WhatsApp या ईमेल में आए अज्ञात लिंक पर भरोसा न करें।"
        : "Do not trust unknown links sent via SMS, WhatsApp, or email.",
      icon: Link2Off,
    },
    {
      text: isHi
        ? "पैसे भेजने या मैंडेट स्वीकृत करने से पहले प्राप्तकर्ता की जांच करें।"
        : "Check the recipient before sending money or approving mandates.",
      icon: UserCheck,
    },
    {
      text: isHi
        ? "कोई भी जांच परिणाम यह गारंटी नहीं देता कि बातचीत पूरी तरह जोखिम-मुक्त है।"
        : "No lookup result guarantees that an interaction is completely risk-free.",
      icon: ShieldAlert,
    },
  ];

  return (
    <section className="mt-12 pt-4">
      <div className="rounded-[2.5rem] bg-white border border-[#EAE6FD] p-6 sm:p-10 shadow-xl shadow-[#6035E8]/5 relative overflow-hidden">
        {/* Decorative corner element */}
        <DonutRing
          size="lg"
          color="yellow"
          className="absolute -top-12 -right-12 opacity-40 pointer-events-none"
        />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6 pb-6 border-b border-[#EAE6FD] relative z-10">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-[#171638] tracking-tight">
              {isHi ? t.lookup.stayAlertTitle : "Stay Alert Even After Checking"}
            </h3>
            <p className="text-xs sm:text-sm text-[#545277] mt-1 font-medium">
              {isHi ? t.lookup.stayAlertDesc : "Fraudsters frequently rotate accounts, phone numbers, and domains to evade detection."}
            </p>
          </div>

          <Link href="/report" className="shrink-0">
            <PrimaryButton
              variant="purple"
              size="sm"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {isHi ? t.lookup.reportSuspiciousBtn : "Report a suspicious identifier"}
            </PrimaryButton>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 relative z-10">
          {reminders.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#F6F4FE] border border-[#EAE6FD] text-xs sm:text-sm text-[#171638] font-medium leading-relaxed hover:border-[#6035E8]/30 transition-all shadow-sm"
              >
                <div className="w-8 h-8 rounded-full bg-[#6035E8]/10 text-[#6035E8] flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <span>{item.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default StayAlertSection;

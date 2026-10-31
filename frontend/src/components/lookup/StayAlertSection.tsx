"use client";

import React from "react";
import Link from "next/link";
import { KeyRound, CheckCheck, Link2Off, UserCheck, ShieldAlert, ArrowRight } from "lucide-react";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
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
    <section className="mt-12 pt-8 border-t border-slate-800/80">
      <div className="rounded-2xl bg-slate-900/40 border border-slate-800 p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6 pb-6 border-b border-slate-800/80">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {isHi ? t.lookup.stayAlertTitle : "Stay Alert Even After Checking"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {isHi ? t.lookup.stayAlertDesc : "Fraudsters frequently rotate accounts, phone numbers, and domains to evade detection."}
            </p>
          </div>

          <Link href="/report" className="shrink-0">
            <PrimaryButton
              variant="outline"
              size="sm"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {isHi ? t.lookup.reportSuspiciousBtn : "Report a suspicious identifier"}
            </PrimaryButton>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {reminders.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-900/60 border border-slate-800/70 text-xs text-slate-300 leading-relaxed"
              >
                <div className="w-7 h-7 rounded-md bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5" />
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

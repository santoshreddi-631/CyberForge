"use client";

import React from "react";
import { KeyRound, QrCode, Link2Off, Smartphone, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { DonutRing } from "@/components/ui/DecorativeShapes";

export function SafetyTips() {
  const { lang, t } = useLanguage();
  const isHi = lang === "hi";

  const safetyTips = [
    {
      title: isHi ? "अपना OTP कभी साझा न करें" : "Protect Your OTPs",
      tip: isHi
        ? "अपना वन-टाइम पासवर्ड (OTP) कभी किसी के साथ साझा न करें। बैंक, पेमेंट गेटवे और सरकारी अधिकारी कभी भी आपका OTP नहीं मांगते।"
        : "Never share your OTP with anyone. Banks, payment gateways, and government officials will never request your one-time passwords.",
      icon: KeyRound,
      badge: "RULE 01",
      accent: "bg-[#FFF8E6] text-[#D19B00] border-[#FFE699]",
    },
    {
      title: isHi ? "UPI भुगतान अनुरोध जांचें" : "Verify UPI Requests",
      tip: isHi
        ? "पैसे भेजने से पहले हमेशा प्राप्तकर्ता की UPI ID सत्यापित करें। याद रखें: पैसे प्राप्त करने या कैशबैक पाने के लिए UPI पिन डालने की आवश्यकता नहीं होती।"
        : "Verify UPI payment requests before approving them. Remember: entering your UPI PIN is only required to send money, never to receive money or cashbacks.",
      icon: QrCode,
      badge: "RULE 02",
      accent: "bg-[#F0EDFF] text-[#6035E8] border-[#DCD3FC]",
    },
    {
      title: isHi ? "संदिग्ध लिंक से सावधान रहें" : "Beware of Suspicious Links",
      tip: isHi
        ? "SMS, WhatsApp या ईमेल में आए ऐसे लिंक पर कभी क्लिक न करें जो तत्काल KYC अपडेट, लॉटरी या बिजली बिल काटने की धमकी देते हों।"
        : "Avoid clicking suspicious links in SMS, WhatsApp, or emails claiming urgent KYC updates, lottery prizes, or bill disconnections.",
      icon: Link2Off,
      badge: "RULE 03",
      accent: "bg-[#E6FAF9] text-[#06A5A1] border-[#B2F3F1]",
    },
    {
      title: isHi ? "अज्ञात APK फ़ाइलें इंस्टॉल न करें" : "Block Unknown APK Files",
      tip: isHi
        ? "मैसेजिंग ऐप्स या अनसत्यापित वेबसाइटों से साझा की गई APK फ़ाइलें कभी इंस्टॉल न करें। दुर्भावनापूर्ण ऐप्स SMS हैक कर पैसे चुरा सकते हैं।"
        : "Never install unknown APK files shared through messaging apps or unverified websites. Fraudulent apps can hijack SMS and steal credentials.",
      icon: Smartphone,
      badge: "RULE 04",
      accent: "bg-[#FEECEB] text-rose-600 border-[#FDCAC7]",
    },
    {
      title: isHi ? "पहले व्यापारिक संपर्क सत्यापित करें" : "Verify Businesses First",
      tip: isHi
        ? "भुगतान करने से पहले किसी व्यवसाय या हेल्पलाइन की आधिकारिक वेबसाइट से पुष्टि करें। गूगल सर्च विज्ञापनों में दिए गए कस्टमर केयर नंबरों पर तुरंत भरोसा न करें।"
        : "Verify a business or contact before making payments. Cross-reference official websites and avoid trusting sponsored search ad phone numbers.",
      icon: ShieldCheck,
      badge: "RULE 05",
      accent: "bg-[#F0EDFF] text-[#6035E8] border-[#DCD3FC]",
    },
  ];

  return (
    <section className="relative py-16 md:py-24 bg-[#F6F4FE] overflow-hidden">
      {/* Decorative Donut */}
      <DonutRing
        color="yellow"
        size="md"
        className="absolute top-10 -right-8 opacity-70 pointer-events-none hidden md:block"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EAE6FD] text-xs font-black text-[#6035E8] uppercase tracking-wider mb-3">
            <span className="w-2 h-2 rounded-full bg-[#FFC928]" />
            <span>{isHi ? "आवश्यक नागरिक सुरक्षा" : "Essential Citizen Defense"}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#171638] tracking-tight">
            {isHi ? t.home.safetyTipsTitle : "Stay Safe Online"}
          </h2>
          <p className="mt-3 text-base text-[#6E6D8F] leading-relaxed">
            {isHi
              ? t.home.safetyTipsSubtitle
              : "Cyber criminals evolve their tactics rapidly. Memorize these fundamental guidelines to safeguard your digital finances."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {safetyTips.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="flex flex-col justify-between p-7 rounded-[2rem] bg-white border border-[#EAE6FD] shadow-[0_10px_30px_rgba(96,53,232,0.06)] hover:shadow-[0_16px_40px_rgba(96,53,232,0.12)] hover:-translate-y-1.5 transition-all duration-200"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${item.accent}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-black px-3 py-1 rounded-full bg-[#F6F4FE] text-[#6035E8] border border-[#EAE6FD]">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-[#171638] mb-2.5">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#6E6D8F] leading-relaxed font-normal">
                    {item.tip}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default SafetyTips;

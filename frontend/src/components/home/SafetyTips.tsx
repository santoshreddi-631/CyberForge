"use client";

import React from "react";
import { KeyRound, QrCode, Link2Off, Smartphone, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

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
    },
    {
      title: isHi ? "UPI भुगतान अनुरोध जांचें" : "Verify UPI Requests",
      tip: isHi
        ? "पैसे भेजने से पहले हमेशा प्राप्तकर्ता की UPI ID सत्यापित करें। याद रखें: पैसे प्राप्त करने या कैशबैक पाने के लिए UPI पिन डालने की आवश्यकता नहीं होती।"
        : "Verify UPI payment requests before approving them. Remember: entering your UPI PIN is only required to send money, never to receive money or cashbacks.",
      icon: QrCode,
    },
    {
      title: isHi ? "संदिग्ध लिंक से सावधान रहें" : "Beware of Suspicious Links",
      tip: isHi
        ? "SMS, WhatsApp या ईमेल में आए ऐसे लिंक पर कभी क्लिक न करें जो तत्काल KYC अपडेट, लॉटरी या बिजली बिल काटने की धमकी देते हों।"
        : "Avoid clicking suspicious links in SMS, WhatsApp, or emails claiming urgent KYC updates, lottery prizes, or bill disconnections.",
      icon: Link2Off,
    },
    {
      title: isHi ? "अज्ञात APK फ़ाइलें इंस्टॉल न करें" : "Block Unknown APK Files",
      tip: isHi
        ? "मैसेजिंग ऐप्स या अनसत्यापित वेबसाइटों से साझा की गई APK फ़ाइलें कभी इंस्टॉल न करें। दुर्भावनापूर्ण ऐप्स SMS हैक कर पैसे चुरा सकते हैं।"
        : "Never install unknown APK files shared through messaging apps or unverified websites. Fraudulent apps can hijack SMS and steal credentials.",
      icon: Smartphone,
    },
    {
      title: isHi ? "पहले व्यापारिक संपर्क सत्यापित करें" : "Verify Businesses First",
      tip: isHi
        ? "भुगतान करने से पहले किसी व्यवसाय या हेल्पलाइन की आधिकारिक वेबसाइट से पुष्टि करें। गूगल सर्च विज्ञापनों में दिए गए कस्टमर केयर नंबरों पर तुरंत भरोसा न करें।"
        : "Verify a business or contact before making payments. Cross-reference official websites and avoid trusting sponsored search ad phone numbers.",
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="py-12 md:py-20 border-b border-slate-800/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700/80 text-xs font-semibold text-teal-400 mb-3">
            <span>{isHi ? "आवश्यक नागरिक सुरक्षा" : "Essential Citizen Defense"}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {isHi ? t.home.safetyTipsTitle : "Stay Safe Online"}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-400 leading-relaxed">
            {isHi
              ? t.home.safetyTipsSubtitle
              : "Cyber criminals evolve their tactics rapidly. Memorize these fundamental guidelines to safeguard your digital finances."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {safetyTips.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="flex flex-col p-6 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-400">
                    {isHi ? `नियम 0${index + 1}` : `TIP 0${index + 1}`}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-slate-100 mb-2">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {item.tip}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default SafetyTips;

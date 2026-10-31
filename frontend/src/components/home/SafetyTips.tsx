import React from "react";
import { KeyRound, QrCode, Link2Off, Smartphone, ShieldCheck } from "lucide-react";

interface SafetyTip {
  title: string;
  tip: string;
  icon: React.ElementType;
}

const safetyTips: SafetyTip[] = [
  {
    title: "Protect Your OTPs",
    tip: "Never share your OTP with anyone. Banks, payment gateways, and government officials will never request your one-time passwords.",
    icon: KeyRound,
  },
  {
    title: "Verify UPI Requests",
    tip: "Verify UPI payment requests before approving them. Remember: entering your UPI PIN is only required to send money, never to receive money or cashbacks.",
    icon: QrCode,
  },
  {
    title: "Beware of Suspicious Links",
    tip: "Avoid clicking suspicious links in SMS, WhatsApp, or emails claiming urgent KYC updates, lottery prizes, or bill disconnections.",
    icon: Link2Off,
  },
  {
    title: "Block Unknown APK Files",
    tip: "Never install unknown APK files shared through messaging apps or unverified websites. Fraudulent apps can hijack SMS and steal credentials.",
    icon: Smartphone,
  },
  {
    title: "Verify Businesses First",
    tip: "Verify a business or contact before making payments. Cross-reference official websites and avoid trusting sponsored search ad phone numbers.",
    icon: ShieldCheck,
  },
];

export function SafetyTips() {
  return (
    <section className="py-12 md:py-20 border-b border-slate-800/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700/80 text-xs font-semibold text-teal-400 mb-3">
            <span>Essential Citizen Defense</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Stay Safe Online
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-400 leading-relaxed">
            Cyber criminals evolve their tactics rapidly. Memorize these fundamental guidelines to safeguard your digital finances.
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
                    TIP 0{index + 1}
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

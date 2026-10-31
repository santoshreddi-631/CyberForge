import React from "react";
import Link from "next/link";
import { KeyRound, CheckCheck, Link2Off, UserCheck, ShieldAlert, ArrowRight } from "lucide-react";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

const reminders = [
  {
    text: "Never share OTPs with anyone under any circumstances.",
    icon: KeyRound,
  },
  {
    text: "Verify payment requests independently before approving in your UPI app.",
    icon: CheckCheck,
  },
  {
    text: "Do not trust unknown links sent via SMS, WhatsApp, or email.",
    icon: Link2Off,
  },
  {
    text: "Check the recipient before sending money or approving mandates.",
    icon: UserCheck,
  },
  {
    text: "No lookup result guarantees that an interaction is completely risk-free.",
    icon: ShieldAlert,
  },
];

export function StayAlertSection() {
  return (
    <section className="mt-12 pt-8 border-t border-slate-800/80">
      <div className="rounded-2xl bg-slate-900/40 border border-slate-800 p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6 pb-6 border-b border-slate-800/80">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Stay Alert Even After Checking
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Fraudsters frequently rotate accounts, phone numbers, and domains to evade detection.
            </p>
          </div>

          <Link href="/report" className="shrink-0">
            <PrimaryButton
              variant="outline"
              size="sm"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Report a suspicious identifier
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

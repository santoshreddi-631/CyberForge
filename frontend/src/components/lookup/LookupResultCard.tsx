"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  ShieldQuestion,
  Clock,
  Layers,
  PlusCircle,
  Building2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/formatters";
import { BackendLookupResult, LookupVerdict } from "@/types";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useLanguage } from "@/hooks/useLanguage";

export interface LookupResultCardProps {
  result: BackendLookupResult;
  searchedValue: string;
}

export function LookupResultCard({ result, searchedValue }: LookupResultCardProps) {
  const { lang, t } = useLanguage();
  const isHi = lang === "hi";

  const {
    verdict,
    display_value,
    distinct_reporters,
    report_count,
    scam_type,
    first_seen,
    last_seen,
    evidence,
    challenged,
    business_name,
  } = result;

  const identifierText = display_value || searchedValue;

  const renderVerdictBadge = (v: LookupVerdict) => {
    switch (v) {
      case "KNOWN_SCAM":
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>{isHi ? t.lookup.verdictScam : "Known Scam"}</span>
          </div>
        );
      case "SUSPICIOUS":
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>{isHi ? t.lookup.verdictSuspicious : "Suspicious Activity"}</span>
          </div>
        );
      case "VERIFIED_BUSINESS":
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{isHi ? t.lookup.verdictBusiness : "Verified Official Entity"}</span>
          </div>
        );
      case "NO_REPORTS":
      default:
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider">
            <ShieldQuestion className="w-4 h-4 text-slate-400" />
            <span>{isHi ? t.lookup.verdictNoReports : "No Prior Reports"}</span>
          </div>
        );
    }
  };

  const getContainerStyle = (v: LookupVerdict) => {
    switch (v) {
      case "KNOWN_SCAM":
        return "border-rose-800/80 bg-rose-950/20 shadow-rose-950/30";
      case "SUSPICIOUS":
        return "border-amber-800/80 bg-amber-950/20 shadow-amber-950/30";
      case "VERIFIED_BUSINESS":
        return "border-emerald-800/80 bg-emerald-950/20 shadow-emerald-950/30";
      case "NO_REPORTS":
      default:
        return "border-slate-800 bg-slate-900/60 shadow-slate-950/40";
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border p-6 sm:p-8 shadow-xl transition-all duration-200",
        getContainerStyle(verdict)
      )}
    >
      {/* Top Header: Badge and Challenged / Dispute Tag */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          {renderVerdictBadge(verdict)}
          {challenged && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-950/60 border border-indigo-700/80 text-indigo-300 text-xs font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>{isHi ? "विवाद समीक्षाधीन" : "Under Dispute Review"}</span>
            </span>
          )}
        </div>

        <div className="text-xs text-slate-400 font-mono">
          {isHi ? "पूछताछ:" : "Query:"} <span className="text-slate-200 font-semibold">{identifierText}</span>
        </div>
      </div>

      {/* Main Verdict Specific Content */}
      {verdict === "KNOWN_SCAM" && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-bold text-rose-100 tracking-tight flex items-center gap-2.5">
              <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0" />
              <span>
                {isHi
                  ? "अत्यधिक जोखिम: समुदाय रिपोर्टों में प्रमाणित स्कैम"
                  : "High Risk: Identified in Community Scam Reports"}
              </span>
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {isHi
                ? "यह पहचानकर्ता नागरिकों द्वारा बार-बार धोखाधड़ी के लिए रिपोर्ट किया गया है। इस स्रोत को धन हस्तांतरित न करें, गोपनीय विवरण साझा न करें और न ही कोई भुगतान अनुरोध स्वीकार करें।"
                : "This identifier has been repeatedly reported by citizens for fraudulent activities. Do not transfer funds, share bank details, or approve payment requests from this source."}
            </p>
          </div>

          {/* Key Facts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
            {distinct_reporters !== undefined && (
              <div className="p-4 rounded-xl bg-slate-900/80 border border-rose-900/40">
                <div className="text-xs text-slate-400 font-medium">
                  {isHi ? t.lookup.reportCount : "Community Reports"}
                </div>
                <div className="text-lg font-bold text-rose-300 mt-1">
                  {isHi
                    ? `${distinct_reporters} नागरिकों द्वारा रिपोर्ट`
                    : `Reported by ${distinct_reporters} ${distinct_reporters === 1 ? "person" : "people"}`}
                </div>
                {report_count && report_count > distinct_reporters && (
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {isHi ? `(कुल ${report_count} सबमिशन)` : `(${report_count} total submissions)`}
                  </div>
                )}
              </div>
            )}

            {scam_type && (
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-xs text-slate-400 font-medium">
                  {isHi ? "धोखाधड़ी का पैटर्न" : "Reported Scam Pattern"}
                </div>
                <div className="text-sm font-semibold text-slate-200 mt-1 capitalize">
                  {scam_type.replace(/-/g, " ")}
                </div>
              </div>
            )}

            {(first_seen || last_seen) && (
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-xs text-slate-400 font-medium">
                  {isHi ? "गतिविधि समयरेखा" : "Activity Timeline"}
                </div>
                {last_seen && (
                  <div className="text-xs text-slate-300 mt-1">
                    <span className="text-slate-400">{isHi ? "ताज़ा:" : "Latest:"}</span> {formatDate(last_seen)}
                  </div>
                )}
                {first_seen && (
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {isHi ? "पहली रिपोर्ट:" : "First reported:"} {formatDate(first_seen)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Evidence List */}
          {evidence && evidence.length > 0 && (
            <div className="pt-4 border-t border-slate-800/80">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-400" />
                <span>
                  {isHi ? `दर्ज घटनाएं (${evidence.length})` : `Reported Incidents (${evidence.length})`}
                </span>
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {evidence.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-slate-900/70 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2 text-slate-300">
                      {item.channel && (
                        <span className="font-medium text-slate-200">{item.channel}</span>
                      )}
                      {item.scam_type && (
                        <span className="text-slate-400">• {item.scam_type}</span>
                      )}
                      {item.pincode && (
                        <span className="text-slate-400">• PIN {item.pincode}</span>
                      )}
                    </div>
                    {item.occurred_at && (
                      <span className="text-slate-400 font-mono text-[11px]">
                        {formatDate(item.occurred_at)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {verdict === "SUSPICIOUS" && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-bold text-amber-100 tracking-tight flex items-center gap-2.5">
              <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
              <span>{isHi ? "संदिग्ध गतिविधि दर्ज की गई" : "Suspicious Activity Reported"}</span>
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {isHi
                ? "इस पहचानकर्ता के विरुद्ध संदिग्ध गतिविधि दर्ज की गई है। वित्तीय लेन-देन या कोई जानकारी साझा करने से पहले स्वतंत्र रूप से पुष्टि अवश्य करें।"
                : "Suspicious activity has been reported or detected for this identifier. While not yet classified as a verified known scam, you should exercise high caution and verify the party independently before sharing information or funds."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            {distinct_reporters !== undefined && (
              <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-900/40">
                <div className="text-xs text-slate-400 font-medium">
                  {isHi ? t.lookup.reportCount : "Citizen Reports"}
                </div>
                <div className="text-base font-bold text-amber-300 mt-1">
                  {isHi
                    ? `${distinct_reporters} नागरिकों द्वारा रिपोर्ट`
                    : `Reported by ${distinct_reporters} ${distinct_reporters === 1 ? "person" : "people"}`}
                </div>
              </div>
            )}

            {scam_type && (
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-xs text-slate-400 font-medium">
                  {isHi ? "संदिग्ध पैटर्न" : "Suspected Pattern"}
                </div>
                <div className="text-sm font-semibold text-slate-200 mt-1 capitalize">
                  {scam_type.replace(/-/g, " ")}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {verdict === "NO_REPORTS" && (
        <div className="space-y-5">
          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
              <ShieldQuestion className="w-6 h-6 text-slate-400 shrink-0" />
              <span>{isHi ? "वर्तमान में कोई रिपोर्ट उपलब्ध नहीं है" : "No Reports Currently Available"}</span>
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {isHi
                ? "इस पहचानकर्ता के लिए समुदाय सुरक्षा नेटवर्क में फिलहाल कोई धोखाधड़ी रिपोर्ट दर्ज नहीं है।"
                : "There are currently no community scam reports registered for this identifier in the network."}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs sm:text-sm text-amber-200/90 space-y-1.5">
            <div className="font-semibold text-amber-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{isHi ? "महत्वपूर्ण सुरक्षा सलाह" : "Important Safety Advisory"}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isHi
                ? "रिपोर्ट न होने का अर्थ यह कतई नहीं है कि यह संपर्क सुरक्षित है। साइबर अपराधी हर मिनट नए नंबर और लिंक बनाते हैं। पैसे भेजने से पहले हमेशा प्राप्तकर्ता की पहचान स्वतंत्र रूप से सत्यापित करें।"
                : "Absence of reports does NOT mean the identifier is safe or legitimate. New scam numbers and phishing websites are registered every minute. Always verify the recipient independently before transferring money."}
            </p>
          </div>
        </div>
      )}

      {verdict === "VERIFIED_BUSINESS" && (
        <div className="space-y-5">
          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-bold text-emerald-100 tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
              <span>{isHi ? "सत्यापित आधिकारिक संस्थान" : "Verified Official Entity"}</span>
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {isHi
                ? "यह पहचानकर्ता आधिकारिक संस्थान, सत्यापित व्यापारी या राष्ट्रीय हेल्पलाइन के रूप में दर्ज है।"
                : "This identifier is registered as a verified official organization, verified merchant, or national helpline according to system records."}
            </p>
          </div>

          {business_name && (
            <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-900/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">
                  {isHi ? "पंजीकृत नाम" : "Registered Name"}
                </div>
                <div className="text-base font-bold text-emerald-300">{business_name}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-slate-400 text-center sm:text-left">
          {isHi
            ? "क्या इस पहचानकर्ता के साथ आपका कोई संदिग्ध अनुभव हुआ है?"
            : "Have you had a suspicious encounter with this identifier?"}
        </p>
        <Link href="/report">
          <PrimaryButton
            variant="secondary"
            size="sm"
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            {isHi ? t.lookup.reportThis : "Report This Identifier"}
          </PrimaryButton>
        </Link>
      </div>
    </div>
  );
}

export default LookupResultCard;

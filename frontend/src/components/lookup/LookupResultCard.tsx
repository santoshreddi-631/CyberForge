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
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500 text-white text-xs font-black uppercase tracking-wider shadow-sm">
            <ShieldAlert className="w-4 h-4 text-white" />
            <span>{isHi ? t.lookup.verdictScam : "Known Scam"}</span>
          </div>
        );
      case "SUSPICIOUS":
        return (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFC928] text-[#171638] text-xs font-black uppercase tracking-wider shadow-sm">
            <AlertTriangle className="w-4 h-4 text-[#171638]" />
            <span>{isHi ? t.lookup.verdictSuspicious : "Suspicious Activity"}</span>
          </div>
        );
      case "VERIFIED_BUSINESS":
        return (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-black uppercase tracking-wider shadow-sm">
            <ShieldCheck className="w-4 h-4 text-white" />
            <span>{isHi ? t.lookup.verdictBusiness : "Verified Official Entity"}</span>
          </div>
        );
      case "NO_REPORTS":
      default:
        return (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F0EDFF] text-[#6035E8] border border-[#DCD3FC] text-xs font-black uppercase tracking-wider">
            <ShieldQuestion className="w-4 h-4 text-[#6035E8]" />
            <span>{isHi ? t.lookup.verdictNoReports : "No Prior Reports"}</span>
          </div>
        );
    }
  };

  const getContainerStyle = (v: LookupVerdict) => {
    switch (v) {
      case "KNOWN_SCAM":
        return "border-2 border-rose-300 bg-white shadow-[0_16px_50px_rgba(244,63,94,0.1)]";
      case "SUSPICIOUS":
        return "border-2 border-amber-300 bg-white shadow-[0_16px_50px_rgba(245,158,11,0.1)]";
      case "VERIFIED_BUSINESS":
        return "border-2 border-emerald-300 bg-white shadow-[0_16px_50px_rgba(16,185,129,0.1)]";
      case "NO_REPORTS":
      default:
        return "border border-[#EAE6FD] bg-white shadow-[0_16px_50px_rgba(96,53,232,0.06)]";
    }
  };

  return (
    <div
      className={cn(
        "rounded-[2.5rem] p-7 sm:p-10 transition-all duration-200 text-[#171638]",
        getContainerStyle(verdict)
      )}
    >
      {/* Top Header: Badge and Challenged / Dispute Tag */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-[#F0EDFF]">
        <div className="flex items-center gap-3">
          {renderVerdictBadge(verdict)}
          {challenged && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0EDFF] border border-[#DCD3FC] text-[#6035E8] text-xs font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>{isHi ? "विवाद समीक्षाधीन" : "Under Dispute Review"}</span>
            </span>
          )}
        </div>

        <div className="text-xs text-[#6E6D8F] font-mono">
          {isHi ? "पूछताछ:" : "Query:"} <span className="text-[#171638] font-bold text-sm">{identifierText}</span>
        </div>
      </div>

      {/* Main Verdict Specific Content */}
      {verdict === "KNOWN_SCAM" && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl sm:text-3xl font-black text-rose-700 tracking-tight flex items-center gap-3">
              <ShieldAlert className="w-7 h-7 text-rose-600 shrink-0" />
              <span>
                {isHi
                  ? "अत्यधिक जोखिम: समुदाय रिपोर्टों में प्रमाणित स्कैम"
                  : "High Risk: Identified in Community Scam Reports"}
              </span>
            </h3>
            <p className="text-sm text-[#6E6D8F] leading-relaxed">
              {isHi
                ? "यह पहचानकर्ता नागरिकों द्वारा बार-बार धोखाधड़ी के लिए रिपोर्ट किया गया है। इस स्रोत को धन हस्तांतरित न करें, गोपनीय विवरण साझा न करें और न ही कोई भुगतान अनुरोध स्वीकार करें।"
                : "This identifier has been repeatedly reported by citizens for fraudulent activities. Do not transfer funds, share bank details, or approve payment requests from this source."}
            </p>
          </div>

          {/* Key Facts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {distinct_reporters !== undefined && (
              <div className="p-5 rounded-2xl bg-[#F6F4FE] border border-[#EAE6FD]">
                <div className="text-xs text-[#6E6D8F] font-bold">
                  {isHi ? t.lookup.reportCount : "Community Reports"}
                </div>
                <div className="text-xl font-black text-rose-600 mt-1">
                  {isHi
                    ? `${distinct_reporters} नागरिकों द्वारा रिपोर्ट`
                    : `Reported by ${distinct_reporters} ${distinct_reporters === 1 ? "person" : "people"}`}
                </div>
                {report_count && report_count > distinct_reporters && (
                  <div className="text-[11px] text-[#837FA8] mt-0.5 font-medium">
                    {isHi ? `(कुल ${report_count} सबमिशन)` : `(${report_count} total submissions)`}
                  </div>
                )}
              </div>
            )}

            {scam_type && (
              <div className="p-5 rounded-2xl bg-[#F6F4FE] border border-[#EAE6FD]">
                <div className="text-xs text-[#6E6D8F] font-bold">
                  {isHi ? "धोखाधड़ी का पैटर्न" : "Reported Scam Pattern"}
                </div>
                <div className="text-base font-black text-[#171638] mt-1 capitalize">
                  {scam_type.replace(/-/g, " ")}
                </div>
              </div>
            )}

            {(first_seen || last_seen) && (
              <div className="p-5 rounded-2xl bg-[#F6F4FE] border border-[#EAE6FD]">
                <div className="text-xs text-[#6E6D8F] font-bold">
                  {isHi ? "गतिविधि समयरेखा" : "Activity Timeline"}
                </div>
                {last_seen && (
                  <div className="text-xs text-[#171638] font-bold mt-1">
                    <span className="text-[#6E6D8F] font-normal">{isHi ? "ताज़ा:" : "Latest:"}</span> {formatDate(last_seen)}
                  </div>
                )}
                {first_seen && (
                  <div className="text-[11px] text-[#837FA8] mt-0.5">
                    {isHi ? "पहली रिपोर्ट:" : "First reported:"} {formatDate(first_seen)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Evidence List */}
          {evidence && evidence.length > 0 && (
            <div className="pt-6 border-t border-[#F0EDFF]">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#6035E8] mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>
                  {isHi ? `दर्ज घटनाएं (${evidence.length})` : `Reported Incidents (${evidence.length})`}
                </span>
              </h4>
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {evidence.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl bg-[#F6F4FE] border border-[#EAE6FD] text-xs"
                  >
                    <div className="flex items-center gap-2 text-[#171638]">
                      {item.channel && (
                        <span className="font-black text-[#6035E8]">{item.channel}</span>
                      )}
                      {item.scam_type && (
                        <span className="text-[#6E6D8F] font-semibold">• {item.scam_type}</span>
                      )}
                      {item.pincode && (
                        <span className="text-[#6E6D8F]">• PIN {item.pincode}</span>
                      )}
                    </div>
                    {item.occurred_at && (
                      <span className="text-[#837FA8] font-mono text-[11px] font-semibold">
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
            <h3 className="text-2xl sm:text-3xl font-black text-amber-800 tracking-tight flex items-center gap-3">
              <AlertTriangle className="w-7 h-7 text-amber-600 shrink-0" />
              <span>{isHi ? "संदिग्ध गतिविधि दर्ज की गई" : "Suspicious Activity Reported"}</span>
            </h3>
            <p className="text-sm text-[#6E6D8F] leading-relaxed">
              {isHi
                ? "इस पहचानकर्ता के विरुद्ध संदिग्ध गतिविधि दर्ज की गई है। वित्तीय लेन-देन या कोई जानकारी साझा करने से पहले स्वतंत्र रूप से पुष्टि अवश्य करें।"
                : "Suspicious activity has been reported or detected for this identifier. While not yet classified as a verified known scam, you should exercise high caution and verify the party independently before sharing information or funds."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {distinct_reporters !== undefined && (
              <div className="p-5 rounded-2xl bg-[#F6F4FE] border border-[#EAE6FD]">
                <div className="text-xs text-[#6E6D8F] font-bold">
                  {isHi ? t.lookup.reportCount : "Citizen Reports"}
                </div>
                <div className="text-xl font-black text-amber-800 mt-1">
                  {isHi
                    ? `${distinct_reporters} नागरिकों द्वारा रिपोर्ट`
                    : `Reported by ${distinct_reporters} ${distinct_reporters === 1 ? "person" : "people"}`}
                </div>
              </div>
            )}

            {scam_type && (
              <div className="p-5 rounded-2xl bg-[#F6F4FE] border border-[#EAE6FD]">
                <div className="text-xs text-[#6E6D8F] font-bold">
                  {isHi ? "संदिग्ध पैटर्न" : "Suspected Pattern"}
                </div>
                <div className="text-base font-black text-[#171638] mt-1 capitalize">
                  {scam_type.replace(/-/g, " ")}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {verdict === "NO_REPORTS" && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl sm:text-3xl font-black text-[#171638] tracking-tight flex items-center gap-3">
              <ShieldQuestion className="w-7 h-7 text-[#6035E8] shrink-0" />
              <span>{isHi ? "वर्तमान में कोई रिपोर्ट उपलब्ध नहीं है" : "No Reports Currently Available"}</span>
            </h3>
            <p className="text-sm text-[#6E6D8F] leading-relaxed font-normal">
              {isHi
                ? "इस पहचानकर्ता के लिए समुदाय सुरक्षा नेटवर्क में फिलहाल कोई धोखाधड़ी रिपोर्ट दर्ज नहीं है।"
                : "There are currently no community scam reports registered for this identifier in the network."}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#FFF8E6] border border-[#FFE699] text-xs sm:text-sm text-[#A87B00] space-y-2">
            <div className="font-black text-[#D19B00] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{isHi ? "महत्वपूर्ण सुरक्षा सलाह" : "Important Safety Advisory"}</span>
            </div>
            <p className="text-xs text-[#805E00] leading-relaxed">
              {isHi
                ? "रिपोर्ट न होने का अर्थ यह कतई नहीं है कि यह संपर्क सुरक्षित है। साइबर अपराधी हर मिनट नए नंबर और लिंक बनाते हैं। पैसे भेजने से पहले हमेशा प्राप्तकर्ता की पहचान स्वतंत्र रूप से सत्यापित करें।"
                : "Absence of reports does NOT mean the identifier is safe or legitimate. New scam numbers and phishing websites are registered every minute. Always verify the recipient independently before transferring money."}
            </p>
          </div>
        </div>
      )}

      {verdict === "VERIFIED_BUSINESS" && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-800 tracking-tight flex items-center gap-3">
              <ShieldCheck className="w-7 h-7 text-emerald-600 shrink-0" />
              <span>{isHi ? "सत्यापित आधिकारिक संस्थान" : "Verified Official Entity"}</span>
            </h3>
            <p className="text-sm text-[#6E6D8F] leading-relaxed">
              {isHi
                ? "यह पहचानकर्ता आधिकारिक संस्थान, सत्यापित व्यापारी या राष्ट्रीय हेल्पलाइन के रूप में दर्ज है।"
                : "This identifier is registered as a verified official organization, verified merchant, or national helpline according to system records."}
            </p>
          </div>

          {business_name && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-emerald-800 font-bold uppercase tracking-wider">
                  {isHi ? "पंजीकृत नाम" : "Registered Name"}
                </div>
                <div className="text-lg font-black text-emerald-950 mt-0.5">{business_name}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="mt-8 pt-6 border-t border-[#F0EDFF] flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-[#6E6D8F] text-center sm:text-left font-medium">
          {isHi
            ? "क्या इस पहचानकर्ता के साथ आपका कोई संदिग्ध अनुभव हुआ है?"
            : "Have you had a suspicious encounter with this identifier?"}
        </p>
        <Link href="/report">
          <PrimaryButton
            variant="purple"
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

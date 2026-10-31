"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  AlertCircle,
  Loader2,
  Home,
  Search,
  ChevronDown,
  MapPin,
  EyeOff,
  Info,
  Calendar,
  IndianRupee,
  FileCheck,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { LookupIdentifierType, ScamCategory } from "@/types";
import { validateIdentifier } from "@/lib/utils/lookupValidation";
import { apiClient, ApiError } from "@/lib/api/client";
import { CreateReportResponseContract } from "@/lib/contracts";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useLanguage } from "@/hooks/useLanguage";
import { ReportIdentifierSelector, REPORT_IDENTIFIER_OPTIONS } from "./ReportIdentifierSelector";
import {
  REPORT_SCAM_TYPES,
  MONITORED_AREAS,
  REPORT_CHANNELS,
  ReportChannel,
} from "@/lib/constants/reportOptions";

// Scam category options matching contract ScamCategory enum and PRD Appendix C
const CATEGORY_OPTIONS: { value: ScamCategory; label: string; labelHi: string }[] = [
  { value: "upi_fraud", label: "UPI / Payment Fraud", labelHi: "UPI / भुगतान धोखाधड़ी" },
  { value: "phishing_url", label: "Phishing Link / Fake Website", labelHi: "फ़िशिंग लिंक / नकली वेबसाइट" },
  { value: "part_time_job", label: "Part-Time Job / Task Scam", labelHi: "पार्ट-टाइम जॉब / टास्क स्कैम" },
  { value: "lottery_kbc", label: "Lottery / Prize Scam", labelHi: "लॉटरी / इनाम धोखाधड़ी" },
  { value: "courier_customs", label: "Parcel / Customs Fine Scam", labelHi: "पार्सल / सीमा शुल्क जुर्माना स्कैम" },
  { value: "loan_app", label: "Loan App Harassment", labelHi: "लोन ऐप उत्पीड़न" },
  { value: "deepfake_impersonation", label: "Digital Arrest / Deepfake", labelHi: "डिजिटल अरेस्ट / डीपफेक" },
  { value: "aadhaar_pan", label: "Aadhaar / PAN / KYC Fraud", labelHi: "आधार / पैन / KYC फ्रॉड" },
  { value: "crypto_investment", label: "Crypto / Investment Scam", labelHi: "क्रिप्टो / निवेश धोखाधड़ी" },
  { value: "electricity_bill", label: "Electricity / Utility Scam", labelHi: "बिजली बिल / उपयोगिता बिल स्कैम" },
  { value: "fake_customer_care", label: "Fake Customer Care Number", labelHi: "नकली ग्राहक सेवा नंबर" },
  { value: "otp_call", label: "OTP / Banking Verification Call", labelHi: "ओटीपी / बैंक सत्यापन कॉल" },
  { value: "sextortion", label: "Video Call Extortion / Sextortion", labelHi: "वीडियो कॉल ब्लैकमेल / सेक्सटॉर्शन" },
  { value: "other", label: "Other Scam Pattern", labelHi: "अन्य फ्रॉड पैटर्न" },
];

// Indian states for optional area field
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu & Kashmir", "Ladakh", "Puducherry", "Chandigarh",
];

interface FormData {
  identifierType: LookupIdentifierType;
  identifierValue: string;
  category: ScamCategory | "";
  channel: ReportChannel;
  incidentDate: string;
  title: string;
  description: string;
  amountLostInr: string;
  hasScreenshot: boolean;
  state: string;
  city: string;
  pincode: string;
}

interface FormErrors {
  identifierValue?: string;
  category?: string;
  channel?: string;
  incidentDate?: string;
  title?: string;
  description?: string;
  amountLostInr?: string;
  pincode?: string;
}

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; data: CreateReportResponseContract }
  | { status: "error"; title: string; description: string; canRetry: boolean };

function mapCategoryToScamType(category: string): string {
  const mapping: Record<string, string> = {
    upi_fraud: "upi-refund-qr",
    phishing_url: "fake-kyc-link",
    part_time_job: "job-offer",
    lottery_kbc: "lottery-prize",
    courier_customs: "courier-customs",
    loan_app: "loan-app-harassment",
    deepfake_impersonation: "digital-arrest",
    aadhaar_pan: "fake-kyc-link",
    crypto_investment: "investment-group",
    electricity_bill: "electricity-disconnection",
    fake_customer_care: "fake-customer-care",
    otp_call: "otp-call",
    sextortion: "sextortion",
  };
  return mapping[category] || category || "other";
}

function getDefaultChannelForIdentifier(type: LookupIdentifierType): ReportChannel {
  if (type === "url") return "Fake website";
  if (type === "upi") return "UPI request";
  if (type === "sender_id") return "SMS or WhatsApp";
  return "Phone call";
}

export function ReportFormContainer() {
  const { lang, t } = useLanguage();
  const isHi = lang === "hi";

  const [form, setForm] = useState<FormData>({
    identifierType: "phone",
    identifierValue: "",
    category: "",
    channel: "Phone call",
    incidentDate: "",
    title: "",
    description: "",
    amountLostInr: "0",
    hasScreenshot: false,
    state: "",
    city: "",
    pincode: "",
  });
  const [todayStr, setTodayStr] = useState<string>("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });

  useEffect(() => {
    const timer = setTimeout(() => {
      const today = new Date().toISOString().slice(0, 10);
      setTodayStr(today);
      setForm((prev) => (prev.incidentDate ? prev : { ...prev, incidentDate: today }));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const isSubmitting = submitState.status === "submitting";

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const handleIdentifierTypeSelect = (type: LookupIdentifierType) => {
    setForm((prev) => ({
      ...prev,
      identifierType: type,
      channel: getDefaultChannelForIdentifier(type),
    }));
    if (errors.identifierValue) {
      setErrors((prev) => ({ ...prev, identifierValue: undefined }));
    }
  };

  const currentOption =
    REPORT_IDENTIFIER_OPTIONS.find((o) => o.type === form.identifierType) ||
    REPORT_IDENTIFIER_OPTIONS[0];

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    const idValidation = validateIdentifier(form.identifierType, form.identifierValue);
    if (!idValidation.isValid) {
      newErrors.identifierValue =
        idValidation.errorMessage || (isHi ? "कृपया एक मान्य पहचानकर्ता दर्ज करें।" : "Please enter a valid identifier.");
    }

    if (!form.category) {
      newErrors.category = isHi ? "कृपया धोखाधड़ी का प्रकार चुनें।" : "Please select the type of scam.";
    }

    if (!form.channel) {
      newErrors.channel = isHi ? "कृपया संपर्क का माध्यम चुनें।" : "Please select the contact channel.";
    }

    if (form.incidentDate) {
      const chosen = new Date(form.incidentDate);
      const now = new Date();
      if (isNaN(chosen.getTime())) {
        newErrors.incidentDate = isHi ? "कृपया एक मान्य तारीख चुनें।" : "Please select a valid date.";
      } else if (chosen.getTime() > now.getTime() + 86400000) {
        newErrors.incidentDate = isHi ? "घटना की तारीख भविष्य की नहीं हो सकती।" : "Incident date cannot be in the future.";
      }
    }

    const titleTrimmed = form.title.trim();
    if (!titleTrimmed) {
      newErrors.title = isHi ? "कृपया रिपोर्ट के लिए एक संक्षिप्त शीर्षक प्रदान करें।" : "Please provide a brief title for the report.";
    } else if (titleTrimmed.length < 5) {
      newErrors.title = isHi ? "शीर्षक कम से कम 5 अक्षरों का होना चाहिए।" : "Title should be at least 5 characters.";
    } else if (titleTrimmed.length > 120) {
      newErrors.title = isHi ? "शीर्षक 120 अक्षरों से अधिक नहीं हो सकता।" : "Title must not exceed 120 characters.";
    }

    const descTrimmed = form.description.trim();
    if (!descTrimmed) {
      newErrors.description = isHi ? "कृपया संक्षेप में बताएं कि क्या हुआ।" : "Please describe what happened.";
    } else if (descTrimmed.length < 20) {
      newErrors.description = isHi ? "कृपया कम से कम 20 अक्षरों का विवरण प्रदान करें।" : "Please provide at least 20 characters describing the incident.";
    } else if (descTrimmed.length > 1000) {
      newErrors.description = isHi ? "विवरण 1000 अक्षरों से अधिक नहीं हो सकता।" : "Description must not exceed 1000 characters.";
    }

    if (form.amountLostInr.trim() !== "") {
      const num = parseFloat(form.amountLostInr);
      if (isNaN(num) || num < 0) {
        newErrors.amountLostInr = isHi ? "कृपया एक मान्य गैर-नकारात्मक राशि दर्ज करें।" : "Please enter a valid non-negative amount.";
      } else if (num > 99_999_999_999_999) {
        newErrors.amountLostInr = isHi ? "राशि अनुमत सीमा से अधिक है।" : "Amount exceeds permissible limit.";
      }
    }

    if (form.pincode && !/^\d{6}$/.test(form.pincode)) {
      newErrors.pincode = isHi ? "पिन कोड 6 अंकों का होना चाहिए।" : "PIN code must be exactly 6 digits.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setSubmitState({ status: "submitting" });

    const enteredPin = form.pincode.trim();
    const isValidPin = /^\d{6}$/.test(enteredPin);
    const matchedArea = isValidPin ? MONITORED_AREAS.find((a) => a.code === enteredPin) : undefined;

    const pincode = isValidPin ? enteredPin : "560102";
    const city = form.city.trim() || matchedArea?.city || "India";
    const locality = matchedArea?.area || form.city.trim() || `Area ${pincode}`;

    const reportId = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `report-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    let reporterId = typeof window !== "undefined" ? localStorage.getItem("scammap_reporter_id") : null;
    if (!reporterId) {
      reporterId = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `reporter-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      if (typeof window !== "undefined") {
        try { localStorage.setItem("scammap_reporter_id", reporterId); } catch {}
      }
    }

    const nowIso = new Date().toISOString();
    let occurredAt = nowIso;
    if (form.incidentDate) {
      const parsedDate = new Date(`${form.incidentDate}T12:00:00Z`);
      if (!isNaN(parsedDate.getTime()) && parsedDate.getTime() <= new Date(nowIso).getTime()) {
        occurredAt = parsedDate.toISOString();
      }
    }

    const rawAmount = parseFloat(form.amountLostInr);
    const amountLostInr = isNaN(rawAmount) || rawAmount < 0 ? 0 : rawAmount;

    const payload = {
      report_id: reportId,
      occurred_at: occurredAt,
      reported_at: nowIso,
      reporter_id: reporterId,
      ip_prefix: "103.21.244.0/24",
      channel: form.channel,
      scam_type: mapCategoryToScamType(form.category),
      identifier_type: form.identifierType,
      identifier_value: form.identifierValue.trim(),
      pincode: form.pincode.trim() || matchedArea.code,
      locality: matchedArea.area,
      city: form.city.trim() || matchedArea.city,
      note: form.description.trim() || form.title.trim() || null,
      has_screenshot: Boolean(form.hasScreenshot),
      amount_lost_inr: amountLostInr,
    };

    try {
      const response = await apiClient.post<CreateReportResponseContract>("/reports", payload);
      setSubmitState({ status: "success", data: response });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 400) {
          const detail =
            typeof err.data === "object" && err.data !== null && "error" in err.data
              ? String((err.data as { error: unknown }).error)
              : err.message || (isHi ? "सबमिशन अस्वीकृत हुआ। कृपया फ़ील्ड्स की जांच करें।" : "The submission was rejected. Please review your entries.");

          setSubmitState({
            status: "error",
            title: isHi ? "अमान्य सबमिशन" : "Invalid Submission",
            description: detail,
            canRetry: true,
          });
        } else if (err.status === 429) {
          setSubmitState({
            status: "error",
            title: isHi ? "सबमिशन सीमा पार हो गई" : "Submission Rate Limit Exceeded",
            description: isHi ? "आपने कम समय में बहुत अधिक रिपोर्ट दर्ज की हैं। कृपया कुछ देर प्रतीक्षा करें।" : "You have submitted multiple reports recently. Please wait a few moments before trying again.",
            canRetry: true,
          });
        } else {
          setSubmitState({
            status: "error",
            title: isHi ? "रिपोर्ट सबमिट करने में असमर्थ" : "Unable to Submit Report",
            description: isHi ? "सर्वर से कनेक्ट करने में समस्या हुई। कृपया पुनः प्रयास करें।" : "A server disruption occurred while processing your report. Please try again shortly.",
            canRetry: true,
          });
        }
      } else {
        setSubmitState({
          status: "error",
          title: isHi ? "सेवा अस्थायी रूप से अनुपलब्ध है" : "Service Temporarily Unavailable",
          description: isHi ? "रिपोर्टिंग सेवा से संपर्क नहीं हो सका। कृपया अपनी कनेक्टिविटी जांचें और पुनः प्रयास करें।" : "Could not connect to the reporting service. Please check your connection and try again.",
          canRetry: true,
        });
      }
    }
  };

  // ── Success State ──────────────────────────────────────────────────
  if (submitState.status === "success") {
    const { data } = submitState;
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="rounded-[2.5rem] bg-white border border-[#EAE6FD] p-8 sm:p-12 text-center space-y-6 shadow-xl shadow-[#6035E8]/5">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-[#171638] tracking-tight">
              {t.report.successTitle}
            </h2>
            <p className="text-sm sm:text-base text-[#545277] leading-relaxed max-w-md mx-auto">
              {t.report.successDesc}
            </p>
          </div>

          {(data.referenceNumber || data.report_id || data.case_id) && (
            <div className="inline-flex flex-col items-center gap-1.5 px-6 py-4 rounded-2xl bg-[#F0EDFF] border border-[#DDD6FE] text-sm shadow-sm">
              <span className="text-xs text-[#6035E8] font-black uppercase tracking-wider">{t.report.refNumber}</span>
              <span className="font-mono font-black text-[#171638] text-lg tracking-wide">
                {data.referenceNumber || data.report_id || data.case_id}
              </span>
              <span className="text-[11px] text-[#837FA8] font-medium">
                {isHi ? "भविष्य के संदर्भ के लिए इसे सुरक्षित रखें" : "Keep this for your records"}
              </span>
            </div>
          )}

          <p className="text-xs text-[#837FA8] max-w-sm mx-auto leading-relaxed">
            {isHi
              ? "कृपया एक ही घटना के लिए दोबारा रिपोर्ट दर्ज न करें। नेटवर्क इसकी समीक्षा करेगा।"
              : "Please avoid submitting duplicate reports for the same incident. The backend tracks reports and will process this submission."}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <Link href="/">
              <PrimaryButton variant="purple" size="md" leftIcon={<Home className="w-4 h-4" />}>
                {t.report.returnHome}
              </PrimaryButton>
            </Link>
            <Link href="/lookup">
              <PrimaryButton variant="secondary" size="md" leftIcon={<Search className="w-4 h-4" />}>
                {t.report.checkAnother}
              </PrimaryButton>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Form State ─────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Error Banner (network/server errors) */}
      {submitState.status === "error" && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-sm shadow-sm"
        >
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-rose-900">{submitState.title}</p>
            <p className="text-rose-700 text-xs mt-0.5 leading-relaxed">{submitState.description}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* ── SECTION 1: Identifier ─────────────────────────────── */}
        <section className="rounded-[2rem] bg-white border border-[#EAE6FD] p-6 sm:p-8 space-y-5 shadow-sm">
          <div>
            <h2 className="text-sm sm:text-base font-black text-[#171638] uppercase tracking-wider">
              {t.report.step1}
            </h2>
            <p className="text-xs sm:text-sm text-[#545277] mt-1 font-medium">
              {t.report.step1Desc}
            </p>
          </div>

          <ReportIdentifierSelector
            selectedType={form.identifierType}
            onSelect={handleIdentifierTypeSelect}
            disabled={isSubmitting}
          />

          <div className="space-y-1.5">
            <label htmlFor="report-identifier-input" className="block text-xs font-bold text-[#171638] uppercase tracking-wider">
              {isHi ? currentOption.labelHi : currentOption.label} <span className="text-rose-500">*</span>
            </label>
            <input
              id="report-identifier-input"
              type="text"
              value={form.identifierValue}
              disabled={isSubmitting}
              onChange={(e) => setField("identifierValue", e.target.value)}
              placeholder={isHi ? currentOption.placeholderHi : currentOption.placeholder}
              className={cn(
                "w-full h-12 px-4 rounded-xl bg-[#F6F4FE] border text-[#171638] placeholder:text-[#837FA8] text-sm outline-none transition-colors",
                errors.identifierValue
                  ? "border-rose-400 focus:border-rose-500 bg-rose-50/30"
                  : "border-[#EAE6FD] hover:border-[#6035E8]/40 focus:border-[#6035E8] focus:bg-white focus:ring-4 focus:ring-[#6035E8]/10"
              )}
            />
            {errors.identifierValue && (
              <p className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold" role="alert">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.identifierValue}
              </p>
            )}
          </div>
        </section>

        {/* ── SECTION 2: Scam Details & Contact Medium ───────────── */}
        <section className="rounded-[2rem] bg-white border border-[#EAE6FD] p-6 sm:p-8 space-y-5 shadow-sm">
          <div>
            <h2 className="text-sm sm:text-base font-black text-[#171638] uppercase tracking-wider">
              {t.report.step2}
            </h2>
            <p className="text-xs sm:text-sm text-[#545277] mt-1 font-medium">
              {t.report.step2Desc}
            </p>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label htmlFor="report-category" className="block text-xs font-bold text-[#171638] uppercase tracking-wider">
              {t.report.categoryLabel} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                id="report-category"
                value={form.category}
                disabled={isSubmitting}
                onChange={(e) => setField("category", e.target.value as ScamCategory | "")}
                className={cn(
                  "w-full h-12 pl-4 pr-10 rounded-xl bg-[#F6F4FE] border text-sm outline-none transition-colors appearance-none cursor-pointer",
                  form.category ? "text-[#171638]" : "text-[#837FA8]",
                  errors.category
                    ? "border-rose-400 focus:border-rose-500 bg-rose-50/30"
                    : "border-[#EAE6FD] hover:border-[#6035E8]/40 focus:border-[#6035E8] focus:bg-white focus:ring-4 focus:ring-[#6035E8]/10"
                )}
              >
                <option value="" disabled>{t.report.selectCategory}</option>
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-white text-[#171638]">
                    {isHi ? opt.labelHi : opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#837FA8] pointer-events-none" />
            </div>
            {errors.category && (
              <p className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold" role="alert">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.category}
              </p>
            )}
          </div>

          {/* Channel / Contact Medium */}
          <div className="space-y-1.5">
            <label htmlFor="report-channel" className="block text-xs font-bold text-[#171638] uppercase tracking-wider">
              {t.report.channelLabel} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                id="report-channel"
                value={form.channel}
                disabled={isSubmitting}
                onChange={(e) => setField("channel", e.target.value as ReportChannel)}
                className={cn(
                  "w-full h-12 pl-4 pr-10 rounded-xl bg-[#F6F4FE] border text-sm outline-none transition-colors appearance-none cursor-pointer text-[#171638]",
                  errors.channel
                    ? "border-rose-400 focus:border-rose-500 bg-rose-50/30"
                    : "border-[#EAE6FD] hover:border-[#6035E8]/40 focus:border-[#6035E8] focus:bg-white focus:ring-4 focus:ring-[#6035E8]/10"
                )}
              >
                {REPORT_CHANNELS.map((ch) => (
                  <option key={ch.value} value={ch.value} className="bg-white text-[#171638]">
                    {isHi ? ch.labelHi : ch.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#837FA8] pointer-events-none" />
            </div>
            <p className="text-[11px] text-[#837FA8] font-medium">
              {t.report.channelHelp}
            </p>
          </div>

          {/* Incident Date */}
          <div className="space-y-1.5">
            <label htmlFor="report-incident-date" className="block text-xs font-bold text-[#171638] uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#6035E8]" />
              <span>{t.report.incidentDateLabel}</span>
            </label>
            <input
              id="report-incident-date"
              type="date"
              max={todayStr || undefined}
              value={form.incidentDate}
              disabled={isSubmitting}
              onChange={(e) => setField("incidentDate", e.target.value)}
              className={cn(
                "w-full h-12 px-4 rounded-xl bg-[#F6F4FE] border text-[#171638] text-sm outline-none transition-colors",
                errors.incidentDate
                  ? "border-rose-400 focus:border-rose-500 bg-rose-50/30"
                  : "border-[#EAE6FD] hover:border-[#6035E8]/40 focus:border-[#6035E8] focus:bg-white focus:ring-4 focus:ring-[#6035E8]/10"
              )}
            />
            {errors.incidentDate && (
              <p className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold" role="alert">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.incidentDate}
              </p>
            )}
            <p className="text-[11px] text-[#837FA8] font-medium">
              {t.report.incidentDateHelp}
            </p>
          </div>

          {/* Scam Pattern Context Note */}
          {form.category && (
            <div className="p-4 rounded-xl bg-[#F0EDFF] border border-[#DDD6FE] text-xs text-[#545277] flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#6035E8] shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                {REPORT_SCAM_TYPES.find(
                  (s) =>
                    s.type === form.category.replace(/_/g, "-").replace("aadhaar-pan", "fake-kyc-link")
                )?.description ?? (isHi ? "विस्तार से बताएं ताकि अन्य नागरिक इस पैटर्न को पहचान सकें।" : "Describe what happened so others can recognise the pattern.")}
              </span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label htmlFor="report-title" className="block text-xs font-bold text-[#171638] uppercase tracking-wider">
              {t.report.titleLabel} <span className="text-rose-500">*</span>
            </label>
            <input
              id="report-title"
              type="text"
              value={form.title}
              disabled={isSubmitting}
              onChange={(e) => setField("title", e.target.value)}
              maxLength={120}
              placeholder={t.report.titlePlaceholder}
              className={cn(
                "w-full h-12 px-4 rounded-xl bg-[#F6F4FE] border text-[#171638] placeholder:text-[#837FA8] text-sm outline-none transition-colors",
                errors.title
                  ? "border-rose-400 focus:border-rose-500 bg-rose-50/30"
                  : "border-[#EAE6FD] hover:border-[#6035E8]/40 focus:border-[#6035E8] focus:bg-white focus:ring-4 focus:ring-[#6035E8]/10"
              )}
            />
            <div className="flex items-center justify-between">
              {errors.title ? (
                <p className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold" role="alert">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.title}
                </p>
              ) : (
                <span />
              )}
              <span className="text-[11px] text-[#837FA8] font-medium ml-auto">{form.title.length}/120</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="report-description" className="block text-xs font-bold text-[#171638] uppercase tracking-wider">
              {t.report.descLabel} <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="report-description"
              value={form.description}
              disabled={isSubmitting}
              onChange={(e) => setField("description", e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder={t.report.descPlaceholder}
              className={cn(
                "w-full px-4 py-3 rounded-2xl bg-[#F6F4FE] border text-[#171638] placeholder:text-[#837FA8] text-sm outline-none transition-colors resize-none leading-relaxed",
                errors.description
                  ? "border-rose-400 focus:border-rose-500 bg-rose-50/30"
                  : "border-[#EAE6FD] hover:border-[#6035E8]/40 focus:border-[#6035E8] focus:bg-white focus:ring-4 focus:ring-[#6035E8]/10"
              )}
            />
            <div className="flex items-center justify-between">
              {errors.description ? (
                <p className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold" role="alert">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.description}
                </p>
              ) : (
                <span />
              )}
              <span className="text-[11px] text-[#837FA8] font-medium ml-auto">{form.description.length}/1000</span>
            </div>
          </div>
        </section>

        {/* ── SECTION 3: Loss & Evidence ─────── */}
        <section className="rounded-[2rem] bg-white border border-[#EAE6FD] p-6 sm:p-8 space-y-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FFC928]/20 flex items-center justify-center shrink-0 mt-0.5">
              <IndianRupee className="w-4 h-4 text-[#171638]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-[#171638] uppercase tracking-wider">
                {t.report.stepLossEvidence}
              </h2>
              <p className="text-xs sm:text-sm text-[#545277] mt-1 font-medium">
                {t.report.stepLossEvidenceDesc}
              </p>
            </div>
          </div>

          {/* Amount Lost (INR) */}
          <div className="space-y-1.5">
            <label htmlFor="report-amount" className="block text-xs font-bold text-[#171638] uppercase tracking-wider">
              {t.report.amountLostLabel}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#545277] font-bold text-sm">
                ₹
              </div>
              <input
                id="report-amount"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={form.amountLostInr}
                disabled={isSubmitting}
                onChange={(e) => setField("amountLostInr", e.target.value)}
                placeholder={t.report.amountLostPlaceholder}
                className={cn(
                  "w-full h-12 pl-9 pr-4 rounded-xl bg-[#F6F4FE] border text-[#171638] placeholder:text-[#837FA8] text-sm outline-none transition-colors",
                  errors.amountLostInr
                    ? "border-rose-400 focus:border-rose-500 bg-rose-50/30"
                    : "border-[#EAE6FD] hover:border-[#6035E8]/40 focus:border-[#6035E8] focus:bg-white focus:ring-4 focus:ring-[#6035E8]/10"
                )}
              />
            </div>
            {errors.amountLostInr && (
              <p className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold" role="alert">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.amountLostInr}
              </p>
            )}
            <p className="text-[11px] text-[#837FA8] font-medium">
              {t.report.amountLostHelp}
            </p>
          </div>

          {/* Has Screenshot / Evidence Checkbox */}
          <div className="pt-2">
            <label
              htmlFor="report-screenshot-toggle"
              className={cn(
                "flex items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer select-none",
                form.hasScreenshot
                  ? "bg-[#F0EDFF] border-[#6035E8] shadow-sm text-[#171638]"
                  : "bg-[#F6F4FE] border-[#EAE6FD] hover:border-[#6035E8]/40 text-[#545277]"
              )}
            >
              <input
                id="report-screenshot-toggle"
                type="checkbox"
                checked={form.hasScreenshot}
                disabled={isSubmitting}
                onChange={(e) => setField("hasScreenshot", e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[#DDD6FE] text-[#6035E8] focus:ring-[#6035E8] cursor-pointer"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-[#171638]">
                  <FileCheck className={cn("w-4 h-4", form.hasScreenshot ? "text-[#6035E8]" : "text-[#837FA8]")} />
                  <span>{t.report.hasScreenshotLabel}</span>
                </div>
                <p className="text-[11px] text-[#545277] leading-relaxed">
                  {t.report.hasScreenshotHelp}
                </p>
              </div>
            </label>
          </div>
        </section>

        {/* ── SECTION 4: Area (Optional) ──────────────────────── */}
        <section className="rounded-[2rem] bg-white border border-[#EAE6FD] p-6 sm:p-8 space-y-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#08C9C5]/15 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-4 h-4 text-[#08C9C5]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-[#171638] uppercase tracking-wider">
                {t.report.stepArea}
              </h2>
              <p className="text-xs sm:text-sm text-[#545277] mt-1 font-medium">
                {t.report.stepAreaDesc}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* State */}
            <div className="space-y-1.5">
              <label htmlFor="report-state" className="block text-xs font-bold text-[#171638] uppercase tracking-wider">
                {t.report.stateLabel}
              </label>
              <div className="relative">
                <select
                  id="report-state"
                  value={form.state}
                  disabled={isSubmitting}
                  onChange={(e) => setField("state", e.target.value)}
                  className={cn(
                    "w-full h-12 pl-4 pr-10 rounded-xl bg-[#F6F4FE] border border-[#EAE6FD] hover:border-[#6035E8]/40 focus:border-[#6035E8] focus:bg-white focus:ring-4 focus:ring-[#6035E8]/10 text-sm outline-none transition-colors appearance-none cursor-pointer",
                    form.state ? "text-[#171638]" : "text-[#837FA8]"
                  )}
                >
                  <option value="">{t.report.selectState}</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s} className="bg-white text-[#171638]">{s}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#837FA8] pointer-events-none" />
              </div>
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <label htmlFor="report-city" className="block text-xs font-bold text-[#171638] uppercase tracking-wider">
                {t.report.cityLabel}
              </label>
              <input
                id="report-city"
                type="text"
                value={form.city}
                disabled={isSubmitting}
                onChange={(e) => setField("city", e.target.value)}
                placeholder={t.report.cityPlaceholder}
                className="w-full h-12 px-4 rounded-xl bg-[#F6F4FE] border border-[#EAE6FD] hover:border-[#6035E8]/40 focus:border-[#6035E8] focus:bg-white focus:ring-4 focus:ring-[#6035E8]/10 text-[#171638] placeholder:text-[#837FA8] text-sm outline-none transition-colors"
              />
            </div>
          </div>

          {/* PIN code */}
          <div className="space-y-1.5 max-w-[200px]">
            <label htmlFor="report-pincode" className="block text-xs font-bold text-[#171638] uppercase tracking-wider">
              {t.report.pincodeLabel}
            </label>
            <input
              id="report-pincode"
              type="text"
              inputMode="numeric"
              value={form.pincode}
              disabled={isSubmitting}
              onChange={(e) => setField("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6-digit PIN"
              className={cn(
                "w-full h-12 px-4 rounded-xl bg-[#F6F4FE] border text-[#171638] placeholder:text-[#837FA8] text-sm outline-none transition-colors",
                errors.pincode
                  ? "border-rose-400 focus:border-rose-500 bg-rose-50/30"
                  : "border-[#EAE6FD] hover:border-[#6035E8]/40 focus:border-[#6035E8] focus:bg-white focus:ring-4 focus:ring-[#6035E8]/10"
              )}
            />
            {errors.pincode && (
              <p className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold" role="alert">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.pincode}
              </p>
            )}
          </div>
        </section>

        {/* ── SECTION 5: Privacy & Submit ──────────────────────── */}
        <section className="rounded-[2rem] bg-white border border-[#EAE6FD] p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-start gap-3.5 p-5 rounded-2xl bg-[#F0EDFF] border border-[#DDD6FE]">
            <EyeOff className="w-5 h-5 text-[#6035E8] shrink-0 mt-0.5" />
            <div className="space-y-2 text-xs sm:text-sm text-[#545277] leading-relaxed">
              <p className="font-bold text-[#171638] text-sm">{t.report.privacyTitle}</p>
              <ul className="space-y-1.5 list-none font-medium">
                <li>• {t.report.privacyP1}</li>
                <li>• {t.report.privacyP2}</li>
                <li>• {t.report.privacyP3}</li>
                <li>• {t.report.privacyP4}</li>
              </ul>
              <p className="text-[11px] text-[#837FA8] pt-1">
                {isHi
                  ? "सार्वजनिक होने से पहले रिपोर्ट की समीक्षा की जाती है। झूठी रिपोर्ट देने पर पहुंच प्रतिबंधित हो सकती है।"
                  : "Reports are reviewed before being made publicly visible. Submitting false reports may result in your access being restricted."}
              </p>
            </div>
          </div>

          <PrimaryButton
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            className="w-full font-bold text-base shadow-lg shadow-[#08C9C5]/20"
          >
            {isSubmitting ? t.report.submittingBtn : t.report.submitBtn}
          </PrimaryButton>

          {isSubmitting && (
            <p className="text-center text-xs text-[#545277] flex items-center justify-center gap-2 font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#6035E8]" />
              <span>
                {isHi
                  ? "कम्युनिटी स्कैम मैप इंटेलिजेंस नेटवर्क को भेजा जा रहा है…"
                  : "Sending to the Community Scam Map intelligence network…"}
              </span>
            </p>
          )}
        </section>
      </form>
    </div>
  );
}

export default ReportFormContainer;

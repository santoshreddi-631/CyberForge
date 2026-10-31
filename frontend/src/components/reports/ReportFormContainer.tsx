"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { LookupIdentifierType, ScamCategory } from "@/types";
import { validateIdentifier } from "@/lib/utils/lookupValidation";
import { apiClient, ApiError } from "@/lib/api/client";
import { CreateReportRequestContract, CreateReportResponseContract } from "@/lib/contracts";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useLanguage } from "@/hooks/useLanguage";
import { ReportIdentifierSelector, REPORT_IDENTIFIER_OPTIONS } from "./ReportIdentifierSelector";
import { REPORT_SCAM_TYPES } from "@/lib/constants/reportOptions";

// Scam category options matching contract ScamCategory enum
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
  title: string;
  description: string;
  state: string;
  city: string;
  pincode: string;
}

interface FormErrors {
  identifierValue?: string;
  category?: string;
  title?: string;
  description?: string;
  pincode?: string;
}

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; data: CreateReportResponseContract }
  | { status: "error"; title: string; description: string; canRetry: boolean };

export function ReportFormContainer() {
  const { lang, t } = useLanguage();
  const isHi = lang === "hi";

  const [form, setForm] = useState<FormData>({
    identifierType: "phone",
    identifierValue: "",
    category: "",
    title: "",
    description: "",
    state: "",
    city: "",
    pincode: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });

  const isSubmitting = submitState.status === "submitting";

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
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

    // Build the request payload matching CreateReportRequestContract
    const payload: CreateReportRequestContract = {
      identifierType: form.identifierType,
      identifierValue: form.identifierValue.trim(),
      category: form.category as ScamCategory,
      title: form.title.trim(),
      description: form.description.trim(),
    };

    if (form.state) payload.state = form.state;
    if (form.city.trim()) payload.city = form.city.trim();
    if (form.pincode.trim()) payload.pincode = form.pincode.trim();

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
        // Network disruption or backend offline
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
        <div className="rounded-2xl bg-emerald-950/30 border border-emerald-800/70 p-8 sm:p-10 text-center space-y-5 shadow-xl">
          <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-emerald-100 tracking-tight">
              {t.report.successTitle}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
              {t.report.successDesc}
            </p>
          </div>

          {data.referenceNumber && (
            <div className="inline-flex flex-col items-center gap-1 px-5 py-3 rounded-xl bg-slate-900 border border-slate-800 text-sm">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">{t.report.refNumber}</span>
              <span className="font-mono font-bold text-teal-300 text-base tracking-wide">
                {data.referenceNumber}
              </span>
              <span className="text-[11px] text-slate-400">
                {isHi ? "भविष्य के संदर्भ के लिए इसे सुरक्षित रखें" : "Keep this for your records"}
              </span>
            </div>
          )}

          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {isHi
              ? "कृपया एक ही घटना के लिए दोबारा रिपोर्ट दर्ज न करें। नेटवर्क इसकी समीक्षा करेगा।"
              : "Please avoid submitting duplicate reports for the same incident. The backend tracks reports and will process this submission."}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/">
              <PrimaryButton variant="secondary" size="md" leftIcon={<Home className="w-4 h-4" />}>
                {t.report.returnHome}
              </PrimaryButton>
            </Link>
            <Link href="/lookup">
              <PrimaryButton variant="outline" size="md" leftIcon={<Search className="w-4 h-4" />}>
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
    <div className="w-full max-w-2xl mx-auto space-y-5">
      {/* Error Banner (network/server errors) */}
      {submitState.status === "error" && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 rounded-xl bg-rose-950/30 border border-rose-800/70 text-sm"
        >
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-200">{submitState.title}</p>
            <p className="text-slate-300 text-xs mt-0.5 leading-relaxed">{submitState.description}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* ── SECTION 1: Identifier ─────────────────────────────── */}
        <section className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              {t.report.step1}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {t.report.step1Desc}
            </p>
          </div>

          <ReportIdentifierSelector
            selectedType={form.identifierType}
            onSelect={(t) => setField("identifierType", t)}
            disabled={isSubmitting}
          />

          <div className="space-y-1.5">
            <label htmlFor="report-identifier-input" className="block text-xs font-semibold text-slate-300">
              {isHi ? currentOption.labelHi : currentOption.label} <span className="text-rose-400">*</span>
            </label>
            <input
              id="report-identifier-input"
              type="text"
              value={form.identifierValue}
              disabled={isSubmitting}
              onChange={(e) => setField("identifierValue", e.target.value)}
              placeholder={isHi ? currentOption.placeholderHi : currentOption.placeholder}
              className={cn(
                "w-full h-11 px-4 rounded-lg bg-slate-950 border text-slate-100 placeholder:text-slate-500 text-sm outline-none transition-colors",
                errors.identifierValue
                  ? "border-rose-500/70 focus:border-rose-400"
                  : "border-slate-700/80 hover:border-slate-600 focus:border-teal-500"
              )}
            />
            {errors.identifierValue && (
              <p className="flex items-center gap-1.5 text-xs text-rose-400 font-medium" role="alert">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.identifierValue}
              </p>
            )}
          </div>
        </section>

        {/* ── SECTION 2: Scam Details ──────────────────────────── */}
        <section className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              {t.report.step2}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {t.report.step2Desc}
            </p>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label htmlFor="report-category" className="block text-xs font-semibold text-slate-300">
              {t.report.categoryLabel} <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <select
                id="report-category"
                value={form.category}
                disabled={isSubmitting}
                onChange={(e) => setField("category", e.target.value as ScamCategory | "")}
                className={cn(
                  "w-full h-11 pl-4 pr-10 rounded-lg bg-slate-950 border text-sm outline-none transition-colors appearance-none cursor-pointer",
                  form.category ? "text-slate-100" : "text-slate-500",
                  errors.category
                    ? "border-rose-500/70 focus:border-rose-400"
                    : "border-slate-700/80 hover:border-slate-600 focus:border-teal-500"
                )}
              >
                <option value="" disabled>{t.report.selectCategory}</option>
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-100">
                    {isHi ? opt.labelHi : opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            {errors.category && (
              <p className="flex items-center gap-1.5 text-xs text-rose-400 font-medium" role="alert">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.category}
              </p>
            )}
          </div>

          {/* Scam Pattern Context */}
          {form.category && (
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
              <span>
                {REPORT_SCAM_TYPES.find(
                  (s) =>
                    s.type === form.category.replace(/_/g, "-").replace("aadhaar-pan", "fake-kyc-link")
                )?.description ?? (isHi ? "विस्तार से बताएं ताकि अन्य नागरिक इस पैटर्न को पहचान सकें।" : "Describe what happened so others can recognise the pattern.")}
              </span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label htmlFor="report-title" className="block text-xs font-semibold text-slate-300">
              {t.report.titleLabel} <span className="text-rose-400">*</span>
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
                "w-full h-11 px-4 rounded-lg bg-slate-950 border text-slate-100 placeholder:text-slate-500 text-sm outline-none transition-colors",
                errors.title
                  ? "border-rose-500/70 focus:border-rose-400"
                  : "border-slate-700/80 hover:border-slate-600 focus:border-teal-500"
              )}
            />
            <div className="flex items-center justify-between">
              {errors.title ? (
                <p className="flex items-center gap-1.5 text-xs text-rose-400 font-medium" role="alert">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.title}
                </p>
              ) : (
                <span />
              )}
              <span className="text-[11px] text-slate-500 ml-auto">{form.title.length}/120</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="report-description" className="block text-xs font-semibold text-slate-300">
              {t.report.descLabel} <span className="text-rose-400">*</span>
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
                "w-full px-4 py-3 rounded-lg bg-slate-950 border text-slate-100 placeholder:text-slate-500 text-sm outline-none transition-colors resize-none leading-relaxed",
                errors.description
                  ? "border-rose-500/70 focus:border-rose-400"
                  : "border-slate-700/80 hover:border-slate-600 focus:border-teal-500"
              )}
            />
            <div className="flex items-center justify-between">
              {errors.description ? (
                <p className="flex items-center gap-1.5 text-xs text-rose-400 font-medium" role="alert">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.description}
                </p>
              ) : (
                <span />
              )}
              <span className="text-[11px] text-slate-500 ml-auto">{form.description.length}/1000</span>
            </div>
          </div>
        </section>

        {/* ── SECTION 3: Area (Optional) ──────────────────────── */}
        <section className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 sm:p-6 space-y-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                {t.report.step3}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {t.report.step3Desc}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* State */}
            <div className="space-y-1.5">
              <label htmlFor="report-state" className="block text-xs font-semibold text-slate-300">
                {t.report.stateLabel}
              </label>
              <div className="relative">
                <select
                  id="report-state"
                  value={form.state}
                  disabled={isSubmitting}
                  onChange={(e) => setField("state", e.target.value)}
                  className={cn(
                    "w-full h-11 pl-4 pr-10 rounded-lg bg-slate-950 border border-slate-700/80 hover:border-slate-600 focus:border-teal-500 text-sm outline-none transition-colors appearance-none cursor-pointer",
                    form.state ? "text-slate-100" : "text-slate-500"
                  )}
                >
                  <option value="">{t.report.selectState}</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s} className="bg-slate-900 text-slate-100">{s}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <label htmlFor="report-city" className="block text-xs font-semibold text-slate-300">
                {t.report.cityLabel}
              </label>
              <input
                id="report-city"
                type="text"
                value={form.city}
                disabled={isSubmitting}
                onChange={(e) => setField("city", e.target.value)}
                placeholder={t.report.cityPlaceholder}
                className="w-full h-11 px-4 rounded-lg bg-slate-950 border border-slate-700/80 hover:border-slate-600 focus:border-teal-500 text-slate-100 placeholder:text-slate-500 text-sm outline-none transition-colors"
              />
            </div>
          </div>

          {/* PIN code */}
          <div className="space-y-1.5 max-w-[200px]">
            <label htmlFor="report-pincode" className="block text-xs font-semibold text-slate-300">
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
                "w-full h-11 px-4 rounded-lg bg-slate-950 border text-slate-100 placeholder:text-slate-500 text-sm outline-none transition-colors",
                errors.pincode
                  ? "border-rose-500/70 focus:border-rose-400"
                  : "border-slate-700/80 hover:border-slate-600 focus:border-teal-500"
              )}
            />
            {errors.pincode && (
              <p className="flex items-center gap-1.5 text-xs text-rose-400 font-medium" role="alert">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.pincode}
              </p>
            )}
          </div>
        </section>

        {/* ── SECTION 4: Privacy & Submit ──────────────────────── */}
        <section className="rounded-xl bg-slate-900/60 border border-slate-800 p-5 sm:p-6 space-y-5">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-950/50 border border-slate-800">
            <EyeOff className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
            <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
              <p className="font-bold text-slate-100 text-sm">{t.report.privacyTitle}</p>
              <ul className="space-y-1.5 list-none">
                <li>• {t.report.privacyP1}</li>
                <li>• {t.report.privacyP2}</li>
                <li>• {t.report.privacyP3}</li>
                <li>• {t.report.privacyP4}</li>
              </ul>
              <p className="text-[11px] text-slate-400 pt-1">
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
            className="w-full font-bold text-base"
          >
            {isSubmitting ? t.report.submittingBtn : t.report.submitBtn}
          </PrimaryButton>

          {isSubmitting && (
            <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
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

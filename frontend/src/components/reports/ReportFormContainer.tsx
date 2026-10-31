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
import { ReportIdentifierSelector, REPORT_IDENTIFIER_OPTIONS } from "./ReportIdentifierSelector";
import { REPORT_SCAM_TYPES, MONITORED_AREAS } from "@/lib/constants/reportOptions";

// Scam category options matching contract ScamCategory enum
const CATEGORY_OPTIONS: { value: ScamCategory; label: string }[] = [
  { value: "upi_fraud", label: "UPI / Payment Fraud" },
  { value: "phishing_url", label: "Phishing Link / Fake Website" },
  { value: "part_time_job", label: "Part-Time Job / Task Scam" },
  { value: "lottery_kbc", label: "Lottery / Prize Scam" },
  { value: "courier_customs", label: "Parcel / Customs Fine Scam" },
  { value: "loan_app", label: "Loan App Harassment" },
  { value: "deepfake_impersonation", label: "Digital Arrest / Deepfake" },
  { value: "aadhaar_pan", label: "Aadhaar / PAN / KYC Fraud" },
  { value: "crypto_investment", label: "Crypto / Investment Scam" },
  { value: "electricity_bill", label: "Electricity / Utility Scam" },
  { value: "other", label: "Other Scam Pattern" },
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
  };
  return mapping[category] || category || "other";
}

function inferChannel(type: string, category: string): "Phone call" | "SMS or WhatsApp" | "QR code" | "Fake website" | "UPI request" | "Something else" {
  if (category === "phishing_url" || type === "url") return "Fake website";
  if (category === "upi_fraud" || type === "upi") return "UPI request";
  if (type === "sender_id") return "SMS or WhatsApp";
  return "Phone call";
}

export function ReportFormContainer() {
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
      newErrors.identifierValue = idValidation.errorMessage;
    }

    if (!form.category) {
      newErrors.category = "Please select the type of scam.";
    }

    const titleTrimmed = form.title.trim();
    if (!titleTrimmed) {
      newErrors.title = "Please provide a brief title for the report.";
    } else if (titleTrimmed.length < 5) {
      newErrors.title = "Title should be at least 5 characters.";
    } else if (titleTrimmed.length > 120) {
      newErrors.title = "Title should be under 120 characters.";
    }

    const descTrimmed = form.description.trim();
    if (!descTrimmed) {
      newErrors.description = "Please describe what happened.";
    } else if (descTrimmed.length < 10) {
      newErrors.description = "Description should be at least 10 characters.";
    } else if (descTrimmed.length > 1000) {
      newErrors.description = "Description should be under 1000 characters.";
    }

    if (form.pincode && !/^\d{6}$/.test(form.pincode.trim())) {
      newErrors.pincode = "PIN code must be exactly 6 digits.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || submitState.status === "success") return;

    if (!validate()) return;

    setSubmitState({ status: "submitting" });

    const matchedArea = MONITORED_AREAS.find((a) => a.code === form.pincode.trim()) || {
      area: "HSR Layout",
      city: "Bengaluru",
      code: "560102",
    };

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
    const payload = {
      report_id: reportId,
      occurred_at: nowIso,
      reported_at: nowIso,
      reporter_id: reporterId,
      ip_prefix: "103.21.244.0/24",
      channel: inferChannel(form.identifierType, form.category),
      scam_type: mapCategoryToScamType(form.category),
      identifier_type: form.identifierType,
      identifier_value: form.identifierValue.trim(),
      pincode: matchedArea.code,
      locality: matchedArea.area,
      city: matchedArea.city,
      note: form.description.trim() || form.title.trim() || null,
      has_screenshot: false,
      amount_lost_inr: 0,
    };


    try {
      const response = await apiClient.post<CreateReportResponseContract>("/reports", payload);
      setSubmitState({ status: "success", data: response });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 400) {
          const detail =
            typeof err.data === "object" && err.data !== null && "detail" in err.data
              ? String((err.data as { detail: unknown }).detail)
              : err.message || "Your submission contains invalid information. Please review and try again.";
          setSubmitState({
            status: "error",
            title: "Submission Rejected",
            description: detail,
            canRetry: true,
          });
        } else if (err.status === 429) {
          setSubmitState({
            status: "error",
            title: "Too Many Reports",
            description: "You have submitted too many reports recently. Please wait before submitting again.",
            canRetry: false,
          });
        } else if (err.status === 409) {
          setSubmitState({
            status: "error",
            title: "Duplicate Report Detected",
            description: "A report for this identifier has already been submitted recently. Thank you for your vigilance.",
            canRetry: false,
          });
        } else {
          setSubmitState({
            status: "error",
            title: "Submission Failed",
            description: "The server encountered a problem processing your report. Please try again shortly.",
            canRetry: true,
          });
        }
      } else {
        setSubmitState({
          status: "error",
          title: "Service Temporarily Unavailable",
          description: "Could not connect to the reporting service. Please check your connection and try again.",
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
              Report Submitted Successfully
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
              Thank you for helping protect the community. Your report has been received and will be reviewed by the intelligence network.
            </p>
          </div>

          {(data.referenceNumber || data.report_id || data.case_id) && (
            <div className="inline-flex flex-col items-center gap-1 px-5 py-3 rounded-xl bg-slate-900 border border-slate-800 text-sm">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Reference Number</span>
              <span className="font-mono font-bold text-teal-300 text-base tracking-wide">
                {data.referenceNumber || data.report_id || data.case_id}
              </span>
              <span className="text-[11px] text-slate-400">Keep this for your records</span>
            </div>
          )}

          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Please avoid submitting duplicate reports for the same incident. The backend tracks reports and will process this submission.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/">
              <PrimaryButton variant="secondary" size="md" leftIcon={<Home className="w-4 h-4" />}>
                Return Home
              </PrimaryButton>
            </Link>
            <Link href="/lookup">
              <PrimaryButton variant="outline" size="md" leftIcon={<Search className="w-4 h-4" />}>
                Check Another Identifier
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
              Step 1 — Suspicious Identifier
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select the type of suspicious contact and enter its value.
            </p>
          </div>

          <ReportIdentifierSelector
            selectedType={form.identifierType}
            onSelect={(t) => setField("identifierType", t)}
            disabled={isSubmitting}
          />

          <div className="space-y-1.5">
            <label htmlFor="report-identifier-input" className="block text-xs font-semibold text-slate-300">
              {currentOption.label} <span className="text-rose-400">*</span>
            </label>
            <input
              id="report-identifier-input"
              type="text"
              value={form.identifierValue}
              disabled={isSubmitting}
              onChange={(e) => setField("identifierValue", e.target.value)}
              placeholder={currentOption.placeholder}
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
              Step 2 — Scam Details
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              What type of scam was it and what happened?
            </p>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label htmlFor="report-category" className="block text-xs font-semibold text-slate-300">
              Scam Type <span className="text-rose-400">*</span>
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
                <option value="" disabled>Select scam type…</option>
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-100">
                    {opt.label}
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
                )?.description ?? "Describe what happened so others can recognise the pattern."}
              </span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label htmlFor="report-title" className="block text-xs font-semibold text-slate-300">
              Brief Title <span className="text-rose-400">*</span>
            </label>
            <input
              id="report-title"
              type="text"
              value={form.title}
              disabled={isSubmitting}
              onChange={(e) => setField("title", e.target.value)}
              maxLength={120}
              placeholder="e.g. Received call asking for OTP claiming to be SBI"
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
              What Happened <span className="text-rose-400">*</span>
            </label>
            <textarea
              id="report-description"
              value={form.description}
              disabled={isSubmitting}
              onChange={(e) => setField("description", e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Describe what happened. Do not include your OTP, passwords, PIN, or full bank account numbers."
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
                Step 3 — Area <span className="text-slate-500 font-normal normal-case">(optional)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Your area helps map scam hotspots and alert nearby citizens. We do not store your exact address or home location.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* State */}
            <div className="space-y-1.5">
              <label htmlFor="report-state" className="block text-xs font-semibold text-slate-300">
                State
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
                  <option value="">Select state…</option>
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
                City / Town
              </label>
              <input
                id="report-city"
                type="text"
                value={form.city}
                disabled={isSubmitting}
                onChange={(e) => setField("city", e.target.value)}
                placeholder="e.g. Bengaluru"
                className="w-full h-11 px-4 rounded-lg bg-slate-950 border border-slate-700/80 hover:border-slate-600 focus:border-teal-500 text-slate-100 placeholder:text-slate-500 text-sm outline-none transition-colors"
              />
            </div>
          </div>

          {/* PIN code */}
          <div className="space-y-1.5 max-w-[200px]">
            <label htmlFor="report-pincode" className="block text-xs font-semibold text-slate-300">
              PIN Code
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
              <p className="font-bold text-slate-100 text-sm">Your Privacy Matters</p>
              <ul className="space-y-1.5 list-none">
                <li>• Your identity as a reporter is not displayed publicly.</li>
                <li>• Scam reports are shared to protect the community, not to expose individuals.</li>
                <li>• Map visualisation uses area-level aggregation, not exact addresses.</li>
                <li>• Do not include OTPs, passwords, PINs, or full bank account numbers in your description.</li>
              </ul>
              <p className="text-[11px] text-slate-400 pt-1">
                Reports are reviewed before being made publicly visible. Submitting false reports may result in your access being restricted.
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
            {isSubmitting ? "Submitting Report…" : "Submit Report"}
          </PrimaryButton>

          {isSubmitting && (
            <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Sending to the Community Scam Map intelligence network…</span>
            </p>
          )}
        </section>
      </form>
    </div>
  );
}

export default ReportFormContainer;

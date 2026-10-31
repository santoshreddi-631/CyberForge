"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  AlertCircle,
  Loader2,
  Building2,
  Mail,
  Search,
  Home,
  RotateCcw,
  Shield,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { LookupIdentifierType } from "@/types";
import { validateIdentifier } from "@/lib/utils/lookupValidation";
import { apiClient, ApiError } from "@/lib/api/client";
import { ChallengeRequestContract, ChallengeResponseContract } from "@/lib/contracts";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useLanguage } from "@/hooks/useLanguage";
import {
  DisputeIdentifierSelector,
  DISPUTE_IDENTIFIER_OPTIONS,
} from "./DisputeIdentifierSelector";

interface FormData {
  identifier_type: LookupIdentifierType;
  identifier_value: string;
  claimant_name: string;
  contact_email: string;
  proof_note: string;
}

interface FormErrors {
  identifier_value?: string;
  claimant_name?: string;
  contact_email?: string;
  proof_note?: string;
}

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; data: ChallengeResponseContract }
  | { status: "error"; title: string; description: string; canRetry: boolean };

export function DisputeFormContainer() {
  const { lang, t } = useLanguage();
  const isHi = lang === "hi";

  const [form, setForm] = useState<FormData>({
    identifier_type: "phone",
    identifier_value: "",
    claimant_name: "",
    contact_email: "",
    proof_note: "",
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
    DISPUTE_IDENTIFIER_OPTIONS.find((o) => o.type === form.identifier_type) ||
    DISPUTE_IDENTIFIER_OPTIONS[0];

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate identifier according to standard type rules
    const idValidation = validateIdentifier(form.identifier_type, form.identifier_value);
    if (!idValidation.isValid) {
      newErrors.identifier_value =
        idValidation.errorMessage || (isHi ? "कृपया एक मान्य पहचानकर्ता दर्ज करें।" : "Please enter a valid identifier.");
    }

    // Claimant / Business name
    const nameTrimmed = form.claimant_name.trim();
    if (!nameTrimmed) {
      newErrors.claimant_name = isHi ? "कृपया अपना पंजीकृत व्यापारिक नाम दर्ज करें।" : "Please enter your registered business or trade name.";
    } else if (nameTrimmed.length < 2) {
      newErrors.claimant_name = isHi ? "व्यापारिक नाम कम से कम 2 अक्षरों का होना चाहिए।" : "Business name must be at least 2 characters.";
    } else if (nameTrimmed.length > 120) {
      newErrors.claimant_name = isHi ? "व्यापारिक नाम 120 अक्षरों से अधिक नहीं हो सकता।" : "Business name must be under 120 characters.";
    }

    // Contact Email
    const emailTrimmed = form.contact_email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailTrimmed) {
      newErrors.contact_email = isHi ? "कृपया आधिकारिक व्यावसायिक संपर्क ईमेल प्रदान करें।" : "Please provide an official business contact email.";
    } else if (!emailRegex.test(emailTrimmed)) {
      newErrors.contact_email = isHi ? "कृपया एक मान्य ईमेल पता दर्ज करें (उदा. contact@business.com)।" : "Please enter a valid email address (e.g. contact@business.com).";
    }

    // Proof Note
    const noteTrimmed = form.proof_note.trim();
    if (!noteTrimmed) {
      newErrors.proof_note = isHi ? "कृपया अपने व्यावसायिक पंजीकरण या प्रमाण का विवरण दें।" : "Please describe your business proof or official registration.";
    } else if (noteTrimmed.length < 10) {
      newErrors.proof_note = isHi ? "प्रमाण विवरण कम से कम 10 अक्षरों का होना चाहिए।" : "Proof description must be at least 10 characters.";
    } else if (noteTrimmed.length > 1000) {
      newErrors.proof_note = isHi ? "प्रमाण विवरण 1000 अक्षरों से अधिक नहीं हो सकता।" : "Proof description must be under 1000 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validate()) return;

    setSubmitState({ status: "submitting" });

    const payload: ChallengeRequestContract = {
      identifier_type: form.identifier_type,
      identifier_value: form.identifier_value.trim(),
      claimant_name: form.claimant_name.trim(),
      contact_email: form.contact_email.trim(),
      proof_note: form.proof_note.trim(),
    };

    try {
      const response = await apiClient.post<ChallengeResponseContract>("/challenges", payload);
      setSubmitState({ status: "success", data: response });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 400) {
          const detail =
            typeof err.data === "object" && err.data !== null && "detail" in err.data
              ? String((err.data as { detail: unknown }).detail)
              : err.message || (isHi ? "सर्वर ने प्रस्तुत विवाद डेटा को अस्वीकार कर दिया।" : "The server rejected the submitted challenge data. Please verify your identifier format and contact email.");
          setSubmitState({
            status: "error",
            title: isHi ? "विवाद सबमिशन अस्वीकृत" : "Dispute Submission Rejected",
            description: detail,
            canRetry: true,
          });
        } else if (err.status === 409) {
          setSubmitState({
            status: "error",
            title: isHi ? "चैलेंज पहले से समीक्षाधीन है" : "Challenge Already Under Review",
            description: isHi
              ? "इस पहचानकर्ता के लिए एक विवाद पहले ही सबमिट किया जा चुका है और वर्तमान में जांच की जा रही है।"
              : "A challenge for this identifier has already been submitted and is currently being investigated.",
            canRetry: false,
          });
        } else if (err.status === 429) {
          setSubmitState({
            status: "error",
            title: isHi ? "अनुरोध सीमा पार हो गई" : "Rate Limit Exceeded",
            description: isHi
              ? "कम समय में बहुत अधिक सबमिशन प्राप्त हुए। कृपया कुछ क्षण बाद पुनः प्रयास करें।"
              : "Too many dispute submissions were received in a short timeframe. Please wait a moment before trying again.",
            canRetry: false,
          });
        } else {
          setSubmitState({
            status: "error",
            title: isHi ? "विवाद दर्ज करने में असमर्थ" : "Dispute Submission Failed",
            description: `Server returned error (${err.status}): ${err.message || (isHi ? "चैलेंज प्रोसेस करने में समस्या हुई।" : "An issue occurred processing your challenge.")}`,
            canRetry: true,
          });
        }
      } else {
        setSubmitState({
          status: "error",
          title: isHi ? "विवाद सेवा अस्थायी रूप से अनुपलब्ध है" : "Dispute Service Unavailable",
          description: isHi
            ? "विवाद समीक्षा सेवा (POST /challenges) से संपर्क नहीं हो सका। आपके द्वारा दर्ज विवरण सुरक्षित हैं। कृपया सेवा उपलब्ध होने पर पुनः प्रयास करें।"
            : "Could not connect to the dispute review service (POST /challenges). Your entered details have been preserved. Please retry once the service is available.",
          canRetry: true,
        });
      }
    }
  };

  const handleResetForm = () => {
    setForm({
      identifier_type: "phone",
      identifier_value: "",
      claimant_name: "",
      contact_email: "",
      proof_note: "",
    });
    setErrors({});
    setSubmitState({ status: "idle" });
  };

  // ── Success State ──────────────────────────────────────────────────
  if (submitState.status === "success") {
    const { data } = submitState;

    return (
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div className="rounded-2xl bg-emerald-950/30 border border-emerald-800/70 p-8 sm:p-10 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-emerald-100 tracking-tight">
              {isHi ? "विवाद समीक्षा के लिए सफलतापूर्वक पंजीकृत" : "Challenge Registered Under Review"}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-lg mx-auto">
              {isHi ? (
                <>
                  <strong className="text-slate-100">{form.claimant_name}</strong> के लिए आपका विवाद समीक्षा डेस्क को प्राप्त हो गया है।
                </>
              ) : (
                <>
                  Your dispute for <strong className="text-slate-100">{form.claimant_name}</strong> has been received by the review desk.
                </>
              )}
            </p>
          </div>

          {/* Reference & Status Pill */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            {data.challenge_id && (
              <div className="inline-flex flex-col items-center px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                  {isHi ? "चैलेंज आईडी" : "Challenge ID"}
                </span>
                <span className="font-mono font-bold text-teal-300 text-sm mt-0.5">
                  {data.challenge_id}
                </span>
              </div>
            )}

            <div className="inline-flex flex-col items-center px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                {isHi ? "समीक्षा स्थिति" : "Review Status"}
              </span>
              <div className="mt-0.5">
                <StatusBadge
                  status="under_review"
                  label={data.status || "under_review"}
                  size="sm"
                />
              </div>
            </div>
          </div>

          {/* Platform Policy Explanation */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-left text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-teal-300">
              <Scale className="w-4 h-4" />
              <span>{isHi ? "मंच समीक्षा और सार्वजनिक जांच स्थिति" : "Platform Review & Lookup Status"}</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              {isHi
                ? "मंच के नियमों के अनुसार, समीक्षाधीन होने के दौरान इस पहचानकर्ता पर सार्वजनिक खोज में पुष्टि किए गए स्कैम के बजाय 'विवादित / समीक्षाधीन' स्थिति दिखाई जाएगी।"
                : "In accordance with platform rules, while under review, public lookups on this identifier will display a neutral \"challenged / under review\" status rather than a confirmed scam verdict."}
            </p>
            <p className="text-[11px] text-slate-400 border-t border-slate-800 pt-2 leading-relaxed">
              <strong>{isHi ? "सूचना:" : "Notice:"}</strong>{" "}
              {isHi
                ? "चैलेंज दर्ज करना समीक्षा का औपचारिक अनुरोध है और यह सामुदायिक चेतावनियों को स्वतः नहीं हटाता। वास्तविक पीड़ितों की सुरक्षा और वैध व्यापारियों के अधिकारों में संतुलन बनाए रखा जाता है।"
                : "Submitting a challenge is a formal request for review and does not automatically delete community warnings. Genuine victim reports are evaluated alongside your business credentials to maintain community safety."}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <Link href="/lookup">
              <PrimaryButton variant="secondary" size="md" leftIcon={<Search className="w-4 h-4" />}>
                {isHi ? t.nav.lookup : "Check Status in Lookup"}
              </PrimaryButton>
            </Link>
            <Link href="/">
              <PrimaryButton variant="outline" size="md" leftIcon={<Home className="w-4 h-4" />}>
                {isHi ? t.report.returnHome : "Return Home"}
              </PrimaryButton>
            </Link>
            <PrimaryButton
              variant="ghost"
              size="md"
              onClick={handleResetForm}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              {isHi ? "अन्य विवाद दर्ज करें" : "Submit Another Challenge"}
            </PrimaryButton>
          </div>
        </div>
      </div>
    );
  }

  // ── Form State ─────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Error Banner */}
      {submitState.status === "error" && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-sm shadow-lg"
        >
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-rose-200">{submitState.title}</p>
            <p className="text-slate-300 text-xs leading-relaxed">{submitState.description}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* ── SECTION 1: Disputed Contact Identifier ───────────────── */}
        <section className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              {t.disputes.formStep1}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {t.disputes.formStep1Desc}
            </p>
          </div>

          <DisputeIdentifierSelector
            selectedType={form.identifier_type}
            onSelect={(t) => setField("identifier_type", t)}
            disabled={isSubmitting}
          />

          <div className="space-y-1.5">
            <label htmlFor="dispute-identifier-input" className="block text-xs font-semibold text-slate-300">
              {isHi ? currentOption.labelHi : currentOption.label} <span className="text-rose-400">*</span>
            </label>
            <input
              id="dispute-identifier-input"
              type="text"
              value={form.identifier_value}
              disabled={isSubmitting}
              onChange={(e) => setField("identifier_value", e.target.value)}
              placeholder={isHi ? currentOption.placeholderHi : currentOption.placeholder}
              className={cn(
                "w-full h-11 px-4 rounded-lg bg-slate-950 border text-slate-100 placeholder:text-slate-500 text-sm outline-none transition-colors",
                errors.identifier_value
                  ? "border-rose-500/70 focus:border-rose-400"
                  : "border-slate-700/80 hover:border-slate-600 focus:border-teal-500"
              )}
            />
            <p className="text-[11px] text-slate-400">
              {isHi ? currentOption.helperTextHi : currentOption.helperText}
            </p>
            {errors.identifier_value && (
              <p className="flex items-center gap-1.5 text-xs text-rose-400 font-medium" role="alert">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.identifier_value}
              </p>
            )}
          </div>
        </section>

        {/* ── SECTION 2: Business & Contact Information ────────────── */}
        <section className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              {t.disputes.formStep2}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {t.disputes.formStep2Desc}
            </p>
          </div>

          {/* Business / Claimant Name */}
          <div className="space-y-1.5">
            <label htmlFor="dispute-claimant-name" className="block text-xs font-semibold text-slate-300">
              {t.disputes.businessNameLabel} <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                id="dispute-claimant-name"
                type="text"
                value={form.claimant_name}
                disabled={isSubmitting}
                onChange={(e) => setField("claimant_name", e.target.value)}
                maxLength={120}
                placeholder={isHi ? "उदा. फ्रेश बेक्स या एबीसी रिटेलर्स प्राइवेट लिमिटेड" : "e.g. Fresh Bakes or ABC Retailers Pvt Ltd"}
                className={cn(
                  "w-full h-11 pl-10 pr-4 rounded-lg bg-slate-950 border text-slate-100 placeholder:text-slate-500 text-sm outline-none transition-colors",
                  errors.claimant_name
                    ? "border-rose-500/70 focus:border-rose-400"
                    : "border-slate-700/80 hover:border-slate-600 focus:border-teal-500"
                )}
              />
              <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
            {errors.claimant_name && (
              <p className="flex items-center gap-1.5 text-xs text-rose-400 font-medium" role="alert">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.claimant_name}
              </p>
            )}
          </div>

          {/* Contact Email */}
          <div className="space-y-1.5">
            <label htmlFor="dispute-contact-email" className="block text-xs font-semibold text-slate-300">
              {t.disputes.contactEmailLabel} <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                id="dispute-contact-email"
                type="email"
                value={form.contact_email}
                disabled={isSubmitting}
                onChange={(e) => setField("contact_email", e.target.value)}
                placeholder="e.g. owner@example.com or support@freshbakes.in"
                className={cn(
                  "w-full h-11 pl-10 pr-4 rounded-lg bg-slate-950 border text-slate-100 placeholder:text-slate-500 text-sm outline-none transition-colors",
                  errors.contact_email
                    ? "border-rose-500/70 focus:border-rose-400"
                    : "border-slate-700/80 hover:border-slate-600 focus:border-teal-500"
                )}
              />
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
            <p className="text-[11px] text-slate-400">
              {isHi
                ? "केवल सत्यापन अपडेट के लिए उपयोग किया जाता है। कभी भी सार्वजनिक नहीं किया जाता।"
                : "Used strictly for verification updates. Never published or shared with reporters."}
            </p>
            {errors.contact_email && (
              <p className="flex items-center gap-1.5 text-xs text-rose-400 font-medium" role="alert">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.contact_email}
              </p>
            )}
          </div>
        </section>

        {/* ── SECTION 3: Proof of Legitimate Business ──────────────── */}
        <section className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              {t.disputes.formStep3}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {t.disputes.formStep3Desc}
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="dispute-proof-note" className="block text-xs font-semibold text-slate-300">
              {t.disputes.proofNoteLabel} <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <textarea
                id="dispute-proof-note"
                value={form.proof_note}
                disabled={isSubmitting}
                onChange={(e) => setField("proof_note", e.target.value)}
                rows={4}
                maxLength={1000}
                placeholder={isHi
                  ? "उदा. GST प्रमाण पत्र और दुकान लाइसेंस संलग्न। GSTIN: 29AAAAA0000A1Z5, पंजीकृत नाम: फ्रेश बेक्स, पता: 100 फीट रोड, इंदिरानगर, बेंगलुरु। हम एक स्थानीय बेकरी संचालित करते हैं और अवांछित भुगतान लिंक नहीं भेजते।"
                  : "e.g. GST certificate and shop licence attached. GSTIN: 29AAAAA0000A1Z5, Registered Trade Name: Fresh Bakes, Address: 100 Feet Rd, Indiranagar, Bengaluru. We operate a local bakery and do not send unsolicited payment links."}
                className={cn(
                  "w-full px-4 py-3 rounded-lg bg-slate-950 border text-slate-100 placeholder:text-slate-500 text-sm outline-none transition-colors resize-none leading-relaxed",
                  errors.proof_note
                    ? "border-rose-500/70 focus:border-rose-400"
                    : "border-slate-700/80 hover:border-slate-600 focus:border-teal-500"
                )}
              />
              <span className="absolute right-3 bottom-2.5 text-[10px] text-slate-500 font-mono">
                {form.proof_note.length}/1000
              </span>
            </div>
            {errors.proof_note && (
              <p className="flex items-center gap-1.5 text-xs text-rose-400 font-medium" role="alert">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.proof_note}
              </p>
            )}
          </div>
        </section>

        {/* ── Legal & Fair Review Assurances ───────────────────────── */}
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-teal-400">
            <Shield className="w-4 h-4" />
            <span>{isHi ? "निष्पक्ष समीक्षा प्रक्रिया आश्वासन" : "Fair Review Process Assurances"}</span>
          </div>
          <ul className="space-y-1 text-slate-400 text-[11px] list-disc list-inside">
            <li>
              {isHi
                ? "आपका संपर्क ईमेल केवल सत्यापन संचार के लिए उपयोग किया जाता है और कभी सार्वजनिक नहीं होता।"
                : "Your contact email is used solely for review communications and will never be published."}
            </li>
            <li>
              {isHi
                ? "समीक्षा के दौरान, खोज में 'समीक्षाधीन' स्थिति दिखाई जाएगी।"
                : "During review, the public search will show an 'under review' status."}
            </li>
            <li>
              {isHi
                ? "झूठी या कपटपूर्ण साख प्रस्तुत करने पर आगे की विवाद प्रस्तुतियाँ अवरुद्ध की जा सकती हैं।"
                : "Submitting fraudulent or deceptive credentials may disqualify future dispute submissions."}
            </li>
          </ul>
        </div>

        {/* ── Submit Action ────────────────────────────────────────── */}
        <div className="pt-2">
          <PrimaryButton
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            className="w-full font-bold text-base"
          >
            {isSubmitting ? t.disputes.submittingBtn : t.disputes.submitBtn}
          </PrimaryButton>

          {isSubmitting && (
            <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-2 mt-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>
                {isHi
                  ? "विवाद समीक्षा डेस्क को भेजा जा रहा है…"
                  : "Submitting dispute challenge for review…"}
              </span>
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

export default DisputeFormContainer;

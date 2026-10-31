"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Sparkles,
  RotateCcw,
  Search,
  ShieldAlert,
  MapPin,
  CheckCircle2,
  Shield,
  Info,
} from "lucide-react";
import { apiClient, ApiError } from "@/lib/api/client";
import { AlertsResponseContract } from "@/lib/contracts";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useLanguage } from "@/hooks/useLanguage";
import { AlertCard } from "./AlertCard";

type FetchState =
  | { status: "loading" }
  | { status: "success"; data: AlertsResponseContract }
  | { status: "error"; message: string; isNetworkError: boolean };

type TypeFilter = "ALL" | "SPIKE" | "NEW_TYPE";

export function AlertsFeedContainer() {
  const { lang, t } = useLanguage();
  const isHi = lang === "hi";

  const [fetchState, setFetchState] = useState<FetchState>({ status: "loading" });
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [pincodeQuery, setPincodeQuery] = useState<string>("");
  const [activePincode, setActivePincode] = useState<string>("");

  // Data fetch function (called on user refresh / filter apply)
  const loadAlerts = useCallback(async (pincode?: string) => {
    setFetchState({ status: "loading" });

    try {
      const activePincode = (pincode && pincode.trim().length > 0) ? pincode.trim() : "560102";
      const params: Record<string, string> = { pincode: activePincode };
      if (pincode && pincode.trim().length > 0) {
        params.pincode = pincode.trim();
      }

      const response = await apiClient.get<AlertsResponseContract>("/alerts", {
        params: Object.keys(params).length > 0 ? params : undefined,
      });

      if (!response || !Array.isArray(response.alerts)) {
        setFetchState({
          status: "error",
          message: isHi ? "सर्वर से अप्रत्याशित अलर्ट प्रारूप प्राप्त हुआ।" : "The intelligence server returned an unexpected alerts format.",
          isNetworkError: false,
        });
        return;
      }

      setFetchState({ status: "success", data: response });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setFetchState({
          status: "error",
          message:
            err.message ||
            (isHi
              ? `API त्रुटि (${err.status}): GET /alerts से थ्रेट अलर्ट पुनर्प्राप्त नहीं किए जा सके।`
              : `API error (${err.status}): Could not retrieve threat alerts from GET /alerts.`),
          isNetworkError: err.status === 0,
        });
      } else {
        setFetchState({
          status: "error",
          message: isHi
            ? "अलर्ट सर्वर से कनेक्शन स्थापित करने में असमर्थ।"
            : "Unable to establish connection with the alerts intelligence server.",
          isNetworkError: true,
        });
      }
    }
  }, [isHi]);

  // Initial load on mount (purely asynchronous to avoid cascading renders)
  useEffect(() => {
    let ignore = false;

    async function fetchInitialAlerts() {
      try {
        const response = await apiClient.get<AlertsResponseContract>("/alerts", {
          params: { pincode: "560102" },
        });

        if (!ignore) {
          if (!response || !Array.isArray(response.alerts)) {
            setFetchState({
              status: "error",
              message: isHi ? "सर्वर से अप्रत्याशित अलर्ट प्रारूप प्राप्त हुआ।" : "The intelligence server returned an unexpected alerts format.",
              isNetworkError: false,
            });
            return;
          }

          setFetchState({ status: "success", data: response });
        }
      } catch (err: unknown) {
        if (!ignore) {
          if (err instanceof ApiError) {
            setFetchState({
              status: "error",
              message:
                err.message ||
                (isHi
                  ? `API त्रुटि (${err.status}): GET /alerts से थ्रेट अलर्ट पुनर्प्राप्त नहीं किए जा सके।`
                  : `API error (${err.status}): Could not retrieve threat alerts from GET /alerts.`),
              isNetworkError: err.status === 0,
            });
          } else {
            setFetchState({
              status: "error",
              message: isHi
                ? "अलर्ट सर्वर से कनेक्शन स्थापित करने में असमर्थ।"
                : "Unable to establish connection with the alerts intelligence server.",
              isNetworkError: true,
            });
          }
        }
      }
    }

    fetchInitialAlerts();

    return () => {
      ignore = true;
    };
  }, [isHi]);

  const handleApplyPincode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pincodeQuery.trim();
    setActivePincode(cleanPin);
    loadAlerts(cleanPin);
  };

  const handleClearPincode = () => {
    setPincodeQuery("");
    setActivePincode("");
    loadAlerts();
  };

  // Filter alerts by active tab
  const displayedAlerts = useMemo(() => {
    if (fetchState.status !== "success") return [];
    if (typeFilter === "ALL") return fetchState.data.alerts;
    return fetchState.data.alerts.filter((a) => a.type?.toUpperCase() === typeFilter);
  }, [fetchState, typeFilter]);

  // Summary counts calculated exclusively from real returned alerts
  const summaryCounts = useMemo(() => {
    if (fetchState.status !== "success") return null;
    const all = fetchState.data.alerts;
    const spikeCount = all.filter((a) => a.type?.toUpperCase() === "SPIKE").length;
    const newTypeCount = all.filter((a) => a.type?.toUpperCase() === "NEW_TYPE").length;
    const uniquePins = new Set(all.map((a) => a.pincode)).size;

    return {
      total: all.length,
      spikes: spikeCount,
      newTypes: newTypeCount,
      uniqueAreas: uniquePins,
    };
  }, [fetchState]);

  return (
    <div className="space-y-6">
      {/* ── Responsible Messaging & Privacy Notice ──────────────────── */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 text-xs text-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-slate-100 block">
              {isHi ? "स्वतंत्र सत्यापन एवं ज़िम्मेदार उपयोग" : "Independent Verification & Responsible Use"}
            </span>
            <p className="text-slate-400 leading-relaxed text-[11px] sm:text-xs">
              {isHi
                ? "अलर्ट पड़ोस के क्षेत्रों में पाए गए असामान्य रिपोर्टिंग पैटर्न (वृद्धि या नए फ्रॉड प्रकार) को रेखांकित करते हैं। किसी भी सुरक्षात्मक कदम से पहले स्वतंत्र रूप से पुष्टि अवश्य करें।"
                : "Alerts highlight unusual reporting patterns (surges or newly observed scam types) detected in neighborhood clusters. Alerts represent community signals and should be verified independently before taking protective action."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/20 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isHi ? "गुमनाम खुफिया जानकारी" : "Anonymized Intelligence"}
          </span>
        </div>
      </div>

      {/* ── Toolbar: Type Filter Tabs & PIN Code Filter ──────────────── */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Type Filter Tabs */}
          <div
            role="tablist"
            aria-label="Filter alerts by type"
            className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 overflow-x-auto"
          >
            <button
              type="button"
              role="tab"
              aria-selected={typeFilter === "ALL"}
              onClick={() => setTypeFilter("ALL")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                typeFilter === "ALL"
                  ? "bg-teal-500/20 text-teal-300 font-semibold shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t.alerts.allAlerts} {summaryCounts ? `(${summaryCounts.total})` : ""}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={typeFilter === "SPIKE"}
              onClick={() => setTypeFilter("SPIKE")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                typeFilter === "SPIKE"
                  ? "bg-amber-500/20 text-amber-300 font-semibold shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              {t.alerts.volumeSpikes} {summaryCounts ? `(${summaryCounts.spikes})` : ""}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={typeFilter === "NEW_TYPE"}
              onClick={() => setTypeFilter("NEW_TYPE")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                typeFilter === "NEW_TYPE"
                  ? "bg-teal-500/20 text-teal-300 font-semibold shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {t.alerts.newVectors} {summaryCounts ? `(${summaryCounts.newTypes})` : ""}
            </button>
          </div>

          {/* PIN code filter & refresh button */}
          <div className="flex items-center gap-2 flex-1 md:max-w-xs self-stretch md:self-auto">
            <form onSubmit={handleApplyPincode} className="relative flex-1">
              <input
                type="text"
                inputMode="numeric"
                value={pincodeQuery}
                onChange={(e) => setPincodeQuery(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder={isHi ? "पिन कोड द्वारा फ़िल्टर करें..." : "Filter by PIN (e.g. 560102)..."}
                className="w-full h-9 pl-8 pr-3 bg-slate-950 border border-slate-700/80 hover:border-slate-600 focus:border-teal-500 text-xs text-slate-100 placeholder:text-slate-500 rounded-lg outline-none font-mono"
              />
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            </form>

            <PrimaryButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                const cleanPin = pincodeQuery.trim();
                setActivePincode(cleanPin);
                loadAlerts(cleanPin);
              }}
              className="text-xs h-9"
            >
              {t.alerts.filterBtn}
            </PrimaryButton>

            {activePincode && (
              <button
                type="button"
                onClick={handleClearPincode}
                className="text-xs text-teal-400 hover:text-teal-300 underline underline-offset-4 px-1 whitespace-nowrap"
              >
                {t.alerts.clearBtn}
              </button>
            )}

            <button
              type="button"
              onClick={() => loadAlerts(activePincode)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors shrink-0"
              title={isHi ? "अलर्ट रीफ्रेश करें" : "Refresh alerts"}
              aria-label={isHi ? "अलर्ट रीफ्रेश करें" : "Refresh alerts feed"}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Summary Metrics Bar (Derived strictly from real alerts) ─── */}
      {summaryCounts && summaryCounts.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
              {t.alerts.activeAlerts}
            </span>
            <span className="text-2xl font-bold font-mono text-slate-100">
              {summaryCounts.total}
            </span>
            <span className="text-[10px] text-slate-400 block">
              {isHi ? "वर्तमान संकेत" : "current signals"}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold block">
              {t.alerts.reportSurges}
            </span>
            <span className="text-2xl font-bold font-mono text-amber-300">
              {summaryCounts.spikes}
            </span>
            <span className="text-[10px] text-slate-400 block">
              {isHi ? "उछाल (SPIKE) अलर्ट" : "SPIKE alerts"}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[10px] text-teal-400 uppercase tracking-wider font-semibold block">
              {t.alerts.emergingVectors}
            </span>
            <span className="text-2xl font-bold font-mono text-teal-300">
              {summaryCounts.newTypes}
            </span>
            <span className="text-[10px] text-slate-400 block">
              {isHi ? "नए वेक्टर अलर्ट" : "NEW_TYPE alerts"}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
              {t.alerts.areasAffected}
            </span>
            <span className="text-2xl font-bold font-mono text-slate-200">
              {summaryCounts.uniqueAreas}
            </span>
            <span className="text-[10px] text-slate-400 block">
              {isHi ? "निगरानी पिन कोड" : "monitored PINs"}
            </span>
          </div>
        </div>
      )}

      {/* ── Main Content Feed ───────────────────────────────────────── */}
      {fetchState.status === "loading" && (
        <div className="space-y-4">
          <LoadingSkeleton variant="card" className="h-36 rounded-xl" />
          <LoadingSkeleton variant="card" className="h-36 rounded-xl" />
          <LoadingSkeleton variant="card" className="h-36 rounded-xl" />
        </div>
      )}

      {fetchState.status === "error" && (
        <ErrorState
          title={isHi ? "अलर्ट फ़ीड उपलब्ध नहीं है" : "Threat Alerts Feed Unavailable"}
          description={fetchState.message}
          onRetry={() => loadAlerts(activePincode)}
          action={
            <div className="flex flex-col sm:flex-row items-center gap-3 mt-4">
              <PrimaryButton
                variant="secondary"
                size="md"
                onClick={() => loadAlerts(activePincode)}
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                {isHi ? "पुनः प्रयास करें" : "Retry Connection"}
              </PrimaryButton>
              <Link href="/map">
                <PrimaryButton variant="outline" size="md">
                  {isHi ? t.nav.map : "View Scam Map"}
                </PrimaryButton>
              </Link>
              <Link href="/lookup">
                <PrimaryButton variant="outline" size="md" leftIcon={<Search className="w-4 h-4" />}>
                  {isHi ? t.lookup.checkAnother : "Check an Identifier"}
                </PrimaryButton>
              </Link>
              <Link href="/report">
                <PrimaryButton variant="primary" size="md" leftIcon={<ShieldAlert className="w-4 h-4" />}>
                  {isHi ? t.home.reportIncident : "Report Incident"}
                </PrimaryButton>
              </Link>
            </div>
          }
        />
      )}

      {fetchState.status === "success" && displayedAlerts.length === 0 && (
        <EmptyState
          title={isHi ? "कोई सक्रिय थ्रेट अलर्ट नहीं" : "No Active Threat Alerts"}
          description={
            activePincode || typeFilter !== "ALL"
              ? (isHi
                  ? "आपकी वर्तमान फ़िल्टर सेटिंग्स से कोई अलर्ट मेल नहीं खाता। 'सभी अलर्ट' चुनकर या पिन कोड हटाकर पुनः देखें।"
                  : `No alerts match your current filter settings. Try selecting 'All Alerts' or clearing the PIN code filter to check across all monitored locations.`)
              : (isHi
                  ? "वर्तमान में कोई असामान्य स्कैम वृद्धि या नए फ्रॉड पैटर्न दर्ज नहीं हैं। यह सामान्य सामुदायिक गतिविधि दर्शाता है। संदिग्ध नंबरों और लिंक की रिपोर्ट जारी रखें।"
                  : `No unusual scam report spikes or newly observed patterns currently meet the alert threshold. This reflects normal community reporting activity. Please continue to report suspicious numbers, payment requests, and fraudulent links.`)
          }
          action={
            <div className="flex items-center gap-3">
              {(activePincode || typeFilter !== "ALL") && (
                <PrimaryButton
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setTypeFilter("ALL");
                    handleClearPincode();
                  }}
                >
                  {isHi ? "फ़िल्टर साफ़ करें" : "Clear Filters"}
                </PrimaryButton>
              )}
              <Link href="/report">
                <PrimaryButton
                  variant="primary"
                  size="sm"
                  leftIcon={<ShieldAlert className="w-4 h-4" />}
                >
                  {isHi ? "स्कैम रिपोर्ट दर्ज करें" : "Submit a Scam Report"}
                </PrimaryButton>
              </Link>
            </div>
          }
        />
      )}

      {fetchState.status === "success" && displayedAlerts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              {isHi
                ? `${displayedAlerts.length} अलर्ट प्रदर्शित`
                : `Showing ${displayedAlerts.length} ${displayedAlerts.length === 1 ? "alert" : "alerts"}`}
              {activePincode ? ` (${isHi ? "पिन" : "PIN"} ${activePincode})` : ""}
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Signal source: GET /alerts
            </span>
          </div>

          <div className="space-y-4">
            {displayedAlerts.map((item, index) => (
              <AlertCard key={`${item.pincode}-${item.type}-${index}`} alert={item} />
            ))}
          </div>
        </div>
      )}

      {/* ── Context & Navigation Footer ─────────────────────────────── */}
      <div className="rounded-xl bg-slate-900/40 border border-slate-800 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5 justify-center sm:justify-start">
            <Info className="w-4 h-4 text-teal-400" />
            {isHi ? "क्या कोई असामान्य संदेश या पेमेंट क्यूआर कोड मिला है?" : "Received an unusual message or payment QR code?"}
          </h4>
          <p className="text-xs text-slate-400">
            {isHi
              ? "जवाब देने या पैसे भेजने से पहले फ़ोन नंबर या UPI ID की जांच करें, या अपने पड़ोस की सुरक्षा के लिए रिपोर्ट दर्ज करें।"
              : "Check the phone number or UPI ID before responding, or submit a new report to help protect your community."}
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Link href="/lookup">
            <PrimaryButton variant="outline" size="sm" leftIcon={<Search className="w-3.5 h-3.5" />}>
              {isHi ? t.nav.lookup : "Lookup"}
            </PrimaryButton>
          </Link>
          <Link href="/map">
            <PrimaryButton variant="secondary" size="sm">
              {isHi ? t.nav.map : "Scam Map"}
            </PrimaryButton>
          </Link>
          <Link href="/report">
            <PrimaryButton variant="primary" size="sm" leftIcon={<ShieldAlert className="w-3.5 h-3.5" />}>
              {isHi ? t.home.reportIncident : "Report Incident"}
            </PrimaryButton>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AlertsFeedContainer;

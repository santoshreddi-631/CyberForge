"use client";

import React, { useState, useCallback, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  X,
  Loader2,
  AlertCircle,
  ShieldQuestion,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { LookupIdentifierType, BackendLookupResult } from "@/types";
import { validateIdentifier, detectIdentifierType } from "@/lib/utils/lookupValidation";
import { apiClient, ApiError } from "@/lib/api/client";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { useLanguage } from "@/hooks/useLanguage";
import { IdentifierTypeSelector, IDENTIFIER_OPTIONS } from "./IdentifierTypeSelector";
import { LookupResultCard } from "./LookupResultCard";
import { StayAlertSection } from "./StayAlertSection";

export function LookupClientContainer() {
  const { lang, t } = useLanguage();
  const isHi = lang === "hi";

  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const queryParam = (
    searchParams.get("q") ||
    searchParams.get("query") ||
    searchParams.get("value") ||
    ""
  ).trim();

  // State management initialized from query parameter
  const [selectedType, setSelectedType] = useState<LookupIdentifierType>(() => {
    return queryParam ? detectIdentifierType(queryParam) : "phone";
  });
  const [inputValue, setInputValue] = useState<string>(queryParam);
  const [prevQueryParam, setPrevQueryParam] = useState<string>(queryParam);

  // Sync state if navigation changes the query parameter without effect cascading renders
  if (queryParam !== prevQueryParam) {
    setPrevQueryParam(queryParam);
    setInputValue(queryParam);
    if (queryParam) {
      setSelectedType(detectIdentifierType(queryParam));
    }
  }

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BackendLookupResult | null>(null);
  const [searchedIdentifier, setSearchedIdentifier] = useState("");
  const [apiError, setApiError] = useState<{
    title: string;
    description: string;
    canRetry: boolean;
  } | null>(null);

  // Current selected option metadata
  const currentOption =
    IDENTIFIER_OPTIONS.find((opt) => opt.type === selectedType) ||
    IDENTIFIER_OPTIONS[0];

  const handleTypeSelect = (type: LookupIdentifierType) => {
    setSelectedType(type);
    setValidationError(null);
    setApiError(null);
  };

  const handleClear = () => {
    setInputValue("");
    setValidationError(null);
    setResult(null);
    setApiError(null);
    setSearchedIdentifier("");
  };

  const executeLookup = useCallback(async () => {
    const trimmed = inputValue.trim();

    // 1. Validate input
    const validation = validateIdentifier(selectedType, trimmed);
    if (!validation.isValid) {
      setValidationError(
        validation.errorMessage ||
          (isHi ? "कृपया एक मान्य पहचानकर्ता दर्ज करें।" : "Please enter a valid identifier.")
      );
      return;
    }

    setValidationError(null);
    setApiError(null);
    setIsLoading(true);
    setResult(null);
    setSearchedIdentifier(trimmed);

    try {
      // 2. Call backend GET /lookup?type=<type>&value=<value>
      const response = await apiClient.get<BackendLookupResult>("/lookup", {
        params: {
          type: selectedType,
          value: trimmed,
        },
      });

      startTransition(() => {
        setResult(response);
        setIsLoading(false);
      });
    } catch (err: unknown) {
      setIsLoading(false);

      if (err instanceof ApiError) {
        if (err.status === 400) {
          const detail =
            typeof err.data === "object" && err.data !== null && "error" in err.data
              ? String((err.data as { error: unknown }).error)
              : err.message || (isHi ? "पहचानकर्ता प्रारूप अमान्य है।" : "The identifier format is invalid or rejected by verification rules.");

          setValidationError(detail);
        } else if (err.status === 403) {
          setApiError({
            title: isHi ? "सत्यापन सेवा सूचना" : "Verification Service License Notice",
            description: isHi ? "सत्यापन सेवा वर्तमान में रखरखाव में है। कृपया व्यवस्थापक से संपर्क करें।" : "The verification network license is currently under maintenance. Please contact the administrator.",
            canRetry: false,
          });
        } else if (err.status === 429) {
          setApiError({
            title: isHi ? "अनुरोध सीमा पार हो गई" : "Rate Limit Exceeded",
            description: isHi ? "आपने कम समय में बहुत अधिक अनुरोध किए हैं। कृपया कुछ क्षण प्रतीक्षा करें।" : "You have submitted too many requests in a short period. Please wait a moment before trying again.",
            canRetry: true,
          });
        } else {
          setApiError({
            title: isHi ? "सत्यापन पूरा करने में असमर्थ" : "Unable to Complete Verification",
            description: isHi ? "जांच की प्रक्रिया के दौरान सर्वर त्रुटि हुई। कृपया पुनः प्रयास करें।" : "A server disruption occurred while processing your lookup. Please try again shortly.",
            canRetry: true,
          });
        }
      } else {
        // Network error or backend offline
        setApiError({
          title: isHi ? "सेवा अस्थायी रूप से अनुपलब्ध है" : "Service Temporarily Unavailable",
          description: isHi
            ? "सत्यापन नेटवर्क से संपर्क नहीं हो सका। कृपया जांचें कि बैकएंड चालू है और पुनः प्रयास करें।"
            : "Could not connect to the verification network. Please ensure the backend is running and your connection is active.",
          canRetry: true,
        });
      }
    }
  }, [inputValue, isHi, selectedType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading) {
      executeLookup();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* 1. Main Search Form Card */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 shadow-xl backdrop-blur-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* A. Identifier Type Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5">
              {t.lookup.selectType}
            </label>
            <IdentifierTypeSelector
              selectedType={selectedType}
              onSelectType={handleTypeSelect}
              disabled={isLoading}
            />
          </div>

          {/* B. Input Field & Clear / Submit controls */}
          <div className="space-y-2">
            <label htmlFor="identifier-input" className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              {isHi ? currentOption.labelHi : currentOption.label}
            </label>

            <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
              <div className="relative flex-1">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  id="identifier-input"
                  type="text"
                  value={inputValue}
                  disabled={isLoading}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder={isHi ? currentOption.placeholderHi : currentOption.placeholder}
                  className={cn(
                    "w-full h-12 pl-11 pr-10 rounded-xl bg-slate-950 border text-slate-100 placeholder:text-slate-400 text-sm sm:text-base outline-none transition-all",
                    validationError
                      ? "border-rose-500/80 focus:border-rose-400 focus:ring-1 focus:ring-rose-500/40"
                      : "border-slate-700/80 hover:border-slate-600 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/40",
                    isLoading && "opacity-70 cursor-not-allowed"
                  )}
                />

                {inputValue.length > 0 && !isLoading && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors focus:outline-none"
                    aria-label={t.lookup.clear}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Action Buttons: Clear and Check Now */}
              <div className="flex items-center gap-2 shrink-0">
                {inputValue.length > 0 && !isLoading && (
                  <PrimaryButton
                    type="button"
                    variant="ghost"
                    size="lg"
                    onClick={handleClear}
                    className="h-12 px-3 text-slate-400 hover:text-slate-200"
                  >
                    {t.lookup.clear}
                  </PrimaryButton>
                )}

                <PrimaryButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isLoading}
                  isLoading={isLoading}
                  className="h-12 px-6 flex-1 sm:flex-initial font-semibold"
                >
                  {isLoading ? t.lookup.checkingButton : t.lookup.checkButton}
                </PrimaryButton>
              </div>
            </div>

            {/* Helper or Validation Error Message */}
            {validationError ? (
              <p className="flex items-center gap-1.5 text-xs text-rose-400 mt-2 font-medium" role="alert">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{validationError}</span>
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1.5">
                {isHi ? currentOption.helperHi : currentOption.helper}
              </p>
            )}
          </div>
        </form>
      </div>

      {/* 2. Result Section (Dynamic State Handling) */}
      <section aria-live="polite" aria-atomic="true">
        {/* Loading State */}
        {isLoading && (
          <div className="p-8 sm:p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-4">
            <Loader2 className="w-8 h-8 text-teal-400 animate-spin mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-100">
                {t.lookup.searching}
              </h3>
              <p className="text-xs text-slate-400">
                {t.lookup.searchingDesc}
              </p>
            </div>
            <div className="max-w-md mx-auto pt-2">
              <LoadingSkeleton variant="row" count={2} />
            </div>
          </div>
        )}

        {/* API Error State (Network or Server Disruption) */}
        {!isLoading && apiError && (
          <ErrorState
            title={apiError.title}
            description={apiError.description}
            onRetry={apiError.canRetry ? executeLookup : undefined}
          />
        )}

        {/* Successful Result State */}
        {!isLoading && !apiError && result && (
          <LookupResultCard result={result} searchedValue={searchedIdentifier} />
        )}

        {/* Initial Empty / Idle Guidance State */}
        {!isLoading && !apiError && !result && (
          <div className="p-8 sm:p-10 rounded-2xl border border-dashed border-slate-800/80 bg-slate-900/30 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800/60 border border-slate-700/60 text-slate-400 flex items-center justify-center mx-auto">
              <ShieldQuestion className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-200">
              {t.lookup.emptyPrompt}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
              {t.lookup.emptyDesc}
            </p>
          </div>
        )}
      </section>

      {/* 3. Safety Reminders Section (Always visible below interface) */}
      <StayAlertSection />
    </div>
  );
}

export default LookupClientContainer;

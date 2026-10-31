"use client";

import React, { useState, useCallback, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  X,
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
      <div className="rounded-[2.5rem] bg-white border border-[#EAE6FD] p-6 sm:p-9 shadow-[0_16px_50px_rgba(96,53,232,0.06)]">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* A. Identifier Type Selector */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#171638] mb-3">
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
            <label htmlFor="identifier-input" className="block text-xs font-black uppercase tracking-wider text-[#171638]">
              {isHi ? currentOption.labelHi : currentOption.label}
            </label>

            <div className="flex flex-col sm:flex-row items-stretch gap-3">
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#6035E8]">
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
                    "w-full h-13 pl-12 pr-10 rounded-2xl sm:rounded-full bg-[#F6F4FE] border text-[#171638] placeholder:text-[#837FA8] text-sm sm:text-base font-semibold outline-none transition-all",
                    validationError
                      ? "border-rose-400 focus:ring-2 focus:ring-rose-200"
                      : "border-[#EAE6FD] hover:border-[#6035E8]/40 focus:border-[#6035E8] focus:bg-white focus:ring-4 focus:ring-[#6035E8]/10",
                    isLoading && "opacity-70 cursor-not-allowed"
                  )}
                />

                {inputValue.length > 0 && !isLoading && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-slate-400 hover:text-[#171638] hover:bg-[#F0EDFF] transition-colors focus:outline-none cursor-pointer"
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
                    className="h-13 px-4 text-[#6E6D8F] hover:text-[#171638]"
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
                  className="h-13 px-8 flex-1 sm:flex-initial font-black"
                >
                  {isLoading ? t.lookup.checkingButton : t.lookup.checkButton}
                </PrimaryButton>
              </div>
            </div>

            {/* Helper text or validation error */}
            {validationError ? (
              <p className="flex items-center gap-1.5 text-xs text-rose-600 font-bold pt-1" role="alert">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{validationError}</span>
              </p>
            ) : (
              <p className="text-[11px] text-[#6E6D8F]">
                {isHi ? currentOption.helperHi : currentOption.helper}
              </p>
            )}
          </div>
        </form>
      </div>

      {/* 2. Loading State */}
      {isLoading && (
        <div className="rounded-[2.5rem] bg-white border border-[#EAE6FD] p-8 shadow-xl space-y-4">
          <div className="flex items-center gap-3 text-sm font-black text-[#6035E8]">
            <div className="w-5 h-5 rounded-full border-2 border-[#6035E8] border-t-transparent animate-spin" />
            <span>{t.lookup.searching}</span>
          </div>
          <p className="text-xs text-[#6E6D8F]">{t.lookup.searchingDesc}</p>
          <LoadingSkeleton variant="card" className="h-40" />
        </div>
      )}

      {/* 3. API Disruption Error State */}
      {apiError && !isLoading && (
        <ErrorState
          title={apiError.title}
          description={apiError.description}
          onRetry={apiError.canRetry ? executeLookup : undefined}
        />
      )}

      {/* 4. Verified Intelligence Result Display */}
      {result && !isLoading && (
        <LookupResultCard result={result} searchedValue={searchedIdentifier} />
      )}

      {/* 5. Clean Empty State */}
      {!result && !isLoading && !apiError && (
        <div className="p-8 sm:p-10 rounded-[2.5rem] bg-white border border-[#EAE6FD] text-center space-y-3 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-[#F0EDFF] text-[#6035E8] flex items-center justify-center mx-auto shadow-sm">
            <ShieldQuestion className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-[#171638]">{t.lookup.emptyPrompt}</h3>
          <p className="text-xs sm:text-sm text-[#6E6D8F] max-w-md mx-auto leading-relaxed">
            {t.lookup.emptyDesc}
          </p>
        </div>
      )}

      {/* 6. Continuous Citizen Safety Advisory */}
      <StayAlertSection />
    </div>
  );
}

export default LookupClientContainer;

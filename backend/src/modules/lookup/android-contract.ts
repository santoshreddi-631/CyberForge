import type { TrustVerdict } from "../trust/trust.types.js";

export const ANDROID_LOOKUP_TIMEOUT_MS = 300;

export interface AndroidRiskResult {
  available: boolean;
  verdict: TrustVerdict | null;
  shouldWarn: boolean;
}

/**
 * Converts the existing public lookup verdict into a conservative call-risk
 * decision for a future Android CallScreeningService client.
 */
export function toAndroidRisk(
  verdict: TrustVerdict | null,
  timedOut = false,
): AndroidRiskResult {
  if (timedOut || verdict === null) {
    return { available: false, verdict: null, shouldWarn: true };
  }

  return {
    available: true,
    verdict,
    shouldWarn: verdict !== "VERIFIED_BUSINESS",
  };
}

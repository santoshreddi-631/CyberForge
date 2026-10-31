import type { TrustVerdict } from "../trust/trust.types.js";

export interface LookupState {
  verified: boolean;
  challenged: boolean;
  rawReportCount: number;
  eligibleReportCount: number;
  distinctEligibleReporters: number;
}

export function classifyLookup(state: LookupState): TrustVerdict {
  if (state.verified) return "VERIFIED_BUSINESS";
  if (state.challenged) return state.rawReportCount > 0 ? "SUSPICIOUS" : "NO_REPORTS";
  if (state.eligibleReportCount > 0 && state.distinctEligibleReporters >= 5) return "KNOWN_SCAM";
  if (state.rawReportCount > 0) return "SUSPICIOUS";
  return "NO_REPORTS";
}

export const classifyVerdict = classifyLookup;

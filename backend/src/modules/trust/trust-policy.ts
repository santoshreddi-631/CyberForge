import type { TrustPolicy } from "./trust.types.js";

export const DEFAULT_TRUST_POLICY: Readonly<TrustPolicy> = Object.freeze({
  minimumIndependentReporters: 5,
  minimumIndependentIpPrefixes: 3,
  // A shared network contributes one eligible voice per identifier case.
  maximumTrustedReportersPerIpPrefix: 1,
  minimumEvidenceScore: 0.65,
  minimumTimeBuckets: 2,
  timeBucketMinutes: 60,
  burstWindowMinutes: 60,
  coordinatedBurstReportCount: 12,
  concentratedIpReportCount: 5,
  concentratedIpRatio: 0.5,
  copiedNoteRatio: 0.6,
  substantiveNoteCharacters: 24,
  substantiveNoteTokens: 5,
  screenshotEvidenceBonus: 0.05,
  trustedReporterEvidenceBonus: 0.1,
  repeatedReporterPenalty: 0.15,
  coordinatedBurstPenalty: 0.2,
  ipConcentrationPenalty: 0.2,
  circuitBreakerWindowMinutes: 15,
  circuitBreakerThreshold: 8,
});

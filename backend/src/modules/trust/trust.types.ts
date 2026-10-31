export type TrustStatus = "eligible" | "ignored";
export type TrustVerdict = "KNOWN_SCAM" | "SUSPICIOUS" | "NO_REPORTS" | "VERIFIED_BUSINESS";

export interface TrustReport {
  reportId: string;
  reporterKey: string;
  ipPrefixKey: string;
  occurredAt: string | Date;
  note?: string | null;
  hasScreenshot?: boolean;
  valid?: boolean;
  duplicate?: boolean;
  reporterPreviouslyTrusted?: boolean;
}

export interface TrustSubject {
  verifiedBusiness?: boolean;
  challenged?: boolean;
}

export interface TrustPolicy {
  minimumIndependentReporters: number;
  minimumIndependentIpPrefixes: number;
  maximumTrustedReportersPerIpPrefix: number;
  minimumEvidenceScore: number;
  minimumTimeBuckets: number;
  timeBucketMinutes: number;
  burstWindowMinutes: number;
  coordinatedBurstReportCount: number;
  concentratedIpReportCount: number;
  concentratedIpRatio: number;
  copiedNoteRatio: number;
  substantiveNoteCharacters: number;
  substantiveNoteTokens: number;
  screenshotEvidenceBonus: number;
  trustedReporterEvidenceBonus: number;
  repeatedReporterPenalty: number;
  coordinatedBurstPenalty: number;
  ipConcentrationPenalty: number;
  circuitBreakerWindowMinutes: number;
  circuitBreakerThreshold: number;
}

export interface TrustSignals {
  validReportCount: number;
  duplicateReportCount: number;
  invalidReportCount: number;
  independentReporterCount: number;
  independentIpPrefixCount: number;
  independentVoiceCount: number;
  maxReportsFromOneReporter: number;
  maxReportsFromOneIpPrefix: number;
  maxIpPrefixRatio: number;
  uniqueTimeBucketCount: number;
  maxBurstCount: number;
  copiedNoteRatio: number;
  averageEvidenceQuality: number;
  evidenceScore: number;
  coordinatedBurst: boolean;
  suspiciousIpConcentration: boolean;
  repeatedReporter: boolean;
  circuitBreakerTripped: boolean;
  circuitBreakerSurgeCount: number;
}

export interface ReportTrustDecision {
  reportId: string;
  status: TrustStatus;
  weight: number;
  reasons: string[];
}

export interface TrustEvaluation {
  verdict: TrustVerdict;
  status: TrustStatus;
  trusted: boolean;
  circuitBreakerTripped: boolean;
  score: number;
  reasons: string[];
  signals: TrustSignals;
  eligibleReportIds: string[];
  reportDecisions: ReportTrustDecision[];
}

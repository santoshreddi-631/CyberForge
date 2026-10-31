import { DEFAULT_TRUST_POLICY } from "./trust-policy.js";
import { buildTrustSignals, selectIndependentVoiceReports } from "./trust-signals.js";
import type {
  ReportTrustDecision,
  TrustPolicy,
  TrustReport,
  TrustSubject,
  TrustEvaluation,
} from "./trust.types.js";

function roundWeight(weight: number): number {
  return Number(Math.max(0, Math.min(1, weight)).toFixed(4));
}

export function evaluateTrust(
  reports: TrustReport[],
  subject: TrustSubject = {},
  policy: TrustPolicy = DEFAULT_TRUST_POLICY,
): TrustEvaluation {
  const signals = buildTrustSignals(reports, policy);
  const reasons: string[] = [];

  if (subject.verifiedBusiness) {
    reasons.push("Verified business protection blocks scam eligibility.");
  }
  if (subject.challenged) {
    reasons.push("Identifier is under challenge and cannot become a known scam.");
  }
  if (signals.validReportCount === 0) {
    reasons.push("No valid, non-duplicate reports are available.");
  }
  if (signals.duplicateReportCount > 0) {
    reasons.push(`${signals.duplicateReportCount} duplicate report(s) were excluded.`);
  }
  if (signals.invalidReportCount > 0) {
    reasons.push(`${signals.invalidReportCount} invalid report(s) were excluded.`);
  }
  if (signals.independentVoiceCount < policy.minimumIndependentReporters) {
    reasons.push(`Fewer than ${policy.minimumIndependentReporters} independent reporter/network voices are present.`);
  }
  if (signals.independentIpPrefixCount < policy.minimumIndependentIpPrefixes) {
    reasons.push(`Fewer than ${policy.minimumIndependentIpPrefixes} independent IP prefixes are present.`);
  }
  if (signals.repeatedReporter) {
    reasons.push("Repeated submissions from one reporter count as one independent voice.");
  }
  if (signals.suspiciousIpConcentration) {
    reasons.push("IP-prefix concentration is treated as coordinated-risk evidence, not independent corroboration.");
  }
  if (signals.circuitBreakerTripped) {
    reasons.push("Target circuit breaker tripped: acute report surge detected (" + signals.circuitBreakerSurgeCount + " reports in <=" + policy.circuitBreakerWindowMinutes + "m). Identifier is locked in cooling-off protection and cannot be promoted to KNOWN_SCAM.");
  }
  if (signals.coordinatedBurst) {
    reasons.push("A short coordinated burst with concentration or copied notes is discounted.");
  }
  if (signals.copiedNoteRatio >= policy.copiedNoteRatio) {
    reasons.push("Copied note concentration reduces evidence quality.");
  }
  if (signals.uniqueTimeBucketCount < policy.minimumTimeBuckets) {
    reasons.push("Reports do not span enough time buckets for corroboration.");
  }
  if (signals.averageEvidenceQuality < 0.6) {
    reasons.push("Evidence quality is limited because reports lack substantive independent descriptions.");
  }

  const trusted =
    !subject.verifiedBusiness &&
    !subject.challenged &&
    !signals.circuitBreakerTripped &&
    signals.validReportCount > 0 &&
    signals.independentVoiceCount >= policy.minimumIndependentReporters &&
    signals.independentIpPrefixCount >= policy.minimumIndependentIpPrefixes &&
    signals.uniqueTimeBucketCount >= policy.minimumTimeBuckets &&
    !signals.coordinatedBurst &&
    signals.evidenceScore >= policy.minimumEvidenceScore;

  if (trusted) reasons.push("Independent reporter, network, time, and evidence thresholds are satisfied.");
  const verdict = subject.verifiedBusiness
    ? "VERIFIED_BUSINESS"
    : signals.validReportCount === 0
      ? "NO_REPORTS"
      : trusted
        ? "KNOWN_SCAM"
        : "SUSPICIOUS";
  const eligible = new Set<string>(trusted
    ? selectIndependentVoiceReports(reports, policy).map((report) => report.reportId)
    : []);

  const seenReportIds = new Set<string>();
  const reportDecisions: ReportTrustDecision[] = reports.map((report) => {
    const reportReasons: string[] = [];
    const repeatedReportId = seenReportIds.has(report.reportId);
    seenReportIds.add(report.reportId);
    if (report.valid === false) reportReasons.push("Invalid report excluded before trust evaluation.");
    if (report.duplicate || repeatedReportId) reportReasons.push("Duplicate report excluded from trust evaluation.");
    if (report.valid !== false && !report.duplicate && !repeatedReportId && !eligible.has(report.reportId)) {
      reportReasons.push(trusted
        ? "Reporter or IP prefix is already represented by a stronger independent voice."
        : "Case has not met trusted eligibility.");
    }
    const isEligible = eligible.has(report.reportId) && !report.duplicate && !repeatedReportId;
    if (isEligible) reportReasons.push("Representative report from a distinct reporter and IP prefix contributes one trusted voice.");
    return {
      reportId: report.reportId,
      status: isEligible ? "eligible" : "ignored",
      weight: isEligible ? roundWeight(1 / Math.max(1, signals.independentVoiceCount)) : 0,
      reasons: reportReasons,
    };
  });

  return {
    verdict,
    status: trusted ? "eligible" : "ignored",
    trusted,
    circuitBreakerTripped: signals.circuitBreakerTripped,
    score: signals.evidenceScore,
    reasons,
    signals,
    eligibleReportIds: [...eligible],
    reportDecisions,
  };
}

export const evaluateCaseTrust = evaluateTrust;

import type { TrustPolicy, TrustReport, TrustSignals } from "./trust.types.js";

interface PreparedReport extends TrustReport {
  occurredTime: number;
  noteKey: string;
  noteTokenCount: number;
  evidenceQuality: number;
}

function prepareReport(report: TrustReport, policy: TrustPolicy): PreparedReport {
  const note = (report.note ?? "").normalize("NFKC").trim().toLowerCase();
  const tokens = note.match(/[\p{L}\p{N}]+/gu) ?? [];
  let evidenceQuality = 0.5;
  if (note.length >= policy.substantiveNoteCharacters && tokens.length >= policy.substantiveNoteTokens) {
    evidenceQuality += 0.25;
  } else if (note.length > 0) {
    evidenceQuality += 0.1;
  }
  if (report.hasScreenshot) evidenceQuality += policy.screenshotEvidenceBonus;
  if (report.reporterPreviouslyTrusted) evidenceQuality += policy.trustedReporterEvidenceBonus;

  const occurredTime = new Date(report.occurredAt).getTime();
  return {
    ...report,
    occurredTime,
    noteKey: note,
    noteTokenCount: tokens.length,
    evidenceQuality: Math.min(1, evidenceQuality),
  };
}

function countValues(values: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return counts;
}

function calculateBurstCount(times: number[], windowMs: number): number {
  let left = 0;
  let maximum = 0;
  for (let right = 0; right < times.length; right += 1) {
    while (times[right] - times[left] > windowMs) left += 1;
    maximum = Math.max(maximum, right - left + 1);
  }
  return maximum;
}

function calculateCopiedNoteRatio(reports: PreparedReport[]): number {
  const noted = reports.filter((report) => report.noteKey.length > 0);
  if (noted.length < 2) return 0;
  const counts = countValues(noted.map((report) => report.noteKey));
  const largestGroup = Math.max(...counts.values());
  return largestGroup / noted.length;
}

function calculateEvidenceScore(
  reports: PreparedReport[],
  signals: Pick<TrustSignals, "independentReporterCount" | "independentIpPrefixCount" | "coordinatedBurst" | "suspiciousIpConcentration">,
  policy: TrustPolicy,
): number {
  if (reports.length === 0) return 0;
  const representative = new Map<string, PreparedReport>();
  for (const report of reports) {
    const current = representative.get(report.reporterKey);
    if (!current || report.evidenceQuality > current.evidenceQuality) {
      representative.set(report.reporterKey, report);
    }
  }
  const averageEvidence = [...representative.values()]
    .reduce((sum, report) => sum + report.evidenceQuality, 0) / representative.size;
  const reporterDiversity = Math.min(1, signals.independentReporterCount / policy.minimumIndependentReporters);
  const ipDiversity = Math.min(1, signals.independentIpPrefixCount / policy.minimumIndependentIpPrefixes);
  let score = averageEvidence * 0.5 + reporterDiversity * 0.25 + ipDiversity * 0.25;
  if (signals.coordinatedBurst) score -= policy.coordinatedBurstPenalty;
  if (signals.suspiciousIpConcentration && signals.coordinatedBurst) {
    score -= policy.ipConcentrationPenalty;
  }
  return Math.max(0, Math.min(1, Number(score.toFixed(4))));
}

export function buildTrustSignals(
  reports: TrustReport[],
  policy: TrustPolicy,
): TrustSignals {
  const seenReportIds = new Set<string>();
  const duplicateReports: TrustReport[] = [];
  const invalidReports = reports.filter((report) => report.valid === false);
  const validReports: TrustReport[] = [];
  for (const report of reports) {
    if (report.valid === false) continue;
    if (report.duplicate || seenReportIds.has(report.reportId)) {
      duplicateReports.push(report);
      continue;
    }
    seenReportIds.add(report.reportId);
    validReports.push(report);
  }
  const prepared = validReports.map((report) => prepareReport(report, policy));
  const reporterCounts = countValues(prepared.map((report) => report.reporterKey));
  const ipCounts = countValues(prepared.map((report) => report.ipPrefixKey));
  const independentReporterCount = reporterCounts.size;
  const independentIpPrefixCount = ipCounts.size;
  const maxReportsFromOneReporter = Math.max(0, ...reporterCounts.values());
  const maxReportsFromOneIpPrefix = Math.max(0, ...ipCounts.values());
  const maxIpPrefixRatio = prepared.length === 0 ? 0 : maxReportsFromOneIpPrefix / prepared.length;
  const times = prepared.map((report) => report.occurredTime).sort((a, b) => a - b);
  const bucketSize = policy.timeBucketMinutes * 60 * 1000;
  const timeBuckets = new Set(times.map((time) => Math.floor(time / bucketSize)));
  const maxBurstCount = calculateBurstCount(times, policy.burstWindowMinutes * 60 * 1000);
  const copiedNoteRatio = calculateCopiedNoteRatio(prepared);
  const repeatedReporter = maxReportsFromOneReporter > 1;
  const suspiciousIpConcentration =
    maxReportsFromOneIpPrefix >= policy.concentratedIpReportCount &&
    maxIpPrefixRatio >= policy.concentratedIpRatio;
  const coordinatedBurst =
    maxBurstCount >= policy.coordinatedBurstReportCount &&
    (suspiciousIpConcentration || copiedNoteRatio >= policy.copiedNoteRatio);
  const partialSignals = {
    independentReporterCount,
    independentIpPrefixCount,
    coordinatedBurst,
    suspiciousIpConcentration,
  };

  return {
    validReportCount: prepared.length,
    duplicateReportCount: duplicateReports.length,
    invalidReportCount: invalidReports.length,
    independentReporterCount,
    independentIpPrefixCount,
    maxReportsFromOneReporter,
    maxReportsFromOneIpPrefix,
    maxIpPrefixRatio: Number(maxIpPrefixRatio.toFixed(4)),
    uniqueTimeBucketCount: timeBuckets.size,
    maxBurstCount,
    copiedNoteRatio: Number(copiedNoteRatio.toFixed(4)),
    averageEvidenceQuality: prepared.length === 0
      ? 0
      : Number((prepared.reduce((sum, report) => sum + report.evidenceQuality, 0) / prepared.length).toFixed(4)),
    evidenceScore: calculateEvidenceScore(prepared, partialSignals, policy),
    coordinatedBurst,
    suspiciousIpConcentration,
    repeatedReporter,
  };
}

export const analyzeTrustSignals = buildTrustSignals;

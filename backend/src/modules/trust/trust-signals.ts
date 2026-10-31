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

function uniqueValidReports(reports: TrustReport[]): TrustReport[] {
  const seen = new Set<string>();
  const valid: TrustReport[] = [];
  for (const report of reports) {
    if (report.valid === false || report.duplicate || seen.has(report.reportId)) continue;
    seen.add(report.reportId);
    valid.push(report);
  }
  return valid;
}

function isBetterEdgeReport(candidate: PreparedReport, current: PreparedReport): boolean {
  if (candidate.evidenceQuality !== current.evidenceQuality) {
    return candidate.evidenceQuality > current.evidenceQuality;
  }
  if (candidate.noteTokenCount !== current.noteTokenCount) {
    return candidate.noteTokenCount > current.noteTokenCount;
  }
  const candidateTime = candidate.occurredTime;
  const currentTime = current.occurredTime;
  if (candidateTime !== currentTime) return candidateTime < currentTime;
  return candidate.reportId.localeCompare(current.reportId) < 0;
}

/**
 * Selects independent reporter/network pairs using deterministic maximum
 * bipartite matching. A reporter and an IP prefix can each contribute at
 * most `maximumTrustedReportersPerIpPrefix` selected reports per case.
 */
function selectIndependentVoicesFromPrepared(
  reports: PreparedReport[],
  policy: TrustPolicy,
): PreparedReport[] {
  const edgeReports = new Map<string, Map<string, PreparedReport>>();
  for (const report of reports) {
    const byPrefix = edgeReports.get(report.reporterKey) ?? new Map<string, PreparedReport>();
    const current = byPrefix.get(report.ipPrefixKey);
    if (!current || isBetterEdgeReport(report, current)) byPrefix.set(report.ipPrefixKey, report);
    edgeReports.set(report.reporterKey, byPrefix);
  }

  const adjacency = new Map<string, Array<{ prefix: string; report: PreparedReport }>>();
  for (const [reporter, byPrefix] of edgeReports) {
    adjacency.set(reporter, [...byPrefix.entries()]
      .map(([prefix, report]) => ({ prefix, report }))
      .sort((left, right) => {
        if (left.report.evidenceQuality !== right.report.evidenceQuality) {
          return right.report.evidenceQuality - left.report.evidenceQuality;
        }
        return left.prefix.localeCompare(right.prefix);
      }));
  }

  const capacity = Math.max(1, Math.floor(policy.maximumTrustedReportersPerIpPrefix));
  const prefixOwner = new Map<string, string>();
  const reporterPrefix = new Map<string, string>();
  const reporters = [...adjacency.keys()].sort((left, right) => {
    const leftBest = adjacency.get(left)?.[0]?.report.evidenceQuality ?? 0;
    const rightBest = adjacency.get(right)?.[0]?.report.evidenceQuality ?? 0;
    return rightBest - leftBest || left.localeCompare(right);
  });

  const assign = (reporter: string, visitedSlots: Set<string>): boolean => {
    for (const edge of adjacency.get(reporter) ?? []) {
      for (let slot = 0; slot < capacity; slot += 1) {
        const slotKey = `${edge.prefix}\u0000${slot}`;
        if (visitedSlots.has(slotKey)) continue;
        visitedSlots.add(slotKey);
        const owner = prefixOwner.get(slotKey);
        if (!owner || assign(owner, visitedSlots)) {
          prefixOwner.set(slotKey, reporter);
          reporterPrefix.set(reporter, edge.prefix);
          return true;
        }
      }
    }
    return false;
  };

  for (const reporter of reporters) assign(reporter, new Set<string>());

  return [...reporterPrefix.entries()]
    .map(([reporter, prefix]) => edgeReports.get(reporter)?.get(prefix))
    .filter((report): report is PreparedReport => report !== undefined)
    .sort((left, right) => left.reportId.localeCompare(right.reportId));
}

export function selectIndependentVoiceReports(
  reports: TrustReport[],
  policy: TrustPolicy,
): TrustReport[] {
  return selectIndependentVoicesFromPrepared(
    uniqueValidReports(reports).map((report) => prepareReport(report, policy)),
    policy,
  );
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
  signals: Pick<TrustSignals, "independentVoiceCount" | "independentIpPrefixCount" | "coordinatedBurst" | "suspiciousIpConcentration">,
  policy: TrustPolicy,
): number {
  if (reports.length === 0) return 0;
  const averageEvidence = reports.reduce((sum, report) => sum + report.evidenceQuality, 0) / reports.length;
  const reporterDiversity = Math.min(1, signals.independentVoiceCount / policy.minimumIndependentReporters);
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
  const duplicateReports: TrustReport[] = [];
  const invalidReports = reports.filter((report) => report.valid === false);
  const validReports: TrustReport[] = [];
  const seenReportIds = new Set<string>();
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
  const independentVoices = selectIndependentVoicesFromPrepared(prepared, policy);
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
  const circuitBreakerWindowMs = (policy.circuitBreakerWindowMinutes ?? 15) * 60 * 1000;
  const circuitBreakerSurgeCount = calculateBurstCount(times, circuitBreakerWindowMs);
  const circuitBreakerThreshold = policy.circuitBreakerThreshold ?? 8;
  const circuitBreakerTripped = circuitBreakerSurgeCount >= circuitBreakerThreshold;

  const coordinatedBurst =
    maxBurstCount >= policy.coordinatedBurstReportCount &&
    (suspiciousIpConcentration || copiedNoteRatio >= policy.copiedNoteRatio);
  const partialSignals = {
    independentReporterCount,
    independentIpPrefixCount,
    independentVoiceCount: independentVoices.length,
    coordinatedBurst,
    suspiciousIpConcentration,
  };

  return {
    validReportCount: prepared.length,
    duplicateReportCount: duplicateReports.length,
    invalidReportCount: invalidReports.length,
    independentReporterCount,
    independentIpPrefixCount,
    independentVoiceCount: independentVoices.length,
    maxReportsFromOneReporter,
    maxReportsFromOneIpPrefix,
    maxIpPrefixRatio: Number(maxIpPrefixRatio.toFixed(4)),
    uniqueTimeBucketCount: timeBuckets.size,
    maxBurstCount,
    copiedNoteRatio: Number(copiedNoteRatio.toFixed(4)),
    averageEvidenceQuality: independentVoices.length === 0
      ? 0
      : Number((independentVoices.reduce((sum, report) => sum + report.evidenceQuality, 0) / independentVoices.length).toFixed(4)),
    evidenceScore: calculateEvidenceScore(independentVoices, partialSignals, policy),
    coordinatedBurst,
    suspiciousIpConcentration,
    repeatedReporter,
    circuitBreakerTripped,
    circuitBreakerSurgeCount,
  };
}

export const analyzeTrustSignals = buildTrustSignals;

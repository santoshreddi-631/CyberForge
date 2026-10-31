export interface SpikeInput {
  currentCount: number;
  historicalCount: number;
}

export interface AlertPolicy {
  minimumSpikeCount: number;
  spikeMultiplier: number;
  currentWindowHours: number;
  spikeBaselineDays: number;
  newTypeHistoryDays: number;
}

export const DEFAULT_ALERT_POLICY: Readonly<AlertPolicy> = Object.freeze({
  minimumSpikeCount: 5,
  spikeMultiplier: 2,
  currentWindowHours: 24,
  spikeBaselineDays: 7,
  newTypeHistoryDays: 30,
});

export function dailyAverage(historicalCount: number, days: number): number {
  if (!Number.isFinite(historicalCount) || historicalCount < 0 || !Number.isInteger(days) || days < 1) {
    throw new Error("Historical count and days must be non-negative and days must be positive");
  }
  return historicalCount / days;
}

export function qualifiesForSpike(input: SpikeInput, policy: AlertPolicy = DEFAULT_ALERT_POLICY): boolean {
  if (!Number.isInteger(input.currentCount) || input.currentCount < 0) {
    throw new Error("Current count must be a non-negative integer");
  }
  const baseline = dailyAverage(input.historicalCount, policy.spikeBaselineDays);
  return input.currentCount >= policy.minimumSpikeCount &&
    (baseline === 0 || input.currentCount >= policy.spikeMultiplier * baseline);
}

export function findNewTypes(currentTypes: string[], historicalTypes: string[]): string[] {
  const historical = new Set(historicalTypes);
  return [...new Set(currentTypes)]
    .filter((type) => !historical.has(type))
    .sort((left, right) => left.localeCompare(right));
}

export interface AlertWindows {
  currentStart: Date;
  currentEnd: Date;
  baselineStart: Date;
  historyStart: Date;
}

export function calculateAlertWindows(now: Date, policy: AlertPolicy = DEFAULT_ALERT_POLICY): AlertWindows {
  const currentEnd = new Date(now.getTime());
  const currentStart = new Date(currentEnd.getTime() - policy.currentWindowHours * 60 * 60 * 1000);
  return {
    currentStart,
    currentEnd,
    baselineStart: new Date(currentStart.getTime() - policy.spikeBaselineDays * 24 * 60 * 60 * 1000),
    historyStart: new Date(currentStart.getTime() - policy.newTypeHistoryDays * 24 * 60 * 60 * 1000),
  };
}

export type MapSeverity = "CRIT" | "HIGH" | "MED";

export function classifyMapSeverity(count: number): MapSeverity {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error("Map severity requires a positive integer count");
  }
  if (count >= 10) return "CRIT";
  if (count >= 5) return "HIGH";
  return "MED";
}

export const classifySeverity = classifyMapSeverity;

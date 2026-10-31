import { sql } from "drizzle-orm";
import { createClient, getDb } from "../../db/client.js";
import {
  calculateAlertWindows,
  DEFAULT_ALERT_POLICY,
  findNewTypes,
  qualifiesForSpike,
  type AlertPolicy,
} from "./alert-rules.js";

type DatabaseClient = ReturnType<typeof createClient>;

export interface SpikeAlert {
  type: "SPIKE";
  pincode: string;
  window: "24h";
  count: number;
  baseline_per_day: number;
}

export interface NewTypeAlert {
  type: "NEW_TYPE";
  pincode: string;
  scam_type: string;
  window: "24h";
}

export type Alert = SpikeAlert | NewTypeAlert;

interface CountRow {
  current_count: number;
  historical_count: number;
}

export class AlertValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AlertValidationError";
  }
}

async function ensureArea(client: DatabaseClient, pincode: string): Promise<void> {
  const [area] = await client.db.execute(sql`
    SELECT pincode FROM areas WHERE pincode = ${pincode} LIMIT 1
  `);
  if (!area) throw new AlertValidationError("pincode is not a supported Indian postal area");
}

async function readCounts(
  client: DatabaseClient,
  pincode: string,
  windows: ReturnType<typeof calculateAlertWindows>,
): Promise<CountRow> {
  const [row] = await client.db.execute(sql`
    SELECT
      count(*) FILTER (
        WHERE r.occurred_at >= ${windows.currentStart.toISOString()}::timestamptz
          AND r.occurred_at < ${windows.currentEnd.toISOString()}::timestamptz
      )::int AS current_count,
      count(*) FILTER (
        WHERE r.occurred_at >= ${windows.baselineStart.toISOString()}::timestamptz
          AND r.occurred_at < ${windows.currentStart.toISOString()}::timestamptz
      )::int AS historical_count
    FROM reports r
    JOIN trust_decisions td
      ON td.report_id = r.id
     AND td.status = 'eligible'
    WHERE r.pincode = ${pincode}
      AND r.occurred_at >= ${windows.baselineStart.toISOString()}::timestamptz
      AND r.occurred_at < ${windows.currentEnd.toISOString()}::timestamptz
  `);
  return row as unknown as CountRow;
}

async function readTypes(
  client: DatabaseClient,
  pincode: string,
  windows: ReturnType<typeof calculateAlertWindows>,
): Promise<{ current: string[]; historical: string[] }> {
  const rows = await client.db.execute(sql`
    SELECT
      r.scam_type,
      bool_or(
        r.occurred_at >= ${windows.currentStart.toISOString()}::timestamptz
        AND r.occurred_at < ${windows.currentEnd.toISOString()}::timestamptz
      ) AS in_current,
      bool_or(
        r.occurred_at >= ${windows.historyStart.toISOString()}::timestamptz
        AND r.occurred_at < ${windows.currentStart.toISOString()}::timestamptz
      ) AS in_history
    FROM reports r
    JOIN trust_decisions td
      ON td.report_id = r.id
     AND td.status = 'eligible'
    WHERE r.pincode = ${pincode}
      AND r.occurred_at >= ${windows.historyStart.toISOString()}::timestamptz
      AND r.occurred_at < ${windows.currentEnd.toISOString()}::timestamptz
    GROUP BY r.scam_type
  `);
  const typedRows = rows as unknown as Array<{ scam_type: string; in_current: boolean; in_history: boolean }>;
  return {
    current: typedRows.filter((row) => row.in_current).map((row) => row.scam_type),
    historical: typedRows.filter((row) => row.in_history).map((row) => row.scam_type),
  };
}

export async function getAlerts(
  pincode: string,
  now: Date = new Date(),
  policy: AlertPolicy = DEFAULT_ALERT_POLICY,
): Promise<{ alerts: Alert[] }> {
  const client = getDb();
  await ensureArea(client, pincode);
  const windows = calculateAlertWindows(now, policy);
  const [counts, types] = await Promise.all([
    readCounts(client, pincode, windows),
    readTypes(client, pincode, windows),
  ]);
  const alerts: Alert[] = [];
  const baselinePerDay = Number((counts.historical_count / policy.spikeBaselineDays).toFixed(2));
  if (qualifiesForSpike({
    currentCount: Number(counts.current_count),
    historicalCount: Number(counts.historical_count),
  }, policy)) {
    alerts.push({
      type: "SPIKE",
      pincode,
      window: "24h",
      count: Number(counts.current_count),
      baseline_per_day: baselinePerDay,
    });
  }
  for (const scamType of findNewTypes(types.current, types.historical)) {
    alerts.push({ type: "NEW_TYPE", pincode, scam_type: scamType, window: "24h" });
  }
  return { alerts };
}

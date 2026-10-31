import { sql } from "drizzle-orm";
import { createClient, getDb } from "../../db/client.js";
import { haversineDistanceKm, type GeoPoint } from "./distance.js";
import { classifyMapSeverity, type MapSeverity } from "./severity.js";

type DatabaseClient = ReturnType<typeof createClient>;

interface AreaRow extends GeoPoint {
  pincode: string;
  locality: string;
  city: string;
}

interface AggregateRow {
  pincode: string;
  scam_type: string;
  count: number;
}

export class MapValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MapValidationError";
  }
}

export interface MapCluster {
  pincode: string;
  locality: string;
  city: string;
  count: number;
  top_scam_type: string;
  severity: MapSeverity;
  lat: number;
  lng: number;
}

export interface MapQuery {
  pincode: string;
  days: number;
  radiusKm: number;
}

async function readAreas(client: DatabaseClient): Promise<AreaRow[]> {
  const rows = await client.db.execute(sql`
    SELECT pincode, locality, city, lat::float8 AS lat, lng::float8 AS lng
    FROM areas
    ORDER BY pincode
  `);
  return rows as unknown as AreaRow[];
}

function selectNearbyAreas(areas: AreaRow[], center: AreaRow, radiusKm: number): AreaRow[] {
  const centerPoint: GeoPoint = { lat: center.lat, lng: center.lng };
  return areas.filter((area) =>
    haversineDistanceKm(centerPoint, { lat: area.lat, lng: area.lng }) <= radiusKm
  );
}

async function readEligibleAggregates(
  client: DatabaseClient,
  pincodes: string[],
  cutoff: Date,
  end: Date,
): Promise<AggregateRow[]> {
  if (pincodes.length === 0) return [];
  const rows = await client.db.execute(sql`
    SELECT r.pincode, r.scam_type, count(*)::int AS count
    FROM reports r
    JOIN trust_decisions td
      ON td.report_id = r.id
     AND td.status = 'eligible'
    WHERE r.pincode IN (${sql.join(pincodes.map((pincode) => sql`${pincode}`), sql`, `)})
      AND r.occurred_at >= ${cutoff.toISOString()}::timestamptz
      AND r.occurred_at < ${end.toISOString()}::timestamptz
    GROUP BY r.pincode, r.scam_type
    ORDER BY r.pincode, count DESC, r.scam_type ASC
  `);
  return rows as unknown as AggregateRow[];
}

export async function getMapClusters(query: MapQuery): Promise<{ clusters: MapCluster[] }> {
  const client = getDb();
  const areas = await readAreas(client);
  const center = areas.find((area) => area.pincode === query.pincode);
  if (!center) throw new MapValidationError("pincode is not a supported Indian postal area");

  const nearbyAreas = selectNearbyAreas(areas, center, query.radiusKm);
  const end = new Date();
  const cutoff = new Date(end.getTime() - query.days * 24 * 60 * 60 * 1000);
  const aggregates = await readEligibleAggregates(
    client,
    nearbyAreas.map((area) => area.pincode),
    cutoff,
    end,
  );
  const aggregatesByArea = new Map<string, AggregateRow[]>();
  for (const aggregate of aggregates) {
    const areaAggregates = aggregatesByArea.get(aggregate.pincode) ?? [];
    areaAggregates.push(aggregate);
    aggregatesByArea.set(aggregate.pincode, areaAggregates);
  }

  return {
    clusters: nearbyAreas.flatMap((area) => {
      const areaAggregates = aggregatesByArea.get(area.pincode);
      if (!areaAggregates || areaAggregates.length === 0) return [];
      const count = areaAggregates.reduce((sum, item) => sum + Number(item.count), 0);
      const topScamType = areaAggregates[0].scam_type;
      return [{
        pincode: area.pincode,
        locality: area.locality,
        city: area.city,
        count,
        top_scam_type: topScamType,
        severity: classifyMapSeverity(count),
        lat: area.lat,
        lng: area.lng,
      }];
    }),
  };
}

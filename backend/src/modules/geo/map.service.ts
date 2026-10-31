import { sql } from "drizzle-orm";
import { createClient, getDb } from "../../db/client.js";
import { haversineDistanceKm, type GeoPoint } from "./distance.js";
import { classifyMapSeverity, type MapSeverity } from "./severity.js";

type DatabaseClient = ReturnType<typeof createClient>;

export interface AreaRow extends GeoPoint {
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

export interface GeoJsonMapFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  properties: {
    pincode: string;
    area: string;
    locality: string;
    city: string;
    report_count: number;
    dominant_category: string;
    top_scam_type: string;
    risk_level: MapSeverity;
    severity: MapSeverity;
  };
}

export interface MapQueryResult {
  success: boolean;
  type: "FeatureCollection";
  generated_at: string;
  period_days: number;
  total_reports: number;
  clusters: MapCluster[];
  features: GeoJsonMapFeature[];
}

export interface MapQuery {
  pincode?: string;
  days: number;
  radiusKm?: number;
  category?: string;
  severity?: MapSeverity;
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

async function readAggregates(
  client: DatabaseClient,
  pincodes: string[],
  cutoff: Date,
  end: Date,
  category?: string,
): Promise<AggregateRow[]> {
  if (pincodes.length === 0) return [];

  let categoryFilter = sql``;
  if (category && category.toUpperCase() !== "ALL") {
    const rawCategory = category.trim();
    const kebab = rawCategory.replace(/_/g, "-");
    const snake = rawCategory.replace(/-/g, "_");
    categoryFilter = sql` AND (r.scam_type = ${rawCategory} OR r.scam_type = ${kebab} OR r.scam_type = ${snake})`;
  }

  const rows = await client.db.execute(sql`
    SELECT r.pincode, r.scam_type, count(*)::int AS count
    FROM reports r
    JOIN trust_decisions td
      ON td.report_id = r.id
     AND td.status = 'eligible'
    WHERE r.pincode IN (${sql.join(pincodes.map((pincode) => sql`${pincode}`), sql`, `)})
      AND r.occurred_at >= ${cutoff.toISOString()}::timestamptz
      AND r.occurred_at <= ${end.toISOString()}::timestamptz
      ${categoryFilter}
    GROUP BY r.pincode, r.scam_type
    ORDER BY r.pincode, count DESC, r.scam_type ASC
  `);
  return rows as unknown as AggregateRow[];
}

export async function getMapData(query: MapQuery): Promise<MapQueryResult> {
  const client = getDb();
  const allAreas = await readAreas(client);

  let targetAreas: AreaRow[] = allAreas;
  if (query.pincode) {
    const center = allAreas.find((area) => area.pincode === query.pincode);
    if (!center) throw new MapValidationError("pincode is not a supported Indian postal area");
    targetAreas = selectNearbyAreas(allAreas, center, query.radiusKm ?? 2);
  }

  const end = new Date();
  const cutoff = new Date(end.getTime() - query.days * 24 * 60 * 60 * 1000);
  const aggregates = await readAggregates(
    client,
    targetAreas.map((area) => area.pincode),
    cutoff,
    end,
    query.category,
  );

  const aggregatesByArea = new Map<string, AggregateRow[]>();
  for (const aggregate of aggregates) {
    const areaAggregates = aggregatesByArea.get(aggregate.pincode) ?? [];
    areaAggregates.push(aggregate);
    aggregatesByArea.set(aggregate.pincode, areaAggregates);
  }

  let totalReports = 0;
  const clusters: MapCluster[] = [];
  const features: GeoJsonMapFeature[] = [];

  for (const area of targetAreas) {
    const areaAggregates = aggregatesByArea.get(area.pincode);
    if (!areaAggregates || areaAggregates.length === 0) continue;

    const count = areaAggregates.reduce((sum, item) => sum + Number(item.count), 0);
    if (count <= 0) continue;

    const topScamType = areaAggregates[0].scam_type;
    const severity = classifyMapSeverity(count);

    if (query.severity && severity !== query.severity) {
      continue;
    }

    totalReports += count;

    clusters.push({
      pincode: area.pincode,
      locality: area.locality,
      city: area.city,
      count,
      top_scam_type: topScamType,
      severity,
      lat: area.lat,
      lng: area.lng,
    });

    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [area.lng, area.lat],
      },
      properties: {
        pincode: area.pincode,
        area: area.locality,
        locality: area.locality,
        city: area.city,
        report_count: count,
        dominant_category: topScamType,
        top_scam_type: topScamType,
        risk_level: severity,
        severity,
      },
    });
  }

  return {
    success: true,
    type: "FeatureCollection",
    generated_at: end.toISOString(),
    period_days: query.days,
    total_reports: totalReports,
    clusters,
    features,
  };
}

export const getMapClusters = getMapData;

import type { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../../middleware/error.middleware.js";
import { getMapData, MapValidationError } from "./map.service.js";

const mapQuerySchema = z.object({
  pincode: z.string().regex(/^\d{6}$/u, "pincode must be a six-digit Indian postal code").optional(),
  days: z.coerce.number().int().min(1).max(30).default(7),
  radius_km: z.coerce.number().finite().min(0).max(100).default(2),
  category: z.string().optional(),
  severity: z.enum(["CRIT", "HIGH", "MED"]).optional(),
  format: z.enum(["legacy", "geojson"]).optional(),
});

export async function mapController(req: Request, res: Response): Promise<void> {
  const parsed = mapQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new AppError(400, "Invalid map query");
  try {
    const data = await getMapData({
      pincode: parsed.data.pincode,
      days: parsed.data.days,
      radiusKm: parsed.data.radius_km,
      category: parsed.data.category,
      severity: parsed.data.severity,
    });

    // If pincode is provided AND format is not explicitly geojson AND route is not /api/v1:
    // Return legacy { clusters: [...] } so existing Phase 17 / contract tests pass exactly.
    // If format=geojson OR route is /api/v1/map OR pincode is omitted:
    // Return full GeoJSON FeatureCollection response.
    const isApiV1 = req.baseUrl.includes("/api/v1") || req.originalUrl?.includes("/api/v1");
    const wantsGeoJson = parsed.data.format === "geojson" || isApiV1 || !parsed.data.pincode;

    if (!wantsGeoJson) {
      res.status(200).json({ clusters: data.clusters });
      return;
    }

    res.status(200).json(data);
  } catch (error) {
    if (error instanceof MapValidationError) {
      throw new AppError(400, error.message);
    }
    throw error;
  }
}

import type { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../../middleware/error.middleware.js";
import { getMapClusters, MapValidationError } from "./map.service.js";

const mapQuerySchema = z.object({
  pincode: z.string().regex(/^\d{6}$/u, "pincode must be a six-digit Indian postal code"),
  days: z.coerce.number().int().min(1).max(30).default(7),
  radius_km: z.coerce.number().finite().min(0).max(100).default(2),
});

export async function mapController(req: Request, res: Response): Promise<void> {
  const parsed = mapQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new AppError(400, "Invalid map query");
  try {
    res.status(200).json(await getMapClusters({
      pincode: parsed.data.pincode,
      days: parsed.data.days,
      radiusKm: parsed.data.radius_km,
    }));
  } catch (error) {
    if (error instanceof MapValidationError) {
      throw new AppError(400, error.message);
    }
    throw error;
  }
}

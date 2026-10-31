import type { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../../middleware/error.middleware.js";
import { AlertValidationError, getAlerts } from "./alerts.service.js";

const alertsQuerySchema = z.object({
  pincode: z.string().regex(/^\d{6}$/u, "pincode must be a six-digit Indian postal code"),
});

export async function alertsController(req: Request, res: Response): Promise<void> {
  const parsed = alertsQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new AppError(400, "Invalid alerts query");
  try {
    res.status(200).json(await getAlerts(parsed.data.pincode));
  } catch (error) {
    if (error instanceof AlertValidationError) {
      throw new AppError(400, error.message);
    }
    throw error;
  }
}

import { Router } from "express";
import { z } from "zod";
import { asyncHandler, AppError } from "../../middleware/error.middleware.js";
import { activateLicense, getLicenseStatus, LicenseValidationError } from "./license.service.js";

const licenseSchema = z.object({
  licensee: z.string().trim().min(1).max(200),
  expires_at: z.string().datetime({ offset: true }),
  signature: z.string().trim().min(1).max(256),
});

export const licenseRouter = Router();

licenseRouter.get("/", asyncHandler(async (_req, res) => {
  res.status(200).json(await getLicenseStatus());
}));

licenseRouter.post("/", asyncHandler(async (req, res) => {
  const parsed = licenseSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, "Invalid licence document");
  try {
    res.status(200).json(await activateLicense(parsed.data));
  } catch (error) {
    if (error instanceof LicenseValidationError) {
      throw new AppError(400, error.message);
    }
    throw error;
  }
}));

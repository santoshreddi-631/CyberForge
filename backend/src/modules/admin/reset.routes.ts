import { Router } from "express";
import { AppError, asyncHandler } from "../../middleware/error.middleware.js";
import { ResetUnavailableError, resetDerivedState } from "./reset.service.js";

export const resetRouter = Router();
resetRouter.post("/", asyncHandler(async (_req, res) => {
  try {
    res.status(200).json({ deleted: await resetDerivedState() });
  } catch (error) {
    if (error instanceof ResetUnavailableError) {
      throw new AppError(503, error.message);
    }
    throw error;
  }
}));

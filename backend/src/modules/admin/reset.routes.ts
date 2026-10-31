import { Router } from "express";
import { asyncHandler } from "../../middleware/error.middleware.js";
import { resetDerivedState } from "./reset.service.js";

export const resetRouter = Router();
resetRouter.post("/", asyncHandler(async (_req, res) => {
  res.status(200).json({ deleted: await resetDerivedState() });
}));

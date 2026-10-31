import { Router } from "express";
import { asyncHandler } from "../../middleware/error.middleware.js";
import { createReportController } from "./reports.controller.js";

export const reportsRouter = Router();
reportsRouter.post("/", asyncHandler(createReportController));

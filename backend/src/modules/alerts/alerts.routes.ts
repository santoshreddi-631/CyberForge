import { Router } from "express";
import { asyncHandler } from "../../middleware/error.middleware.js";
import { alertsController } from "./alerts.controller.js";

export const alertsRouter = Router();
alertsRouter.get("/", asyncHandler(alertsController));

import { Router } from "express";
import { asyncHandler } from "../../middleware/error.middleware.js";
import { mapController } from "./map.controller.js";

export const mapRouter = Router();
mapRouter.get("/", asyncHandler(mapController));

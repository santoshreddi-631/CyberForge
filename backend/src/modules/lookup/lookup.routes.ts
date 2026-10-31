import { Router } from "express";
import { asyncHandler } from "../../middleware/error.middleware.js";
import { lookupController } from "./lookup.controller.js";

export const lookupRouter = Router();
lookupRouter.get("/", asyncHandler(lookupController));

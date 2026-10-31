import { Router } from "express";
import { asyncHandler } from "../../middleware/error.middleware.js";
import { createChallengeController } from "./challenges.controller.js";

export const challengesRouter = Router();
challengesRouter.post("/", asyncHandler(createChallengeController));

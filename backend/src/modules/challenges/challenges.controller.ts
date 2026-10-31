import type { Request, Response } from "express";
import { AppError } from "../../middleware/error.middleware.js";
import { challengeRequestSchema } from "./challenges.schema.js";
import { ChallengeValidationError, submitChallenge } from "./challenges.service.js";
import { getDb } from "../../db/client.js";

export async function createChallengeController(req: Request, res: Response): Promise<void> {
  try {
    const input = challengeRequestSchema.parse(req.body);
    const result = await submitChallenge(getDb(), input);
    res.status(201).json({
      challenge_id: result.challengeId,
      status: result.status,
    });
  } catch (error) {
    if (error instanceof ChallengeValidationError) {
      throw new AppError(400, error.message, true);
    }
    throw error;
  }
}

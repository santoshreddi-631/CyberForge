import type { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../../middleware/error.middleware.js";
import { canonicalizeIdentifier } from "../identifiers/validate.js";
import { lookupIdentifier } from "./lookup.service.js";

const lookupQuerySchema = z.object({
  type: z.enum(["phone", "upi", "url", "sender_id"]),
  value: z.string().min(1),
});

export async function lookupController(req: Request, res: Response): Promise<void> {
  const parsed = lookupQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new AppError(400, "Invalid lookup query");
  }
  let canonicalValue: string;
  try {
    canonicalValue = canonicalizeIdentifier(parsed.data.type, parsed.data.value);
  } catch (error) {
    throw new AppError(400, error instanceof Error ? error.message : "Invalid identifier");
  }
  res.status(200).json(await lookupIdentifier(parsed.data.type, canonicalValue));
}

import type { Request, Response } from "express";
import { Router } from "express";

const router = Router();

/**
 * GET /health
 *
 * PRD Appendix A §1: "Reply 200 with {"ok": true}."
 *
 * This endpoint:
 * - Is always reachable, even when the licence is expired (PRD §Ship it).
 * - Does NOT perform a database ping to keep latency minimal and avoid
 *   false negatives when the DB is briefly unreachable.
 *
 * Design decision: A separate /health/db endpoint can be added later for
 * deep health checks without coupling the simple liveness check to DB state.
 */
router.get("/", (_req: Request, res: Response): void => {
  res.status(200).json({ ok: true });
});

export { router as healthRouter };


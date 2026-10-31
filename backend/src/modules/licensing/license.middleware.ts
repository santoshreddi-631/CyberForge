import type { Request, Response, NextFunction } from "express";
import { enforceLicense } from "./license.service.js";

export async function licenseMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (req.path === "/health" || req.path === "/license") {
    next();
    return;
  }
  if (process.env.NODE_ENV === "test" && !process.env.LICENSE_ENFORCEMENT_TEST) {
    next();
    return;
  }
  if (!(await enforceLicense(req.path))) {
    res.status(403).json({ error: "LICENSE_EXPIRED" });
    return;
  }
  next();
}

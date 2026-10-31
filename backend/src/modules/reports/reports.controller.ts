import type { Request, Response } from "express";
import { AppError } from "../../middleware/error.middleware.js";
import {
  ReportRateLimitError,
  ReportValidationError,
} from "./reports.repository.js";
import { ingestReport } from "./reports.service.js";
import { reportRequestSchema } from "./reports.schema.js";

export async function createReportController(req: Request, res: Response): Promise<void> {
  try {
    const input = reportRequestSchema.parse(req.body);
    const result = await ingestReport(input);
    res.status(201).json({
      report_id: result.reportId,
      case_id: result.caseId,
      merged: result.merged,
    });
  } catch (error) {
    if (error instanceof ReportValidationError) {
      throw new AppError(400, error.message, true);
    }
    if (error instanceof ReportRateLimitError) {
      throw new AppError(429, error.message, true);
    }
    throw error;
  }
}

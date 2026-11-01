import { z } from "zod";
import { identifierTypeSchema } from "../identifiers/identifier.types.js";

const nonEmptyText = (label: string, max: number) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} is too long`);

export const reportRequestSchema = z.object({
  report_id: nonEmptyText("report_id", 128),
  occurred_at: z.string().datetime({ offset: true }),
  reported_at: z.string().datetime({ offset: true }),
  reporter_id: nonEmptyText("reporter_id", 256),
  ip_prefix: nonEmptyText("ip_prefix", 64),
  channel: z.enum(["Phone call", "SMS or WhatsApp", "QR code", "Fake website", "UPI request", "Something else"]),
  scam_type: nonEmptyText("scam_type", 100),
  identifier_type: identifierTypeSchema,
  identifier_value: nonEmptyText("identifier_value", 2048),
  pincode: z.string().regex(/^\d{6}$/u, "pincode must be a six-digit Indian postal code"),
  locality: nonEmptyText("locality", 200),
  city: nonEmptyText("city", 100),
  lat: z.coerce.number().finite().min(-90).max(90).optional(),
  lng: z.coerce.number().finite().min(-180).max(180).optional(),
  note: z.string().max(5000, "note is too long").nullable().optional(),
  has_screenshot: z.boolean().default(false),
  amount_lost_inr: z.number().finite().min(0).max(99_999_999_999_999).default(0),
}).superRefine((value, context) => {
  if (new Date(value.reported_at).getTime() < new Date(value.occurred_at).getTime()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["reported_at"],
      message: "reported_at must not be earlier than occurred_at",
    });
  }
});

export type ReportRequest = z.infer<typeof reportRequestSchema>;

export function sanitizeNote(note: string | null | undefined): string {
  if (!note) return "";
  return note
    .normalize("NFKC")
    .split("")
    .filter((character) => {
      const codePoint = character.codePointAt(0) ?? 0;
      return codePoint >= 0x20 && codePoint !== 0x7f;
    })
    .join("")
    .replace(/\s+/gu, " ")
    .trim();
}

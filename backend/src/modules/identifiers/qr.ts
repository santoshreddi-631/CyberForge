import { normalizeUpiId } from "./normalize.js";

const MAX_QR_PAYLOAD_LENGTH = 2048;

export interface ParsedQrIdentifier {
  type: "upi";
  value: string;
}

/**
 * Extracts only the canonical UPI payee from a supported UPI QR URI.
 * Merchant names, notes, amounts, and other payload fields are discarded.
 */
export function parseUpiQrPayload(payload: string): ParsedQrIdentifier {
  if (typeof payload !== "string") {
    throw new Error("QR payload must be a string");
  }

  const input = payload.normalize("NFKC").trim();
  const hasControlCharacter = [...input].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 0x1f || codePoint === 0x7f;
  });
  if (
    !input ||
    input.length > MAX_QR_PAYLOAD_LENGTH ||
    hasControlCharacter
  ) {
    throw new Error("QR payload is malformed");
  }

  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    throw new Error("QR payload must be a supported UPI URI");
  }

  if (
    parsed.protocol !== "upi:" ||
    parsed.hostname.toLowerCase() !== "pay" ||
    parsed.username ||
    parsed.password ||
    parsed.hash ||
    parsed.pathname !== ""
  ) {
    throw new Error("QR payload must be a supported UPI pay URI");
  }

  const payees = parsed.searchParams.getAll("pa");
  if (payees.length !== 1 || !payees[0]) {
    throw new Error("QR payload must contain exactly one UPI payee");
  }

  try {
    return { type: "upi", value: normalizeUpiId(payees[0]) };
  } catch {
    throw new Error("QR payload contains an invalid UPI payee");
  }
}

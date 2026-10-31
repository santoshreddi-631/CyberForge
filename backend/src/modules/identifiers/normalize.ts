import type { IdentifierType } from "./identifier.types.js";

const INDIA_COUNTRY_CODE = "91";
const OFFICIAL_SHORT_CODES = new Set(["1091", "1098", "112", "181", "1909", "1930"]);

function cleanPhoneInput(value: string): string {
  const cleaned = value.normalize("NFKC").trim();
  if (!cleaned || /[^\d+().\-\s]/u.test(cleaned) || (cleaned.includes("+") && !cleaned.startsWith("+"))) {
    throw new Error("Phone number contains unsupported characters");
  }

  const digits = cleaned.replace(/[().\-\s]/gu, "");
  if (digits.startsWith("+")) {
    if (!digits.startsWith(`+${INDIA_COUNTRY_CODE}`)) {
      throw new Error("Only Indian phone numbers are supported");
    }
    return digits.slice(3);
  }
  return digits;
}

export function normalizePhoneNumber(value: string): string {
  if (typeof value !== "string") {
    throw new Error("Phone number must be a string");
  }

  const digits = cleanPhoneInput(value);
  if (OFFICIAL_SHORT_CODES.has(digits)) {
    return digits;
  }

  const nationalDigits = digits.startsWith("00") && digits.slice(2, 4) === INDIA_COUNTRY_CODE
    ? digits.slice(4)
    : digits.startsWith(INDIA_COUNTRY_CODE) && digits.length === 12
      ? digits.slice(2)
      : digits.startsWith("0")
        ? digits.slice(1)
        : digits;

  if (/^(?:1800|1860)\d{4,7}$/u.test(nationalDigits)) {
    return nationalDigits;
  }

  if (!/^\d{10}$/u.test(nationalDigits)) {
    throw new Error("Phone number must be an Indian mobile, landline, or supported service number");
  }

  if (nationalDigits.startsWith("0") || nationalDigits.startsWith("1")) {
    throw new Error("Phone number has an invalid Indian numbering prefix");
  }

  return `+${INDIA_COUNTRY_CODE}${nationalDigits}`;
}

export const normalizePhone = normalizePhoneNumber;

export function normalizeUpiId(value: string): string {
  if (typeof value !== "string") {
    throw new Error("UPI ID must be a string");
  }

  const normalized = value.normalize("NFKC").replace(/\s/gu, "").toLowerCase();
  if (!/^[a-z0-9][a-z0-9._-]{1,49}@[a-z][a-z0-9.-]{1,49}$/u.test(normalized)) {
    throw new Error("UPI ID must contain one valid account and provider separated by @");
  }
  return normalized;
}

export const normalizeUpi = normalizeUpiId;

export function normalizeUrl(value: string): string {
  if (typeof value !== "string") {
    throw new Error("URL must be a string");
  }

  const input = value.normalize("NFKC").trim();
  if (!input || /\s/u.test(input)) {
    throw new Error("URL must not contain whitespace");
  }

  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    throw new Error("URL is malformed");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("URL must use http or https");
  }
  if (parsed.username || parsed.password || !parsed.hostname) {
    throw new Error("URL must not contain credentials and must have a hostname");
  }

  parsed.protocol = "https:";
  parsed.hostname = parsed.hostname.replace(/^www\./u, "");
  parsed.search = "";
  parsed.hash = "";
  parsed.pathname = parsed.pathname.replace(/\/+$/u, "");

  return parsed.toString().replace(/\/$/u, "");
}

export const normalizeLink = normalizeUrl;

export function normalizeSmsSenderId(value: string): string {
  if (typeof value !== "string") {
    throw new Error("SMS sender ID must be a string");
  }

  const normalized = value.normalize("NFKC").trim().toUpperCase();
  const match = /^(?:[A-Z]{2}-)?([A-Z]{6})$/u.exec(normalized);
  if (!match) {
    throw new Error("SMS sender ID must be a six-letter code, optionally prefixed by VM- or AD-");
  }
  return match[1];
}

export const normalizeSenderId = normalizeSmsSenderId;

export function normalizeIdentifier(type: IdentifierType, value: string): string {
  switch (type) {
    case "phone":
      return normalizePhoneNumber(value);
    case "upi":
      return normalizeUpiId(value);
    case "url":
      return normalizeUrl(value);
    case "sender_id":
      return normalizeSmsSenderId(value);
  }
}

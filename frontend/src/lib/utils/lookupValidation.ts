/**
 * Validation utilities for  Lookup identifiers
 * Strictly adhering to PRD specifications.
 */

import { LookupIdentifierType } from "@/types";

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
  normalizedHint?: string;
}

export function validateIdentifier(
  type: LookupIdentifierType,
  rawValue: string
): ValidationResult {
  const value = rawValue.trim();

  if (!value) {
    const labels: Record<LookupIdentifierType, string> = {
      phone: "phone number",
      upi: "UPI ID",
      url: "URL or website link",
      sender_id: "SMS sender ID",
    };
    return {
      isValid: false,
      errorMessage: `Please enter a ${labels[type]} to check.`,
    };
  }

  switch (type) {
    case "phone": {
      // Must accept:
      // 1. Helplines: 1930, 1909 (3-4 digits)
      // 2. Toll-free: 1800 xxx xxx, 1860 xxx xxx
      // 3. Indian mobiles: 10 digits, +91, 0 prefix, spaces/hyphens
      // 4. Landlines: e.g. +91 80 4100 2233
      // Reject junk numbers like "12345" or text strings
      if (/[a-zA-Z]/.test(value)) {
        return {
          isValid: false,
          errorMessage: "Phone number should only contain numbers, spaces, '+', or '-'.",
        };
      }

      const digitsOnly = value.replace(/\D/g, "");

      // Known short helplines (1930, 1909, 112, 100)
      if (/^(1930|1909|112|100)$/.test(digitsOnly)) {
        return { isValid: true };
      }

      // Toll-free starting with 1800 or 1860 (typically 10-11 digits)
      if (/^18[06]0\d{6,7}$/.test(digitsOnly)) {
        return { isValid: true };
      }

      // Check mobile or landline
      // Mobile: 10 digits usually starting with 6-9, or prefixed with 91 or 0
      if (digitsOnly.length === 10) {
        if (/^[6-9]\d{9}$/.test(digitsOnly)) {
          return { isValid: true };
        }
        // Could be landline with STD code (10 digits)
        return { isValid: true };
      }

      if (digitsOnly.length === 11 && digitsOnly.startsWith("0")) {
        return { isValid: true };
      }

      if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
        return { isValid: true };
      }

      // Check specific landline length (e.g. 91 80 41002233 -> 12 digits)
      if (digitsOnly.length >= 10 && digitsOnly.length <= 13) {
        return { isValid: true };
      }

      // Flag obvious junk like 12345
      return {
        isValid: false,
        errorMessage:
          "Please enter a valid 10-digit mobile number, toll-free number (1800/1860), or official helpline (1930).",
      };
    }

    case "upi": {
      // Must contain '@', no spaces in middle, valid handle and VPA
      // Examples: ravi12@okaxis, freshbakes@okaxis
      if (/\s/.test(value)) {
        return {
          isValid: false,
          errorMessage: "UPI ID should not contain spaces.",
        };
      }

      if (!value.includes("@")) {
        return {
          isValid: false,
          errorMessage: "UPI ID must include an '@' symbol (e.g. username@okaxis or mobile@upi).",
        };
      }

      const parts = value.split("@");
      if (parts.length !== 2 || !parts[0] || !parts[1]) {
        return {
          isValid: false,
          errorMessage: "Please enter a valid UPI ID format (e.g. username@bank).",
        };
      }

      // Basic character check
      if (!/^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z0-9.\-_]{2,}$/.test(value)) {
        return {
          isValid: false,
          errorMessage: "UPI ID contains unsupported characters.",
        };
      }

      return { isValid: true };
    }

    case "url": {
      // Links: e.g. https://sbi-kyc.in/pay, http://sbi-kyc.in, or sbi-kyc.in/pay
      let testUrl = value;
      if (!/^https?:\/\//i.test(testUrl)) {
        testUrl = `https://${testUrl}`;
      }

      try {
        const parsed = new URL(testUrl);
        if (!parsed.hostname || !parsed.hostname.includes(".")) {
          return {
            isValid: false,
            errorMessage: "Please enter a valid website domain or link (e.g. https://sbi-kyc.in/pay).",
          };
        }
        return { isValid: true };
      } catch {
        return {
          isValid: false,
          errorMessage: "Please enter a valid URL (e.g. https://example.com/link).",
        };
      }
    }

    case "sender_id": {
      // SMS sender: 6-letter code without prefix, or with 2-letter prefix like VM-HDFCBK, AD-HDFCBK, HDFCBK, SBIINB
      const cleaned = value.replace(/\s+/g, "");

      // Accept: e.g. "HDFCBK" (6 chars), "SBIINB", "AXISBK", or prefixed "VM-HDFCBK", "AD-HDFCBK", "BZ-SBIINB"
      if (/^[a-zA-Z]{2}-?[a-zA-Z0-9]{3,8}$/.test(cleaned) || /^[a-zA-Z0-9]{3,8}$/.test(cleaned)) {
        return { isValid: true };
      }

      return {
        isValid: false,
        errorMessage: "SMS sender IDs are typically 6 characters (e.g. HDFCBK or VM-SBIINB).",
      };
    }

    default:
      return { isValid: true };
  }
}

/**
 * Intelligent helper to detect the most probable identifier type from a raw query
 */
export function detectIdentifierType(value: string): LookupIdentifierType {
  const trimmed = value.trim();

  if (trimmed.includes("@")) {
    return "upi";
  }

  if (/^https?:\/\//i.test(trimmed) || /\.(in|com|org|net|co|xyz|top|info|live|online|biz|app)(\/.*)?$/i.test(trimmed)) {
    return "url";
  }

  // 6 uppercase letters or prefixed header like VK-SBIINB, AD-HDFCBK
  if (/^[A-Z]{2}-[A-Z0-9]{3,8}$/.test(trimmed) || (/^[A-Za-z]{6}$/.test(trimmed) && !/^\d+$/.test(trimmed))) {
    return "sender_id";
  }

  // Default to phone if digits/plus present or general
  return "phone";
}

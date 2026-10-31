/**
 * Formatting helpers for Indian cybersecurity records
 */

export function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function maskIdentifier(value: string, type: "phone" | "upi" | "bank" | "general" = "general"): string {
  if (!value) return "";
  const trimmed = value.trim();

  if (type === "phone" || /^\+?91?[6-9]\d{9}$/.test(trimmed)) {
    // Show first 3 and last 3 digits
    const cleaned = trimmed.replace(/\s+/g, "");
    if (cleaned.length >= 10) {
      const prefix = cleaned.slice(0, cleaned.length - 7);
      const end = cleaned.slice(-3);
      return `${prefix}****${end}`;
    }
  }

  if (type === "upi" || trimmed.includes("@")) {
    const [handle, vpa] = trimmed.split("@");
    if (handle.length <= 3) {
      return `${handle}***@${vpa}`;
    }
    return `${handle.slice(0, 2)}***${handle.slice(-1)}@${vpa}`;
  }

  if (type === "bank" && trimmed.length >= 8) {
    return `•••• •••• ${trimmed.slice(-4)}`;
  }

  if (trimmed.length > 6) {
    return `${trimmed.slice(0, 3)}••••${trimmed.slice(-3)}`;
  }

  return trimmed;
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return dateString;
  }
}

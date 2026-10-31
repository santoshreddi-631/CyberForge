import type { IdentifierType } from "../identifiers/identifier.types.js";

export function maskIdentifier(type: IdentifierType, canonicalValue: string): string {
  switch (type) {
    case "phone": {
      const visible = canonicalValue.startsWith("+91") ? canonicalValue.slice(3) : canonicalValue;
      if (visible.length <= 5) return `${visible.slice(0, 1)}${"*".repeat(Math.max(1, visible.length - 2))}${visible.slice(-1)}`;
      return `${visible.slice(0, 2)}XXXXX${visible.slice(-3)}`;
    }
    case "upi": {
      const [account, provider] = canonicalValue.split("@");
      return `${account.slice(0, 1)}***@${provider}`;
    }
    case "url": {
      const parsed = new URL(canonicalValue);
      const labels = parsed.hostname.split(".");
      const host = labels.length >= 2
        ? `${labels[0].slice(0, 3)}***.${labels.slice(1).join(".")}`
        : `${parsed.hostname.slice(0, 3)}***`;
      return `${host}${parsed.pathname && parsed.pathname !== "/" ? "/..." : "/..."}`;
    }
    case "sender_id":
      return `${canonicalValue.slice(0, 2)}****`;
  }
}

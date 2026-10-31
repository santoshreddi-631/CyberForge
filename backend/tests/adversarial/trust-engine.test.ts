import { describe, expect, it } from "vitest";
import { evaluateTrust } from "../../src/modules/trust/trust-engine.js";
import type { TrustReport } from "../../src/modules/trust/trust.types.js";
import { validateIdentifier } from "../../src/modules/identifiers/validate.js";

function report(index: number, overrides: Partial<TrustReport> = {}): TrustReport {
  return {
    reportId: `report-${index}`,
    reporterKey: `reporter-${index}`,
    ipPrefixKey: `ip-${index}`,
    occurredAt: new Date(Date.UTC(2026, 9, 20, 10 + Math.floor(index / 3), index % 3)).toISOString(),
    note: `I received a suspicious call describing a specific payment request and account detail ${index}.`,
    hasScreenshot: index % 2 === 0,
    ...overrides,
  };
}

describe("deterministic trust engine adversarial scenarios", () => {
  it("does not label a bakery target known scam after 40 coordinated reports", () => {
    const reports = Array.from({ length: 40 }, (_, index) => report(index, {
      note: "This bakery number is scam report immediately",
      occurredAt: new Date(Date.UTC(2026, 9, 20, 10, index % 5)).toISOString(),
    }));
    const result = evaluateTrust(reports);
    expect(result.verdict).not.toBe("KNOWN_SCAM");
    expect(result.signals.coordinatedBurst).toBe(true);
    expect(result.eligibleReportIds).toHaveLength(0);
  });

  it("does not treat 22 accounts on one Wi-Fi prefix as independent evidence", () => {
    const reports = Array.from({ length: 22 }, (_, index) => report(index, {
      ipPrefixKey: "shared-wifi",
      occurredAt: new Date(Date.UTC(2026, 9, 20, 10, index * 2)).toISOString(),
    }));
    const result = evaluateTrust(reports);
    expect(result.verdict).not.toBe("KNOWN_SCAM");
    expect(result.signals.independentIpPrefixCount).toBe(1);
    expect(result.signals.suspiciousIpConcentration).toBe(true);
  });

  it("counts six submissions by one person as one independent reporter", () => {
    const result = evaluateTrust(Array.from({ length: 6 }, (_, index) => report(index, {
      reporterKey: "same-reporter",
      ipPrefixKey: `ip-${index}`,
    })));
    expect(result.signals.independentReporterCount).toBe(1);
    expect(result.verdict).not.toBe("KNOWN_SCAM");
    expect(result.reasons.join(" ")).toContain("one independent voice");
  });

  it("ignores invalid and duplicate reports", () => {
    const reports = [
      ...Array.from({ length: 5 }, (_, index) => report(index)),
      report(99, { reportId: "report-0", duplicate: true }),
      report(100, { valid: false }),
    ];
    const result = evaluateTrust(reports);
    expect(result.signals.duplicateReportCount).toBe(1);
    expect(result.signals.invalidReportCount).toBe(1);
    expect(result.signals.validReportCount).toBe(5);
    expect(result.reportDecisions.find((decision) => decision.reportId === "report-0")?.status).toBe("eligible");
  });

  it("allows genuinely independent reports with varied descriptions to qualify", () => {
    const result = evaluateTrust(Array.from({ length: 7 }, (_, index) => report(index, {
      occurredAt: new Date(Date.UTC(2026, 9, 20 + Math.floor(index / 3), 10 + index)).toISOString(),
      note: [
        "Caller claimed police had seized a parcel and demanded an immediate transfer.",
        "A video call threatened arrest unless I paid a supposed customs release fee.",
        "The caller used a fake court notice and asked for an OTP over a payment app.",
        "They said my electricity account would be disconnected and sent a payment link.",
        "A person impersonating a bank officer requested card verification and a transfer.",
        "The job offer required a deposit before any work and came from a new number.",
        "The caller knew my name but could not answer basic account questions.",
      ][index],
    })));
    expect(result.verdict).toBe("KNOWN_SCAM");
    expect(result.trusted).toBe(true);
    expect(result.eligibleReportIds).toHaveLength(7);
  });

  it("protects verified businesses from hostile reporting", () => {
    const result = evaluateTrust(
      Array.from({ length: 20 }, (_, index) => report(index)),
      { verifiedBusiness: true },
    );
    expect(result.verdict).toBe("VERIFIED_BUSINESS");
    expect(result.trusted).toBe(false);
    expect(result.eligibleReportIds).toHaveLength(0);
  });

  it("does not reject or discount independent evidence merely because a shared IP exists", () => {
    const result = evaluateTrust(Array.from({ length: 7 }, (_, index) => report(index, {
      ipPrefixKey: index < 3 ? "family-wifi" : `ip-${index}`,
      occurredAt: new Date(Date.UTC(2026, 9, 20 + Math.floor(index / 3), 10 + index)).toISOString(),
    })));
    expect(result.signals.suspiciousIpConcentration).toBe(false);
    expect(result.verdict).toBe("KNOWN_SCAM");
  });

  it("treats a screenshot as supporting evidence, not proof by itself", () => {
    const result = evaluateTrust(Array.from({ length: 4 }, (_, index) => report(index, {
      hasScreenshot: true,
      note: "",
    })));
    expect(result.verdict).not.toBe("KNOWN_SCAM");
    expect(result.reasons.join(" ")).toContain("independent reporters");
  });

  it("keeps invalid phone input outside the trust engine", () => {
    expect(validateIdentifier("phone", "12345").success).toBe(false);
    const result = evaluateTrust([report(1, { valid: false })]);
    expect(result.signals.validReportCount).toBe(0);
    expect(result.verdict).toBe("NO_REPORTS");
  });

  it("does not confuse a genuine independent spike with a fake burst", () => {
    const result = evaluateTrust(Array.from({ length: 15 }, (_, index) => report(index, {
      occurredAt: new Date(Date.UTC(2026, 9, 20, index < 12 ? 8 : 9, index < 12 ? index * 5 : 1 + index)).toISOString(),
      note: `Distinct victim account of a scam call with detail ${index} and a different demand.`,
    })));
    expect(result.signals.maxBurstCount).toBeGreaterThanOrEqual(12);
    expect(result.signals.coordinatedBurst).toBe(false);
    expect(result.verdict).toBe("KNOWN_SCAM");
  });

  it("is deterministic for identical inputs", () => {
    const reports = Array.from({ length: 7 }, (_, index) => report(index));
    expect(evaluateTrust(reports)).toEqual(evaluateTrust(reports));
  });
});

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
    expect(result.signals.independentVoiceCount).toBe(1);
  });

  it("caps a large shared-prefix group to one voice while allowing enough independent networks to qualify", () => {
    const shared = Array.from({ length: 22 }, (_, index) => report(index, {
      ipPrefixKey: "shared-network",
      occurredAt: new Date(Date.UTC(2026, 9, 20, 8 + index * 2)).toISOString(),
      note: `A distinct account describes a specific payment request and callback detail ${index}.`,
    }));
    const independent = Array.from({ length: 4 }, (_, index) => report(100 + index, {
      ipPrefixKey: `independent-network-${index}`,
      occurredAt: new Date(Date.UTC(2026, 9, 20, 9 + index * 5)).toISOString(),
    }));
    const result = evaluateTrust([...shared, ...independent]);
    const eligibleIds = new Set(result.eligibleReportIds);

    expect(result.signals.independentReporterCount).toBe(26);
    expect(result.signals.independentVoiceCount).toBe(5);
    expect(result.verdict).toBe("KNOWN_SCAM");
    expect(shared.filter((item) => eligibleIds.has(item.reportId))).toHaveLength(1);
    expect(result.eligibleReportIds).toHaveLength(5);
  });

  it("does not allow one reporter to gain extra voices by changing networks", () => {
    const result = evaluateTrust(Array.from({ length: 7 }, (_, index) => report(index, {
      reporterKey: "same-reporter",
      ipPrefixKey: `network-${index}`,
    })));
    expect(result.signals.independentReporterCount).toBe(1);
    expect(result.signals.independentVoiceCount).toBe(1);
    expect(result.verdict).not.toBe("KNOWN_SCAM");
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
    expect(result.reasons.join(" ")).toContain("reporter/network voices");
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

  it("trips target circuit breaker when a distributed bot flood targets one number from 10 different networks in 10 minutes", () => {
    const botReports = Array.from({ length: 10 }, (_, index) => report(index, {
      reporterKey: `bot-reporter-${index}`,
      ipPrefixKey: `distinct-bot-ip-network-${index}`,
      occurredAt: new Date(Date.UTC(2026, 9, 20, 10, index)).toISOString(),
      note: `Distinct generated note description with detail ${index} regarding caller demands and transactions.`,
    }));

    const result = evaluateTrust(botReports);
    expect(result.circuitBreakerTripped).toBe(true);
    expect(result.signals.circuitBreakerTripped).toBe(true);
    expect(result.signals.circuitBreakerSurgeCount).toBe(10);
    expect(result.verdict).toBe("SUSPICIOUS");
    expect(result.trusted).toBe(false);
    expect(result.reasons.join(" ")).toContain("Target circuit breaker tripped");
  });

  it("is deterministic for identical inputs", () => {
    const reports = Array.from({ length: 7 }, (_, index) => report(index));
    expect(evaluateTrust(reports)).toEqual(evaluateTrust(reports));
  });
});

describe("trust engine core safety invariants (9 required scenarios)", () => {
  // 1. Insufficient independent reporters (< 5)
  it("rejects promotion when independent reporters are insufficient (< 5)", () => {
    const reports = Array.from({ length: 3 }, (_, index) =>
      report(index, {
        reporterKey: `unique-reporter-${index}`,
        ipPrefixKey: `unique-ip-${index}`,
        occurredAt: new Date(Date.UTC(2026, 9, 20 + index, 10)).toISOString(),
        note: `Detailed description of payment demand and callback verification ${index}.`,
      })
    );
    const result = evaluateTrust(reports);
    expect(result.trusted).toBe(false);
    expect(result.verdict).not.toBe("KNOWN_SCAM");
    expect(result.signals.independentVoiceCount).toBe(3);
    expect(result.eligibleReportIds).toHaveLength(0);
    expect(result.reasons.some((r) => r.includes("Fewer than 5 independent reporter"))).toBe(true);
  });

  // 2. Insufficient independent IP prefixes (< 3)
  it("rejects promotion when independent IP prefixes are insufficient (< 3)", () => {
    const reports = Array.from({ length: 6 }, (_, index) =>
      report(index, {
        reporterKey: `distinct-reporter-${index}`,
        ipPrefixKey: `prefix-${index % 2}`, // Only 2 distinct prefixes
        occurredAt: new Date(Date.UTC(2026, 9, 20 + Math.floor(index / 2), 10 + index)).toISOString(),
        note: `Detailed explanation of malicious payment link received with transaction ID ${index}.`,
      })
    );
    const result = evaluateTrust(reports);
    expect(result.trusted).toBe(false);
    expect(result.verdict).not.toBe("KNOWN_SCAM");
    expect(result.signals.independentIpPrefixCount).toBe(2);
    expect(result.eligibleReportIds).toHaveLength(0);
    expect(result.reasons.some((r) => r.includes("Fewer than 3 independent IP prefixes"))).toBe(true);
  });

  // 3. Repeated reporter submissions (same reporter does not multiply voices)
  it("treats repeated reporter submissions as one independent voice", () => {
    const reports = Array.from({ length: 7 }, (_, index) =>
      report(index, {
        reporterKey: "single-persistent-reporter",
        ipPrefixKey: `distinct-ip-${index}`,
        occurredAt: new Date(Date.UTC(2026, 9, 20 + index, 11)).toISOString(),
        note: `Victim report submission number ${index} regarding caller demands for credentials.`,
      })
    );
    const result = evaluateTrust(reports);
    expect(result.trusted).toBe(false);
    expect(result.signals.independentReporterCount).toBe(1);
    expect(result.signals.repeatedReporter).toBe(true);
    expect(result.signals.independentVoiceCount).toBe(1);
    expect(result.verdict).not.toBe("KNOWN_SCAM");
  });

  // 4. Repeated IP-prefix submissions (shared network capped to 1 voice)
  it("caps repeated submissions from the same IP prefix to one voice", () => {
    const reports = Array.from({ length: 8 }, (_, index) =>
      report(index, {
        reporterKey: `office-worker-${index}`,
        ipPrefixKey: "192.168.1.0/24", // Single shared prefix
        occurredAt: new Date(Date.UTC(2026, 9, 20 + index, 12)).toISOString(),
        note: `Colleague report ${index} about phishing email demanding urgent payroll account update.`,
      })
    );
    const result = evaluateTrust(reports);
    expect(result.trusted).toBe(false);
    expect(result.signals.independentIpPrefixCount).toBe(1);
    expect(result.signals.independentVoiceCount).toBe(1);
    expect(result.verdict).not.toBe("KNOWN_SCAM");
  });

  // 5. Insufficient time buckets (reports all in one hour bucket)
  it("requires reports to span at least two separate time buckets", () => {
    // 6 distinct reporters & 6 distinct IPs, but all within the same 1-hour bucket
    const reports = Array.from({ length: 6 }, (_, index) =>
      report(index, {
        reporterKey: `time-bucket-rep-${index}`,
        ipPrefixKey: `time-bucket-ip-${index}`,
        occurredAt: new Date(Date.UTC(2026, 9, 20, 10, index * 5)).toISOString(), // 10:00 to 10:25
        note: `Report with substantive information regarding fake investment advisory claim ${index}.`,
      })
    );
    const result = evaluateTrust(reports);
    expect(result.trusted).toBe(false);
    expect(result.signals.uniqueTimeBucketCount).toBe(1);
    expect(result.reasons.some((r) => r.includes("time buckets"))).toBe(true);
    expect(result.verdict).not.toBe("KNOWN_SCAM");
  });

  // 6. Substantive independent evidence
  it("evaluates substantive independent evidence and flags low quality when descriptions are missing or copied", () => {
    // 6 reports with empty descriptions and no screenshots
    const emptyNoteReports = Array.from({ length: 6 }, (_, index) =>
      report(index, {
        reporterKey: `rep-brief-${index}`,
        ipPrefixKey: `ip-brief-${index}`,
        occurredAt: new Date(Date.UTC(2026, 9, 20 + index, 10)).toISOString(),
        hasScreenshot: false,
        note: "",
      })
    );
    const emptyResult = evaluateTrust(emptyNoteReports);
    expect(emptyResult.signals.averageEvidenceQuality).toBeLessThan(0.6);
    expect(
      emptyResult.reasons.some((r) =>
        r.includes("Evidence quality is limited because reports lack substantive independent descriptions")
      )
    ).toBe(true);

    // Reports with copied template notes
    const copiedReports = Array.from({ length: 6 }, (_, index) =>
      report(index, {
        reporterKey: `rep-copied-${index}`,
        ipPrefixKey: `ip-copied-${index}`,
        occurredAt: new Date(Date.UTC(2026, 9, 20 + index, 10)).toISOString(),
        note: "same repeated template complaint copied across all submissions",
      })
    );
    const copiedResult = evaluateTrust(copiedReports);
    expect(copiedResult.signals.copiedNoteRatio).toBeGreaterThanOrEqual(0.6);
    expect(
      copiedResult.reasons.some((r) =>
        r.includes("Copied note concentration reduces evidence quality")
      )
    ).toBe(true);
  });

  // 7. A valid eligible case (independent reporters, distinct IPs, multi-bucket, substantive)
  it("confirms a valid eligible case when all independent criteria are met", () => {
    const reports = Array.from({ length: 6 }, (_, index) =>
      report(index, {
        reporterKey: `valid-reporter-${index}`,
        ipPrefixKey: `valid-ip-${index}`,
        occurredAt: new Date(Date.UTC(2026, 9, 20 + index, 9 + (index % 4))).toISOString(),
        note: [
          "Received an automated call from someone claiming to be from the electric board demanding ₹15,000.",
          "Caller claimed to be police officer inquiring about a suspicious courier parcel containing contraband.",
          "SMS sender urged immediate KYC update for bank account or service will be stopped within 24 hours.",
          "Received WhatsApp job offer offering ₹5000/day for liking videos but asked for upfront registration fee.",
          "Caller impersonating tax official threatened legal penalty unless immediate penalty payment was settled.",
          "Phishing SMS with an unverified short link directed to a fake net banking login portal asking for OTP.",
        ][index],
      })
    );
    const result = evaluateTrust(reports);
    expect(result.trusted).toBe(true);
    expect(result.verdict).toBe("KNOWN_SCAM");
    expect(result.signals.independentVoiceCount).toBeGreaterThanOrEqual(5);
    expect(result.signals.independentIpPrefixCount).toBeGreaterThanOrEqual(3);
    expect(result.signals.uniqueTimeBucketCount).toBeGreaterThanOrEqual(2);
    expect(result.eligibleReportIds.length).toBeGreaterThanOrEqual(5);
  });

  // 8. Verified business protection
  it("protects verified businesses and never marks them as KNOWN_SCAM", () => {
    const reports = Array.from({ length: 15 }, (_, index) =>
      report(index, {
        reporterKey: `hostile-rep-${index}`,
        ipPrefixKey: `hostile-ip-${index}`,
        occurredAt: new Date(Date.UTC(2026, 9, 20 + (index % 4), 10 + (index % 5))).toISOString(),
        note: `Adversarial coordinated accusation alleging fraud against legitimate store ${index}.`,
      })
    );
    const result = evaluateTrust(reports, { verifiedBusiness: true });
    expect(result.verdict).toBe("VERIFIED_BUSINESS");
    expect(result.trusted).toBe(false);
    expect(result.eligibleReportIds).toHaveLength(0);
    expect(result.reasons.some((r) => r.includes("Verified business protection"))).toBe(true);
  });

  // 9. Challenged identifier protection
  it("protects challenged identifiers from becoming KNOWN_SCAM during active dispute", () => {
    const reports = Array.from({ length: 12 }, (_, index) =>
      report(index, {
        reporterKey: `disputed-rep-${index}`,
        ipPrefixKey: `disputed-ip-${index}`,
        occurredAt: new Date(Date.UTC(2026, 9, 20 + (index % 3), 10 + (index % 4))).toISOString(),
        note: `Consumer report disputing payment processing and asking for merchant review ${index}.`,
      })
    );
    const result = evaluateTrust(reports, { challenged: true });
    expect(result.verdict).toBe("SUSPICIOUS");
    expect(result.trusted).toBe(false);
    expect(result.eligibleReportIds).toHaveLength(0);
    expect(result.reasons.some((r) => r.includes("Identifier is under challenge"))).toBe(true);
  });
});

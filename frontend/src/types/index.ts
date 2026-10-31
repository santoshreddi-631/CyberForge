/**
 * Core TypeScript definitions for Community Scam Map
 */

export type LanguageCode = "en" | "hi";

export type IdentifierType = "phone" | "upi" | "bank" | "url" | "handle" | "other";

export type ScamCategory =
  | "upi_fraud"
  | "part_time_job"
  | "lottery_kbc"
  | "aadhaar_pan"
  | "loan_app"
  | "deepfake_impersonation"
  | "phishing_url"
  | "crypto_investment"
  | "courier_customs"
  | "electricity_bill"
  | "other";

export type ScamStatus =
  | "verified"
  | "under_review"
  | "disputed"
  | "cleared"
  | "flagged";

export type RiskLevel = "critical" | "high" | "medium" | "low" | "safe";

export interface GeoLocation {
  state?: string;
  city?: string;
  district?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
}

export interface ScamReportSummary {
  id: string;
  title: string;
  category: ScamCategory;
  identifierType: IdentifierType;
  identifierValue: string;
  maskedIdentifier: string;
  amountLostInr?: number;
  riskLevel: RiskLevel;
  status: ScamStatus;
  location?: GeoLocation;
  reportsCount: number;
  verifiedCount: number;
  lastReportedAt: string;
  createdAt: string;
}

export interface ScamReportDetail extends ScamReportSummary {
  description: string;
  evidenceHashes?: string[];
  timeline: {
    timestamp: string;
    action: string;
    note?: string;
  }[];
}

export interface ScamLookupResult {
  queriedValue: string;
  identifierType: IdentifierType;
  isFlagged: boolean;
  riskLevel: RiskLevel;
  totalReports: number;
  totalLossInr: number;
  status: ScamStatus;
  primaryCategory?: ScamCategory;
  matchedReports: ScamReportSummary[];
  firstReportedAt?: string;
  lastReportedAt?: string;
}

export interface FraudAlert {
  id: string;
  title: string;
  summary: string;
  category: ScamCategory;
  riskLevel: RiskLevel;
  region: string;
  affectedCount: number;
  publishedAt: string;
  isActive: boolean;
}

export interface DisputeSubmission {
  id?: string;
  reportId: string;
  entityName: string;
  gstinOrPan?: string;
  officialEmail: string;
  phoneNumber: string;
  disputeReason: string;
  documentUrls?: string[];
  status?: "pending" | "investigating" | "rejected" | "accepted";
  submittedAt?: string;
}

export interface NavItem {
  name: string;
  href: string;
  badge?: string;
  iconName?: string;
}

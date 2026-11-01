/**
 * Core TypeScript definitions for 
 */

export type LanguageCode = "en" | "hi";

export type LookupIdentifierType = "phone" | "upi" | "url" | "sender_id";

export type LookupVerdict =
  | "KNOWN_SCAM"
  | "SUSPICIOUS"
  | "NO_REPORTS"
  | "VERIFIED_BUSINESS";

export interface LookupEvidenceItem {
  occurred_at?: string;
  channel?: string;
  scam_type?: string;
  pincode?: string;
}

export interface BackendLookupResult {
  verdict: LookupVerdict;
  report_count?: number;
  distinct_reporters?: number;
  first_seen?: string;
  last_seen?: string;
  scam_type?: string;
  display_value?: string;
  evidence?: LookupEvidenceItem[];
  challenged?: boolean;
  business_name?: string;
}

export type IdentifierType = "phone" | "upi" | "bank" | "url" | "sender_id" | "handle" | "other";

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
  | "fake_customer_care"
  | "otp_call"
  | "sextortion"
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

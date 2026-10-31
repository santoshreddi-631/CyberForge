/**
 * API Contracts defining request & response payloads for Community Scam Map
 */
import {
  ScamReportSummary,
  DisputeSubmission,
  ScamCategory,
  IdentifierType,
  LookupIdentifierType,
  BackendLookupResult,
} from "@/types";

export interface LookupRequestParams {
  type: LookupIdentifierType;
  value: string;
}

export interface LookupRequestContract {
  query: string;
  type?: LookupIdentifierType;
}

export type LookupResponseContract = BackendLookupResult;

export interface CreateReportRequestContract {
  title: string;
  description: string;
  category: ScamCategory;
  identifierType: IdentifierType;
  identifierValue: string;
  amountLostInr?: number;
  incidentDate?: string;
  state?: string;
  city?: string;
  pincode?: string;
  evidenceHashes?: string[];
}

export interface CreateReportResponseContract {
  success?: boolean;
  report_id?: string;
  case_id?: string;
  merged?: boolean;
  reportId?: string;
  referenceNumber?: string;
  status?: string;
  createdAt?: string;
}

export interface ReportsQueryContract {
  category?: ScamCategory;
  state?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface ReportsListResponseContract {
  items: ScamReportSummary[];
  total: number;
  page: number;
  totalPages: number;
}

export type AlertType = "SPIKE" | "NEW_TYPE" | string;

export interface AlertItemContract {
  type: AlertType;
  pincode: string;
  window?: string;
  count?: number;
  baseline_per_day?: number;
  scam_type?: string;
  locality?: string;
  city?: string;
  timestamp?: string;
  created_at?: string;
  title?: string;
  summary?: string;
}

export interface AlertsQueryParamsContract {
  pincode?: string;
}

export interface AlertsResponseContract {
  alerts: AlertItemContract[];
}

export interface MapClusterItem {
  pincode: string;
  locality: string;
  city: string;
  count: number;
  top_scam_type: string;
  severity: "CRIT" | "HIGH" | "MED" | string;
  lat: number;
  lng: number;
}

export interface MapQueryParamsContract {
  pincode?: string;
  days?: number;
  radius_km?: number;
}

export interface MapResponseContract {
  clusters: MapClusterItem[];
}

export interface ChallengeRequestContract {
  identifier_type: string;
  identifier_value: string;
  claimant_name: string;
  contact_email: string;
  proof_note: string;
}

export interface ChallengeResponseContract {
  challenge_id: string;
  status?: string;
}

export type CreateDisputeRequestContract = ChallengeRequestContract;
export type CreateDisputeResponseContract = ChallengeResponseContract;

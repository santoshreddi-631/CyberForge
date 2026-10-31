/**
 * API Contracts defining request & response payloads for Community Scam Map
 */
import {
  ScamReportSummary,
  FraudAlert,
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
  success: boolean;
  reportId: string;
  referenceNumber: string;
  status: string;
  createdAt: string;
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

export interface AlertsResponseContract {
  alerts: FraudAlert[];
  updatedAt: string;
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

export type CreateDisputeRequestContract = DisputeSubmission;

export interface CreateDisputeResponseContract {
  success: boolean;
  ticketId: string;
  status: "pending";
  acknowledgmentMessage: string;
}

/**
 * API Contracts defining request & response payloads for Community Scam Map
 */
import {
  ScamLookupResult,
  ScamReportSummary,
  FraudAlert,
  DisputeSubmission,
  ScamCategory,
  IdentifierType,
} from "@/types";

export interface LookupRequestContract {
  query: string;
  type?: IdentifierType;
}

export type LookupResponseContract = ScamLookupResult;

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

export type CreateDisputeRequestContract = DisputeSubmission;

export interface CreateDisputeResponseContract {
  success: boolean;
  ticketId: string;
  status: "pending";
  acknowledgmentMessage: string;
}

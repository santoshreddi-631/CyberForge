/**
 * Community Scam Map - Frontend API Client
 * Robust, typed HTTP client connecting to FastAPI backend.
 */

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
}

export class ApiError extends Error {
  status: number;
  statusText: string;
  data: unknown;

  constructor(message: string, status: number, statusText: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  params?: Record<string, string | number | boolean | undefined | null>;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 15000;

export function getBaseApiUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.replace(/\/+$/, "");
  }
  return "http://localhost:3001";
}

/**
 * Execute typed HTTP fetch request with timeout, JSON parsing, and unified error handling
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestOptions & { body?: unknown } = {}
): Promise<T> {
  const baseUrl = getBaseApiUrl();
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  const url = new URL(`${baseUrl}${normalizedEndpoint}`);

  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers = new Headers(options.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  let requestBody: BodyInit | undefined;
  if (options.body !== undefined) {
    if (!headers.has("Content-Type") && typeof options.body === "object" && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
      requestBody = JSON.stringify(options.body);
    } else if (options.body instanceof FormData) {
      requestBody = options.body;
    } else {
      requestBody = options.body as BodyInit;
    }
  }

  try {
    const response = await fetch(url.toString(), {
      ...options,
      headers,
      body: requestBody,
      signal: options.signal || controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get("content-type");
    let responseData: unknown = null;

    if (contentType && contentType.includes("application/json")) {
      try {
        responseData = await response.json();
      } catch {
        responseData = null;
      }
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      const errorMsg =
        typeof responseData === "object" && responseData !== null && "detail" in responseData
          ? String((responseData as { detail: unknown }).detail)
          : `API request failed with status ${response.status}: ${response.statusText}`;

      throw new ApiError(errorMsg, response.status, response.statusText, responseData);
    }

    return responseData as T;
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(
        `Request timeout after ${timeoutMs}ms: ${endpoint}`,
        408,
        "Request Timeout"
      );
    }

    const networkMessage = error instanceof Error ? error.message : "Network error or server unreachable";
    throw new ApiError(networkMessage, 0, "Network Error", error);
  }
}

export const apiClient = {
  get: <T = unknown>(endpoint: string, options?: RequestOptions): Promise<T> =>
    apiRequest<T>(endpoint, { ...options, method: "GET" }),

  post: <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> =>
    apiRequest<T>(endpoint, { ...options, method: "POST", body }),

  put: <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> =>
    apiRequest<T>(endpoint, { ...options, method: "PUT", body }),

  delete: <T = unknown>(endpoint: string, options?: RequestOptions): Promise<T> =>
    apiRequest<T>(endpoint, { ...options, method: "DELETE" }),
};

export default apiClient;

import { apiBaseUrl } from "../config/api";

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string>;
};

export class ApiError extends Error {
  readonly status: number;
  readonly errors?: Record<string, string>;

  constructor(status: number, message: string, errors?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

export type ApiRequestOptions = Omit<RequestInit, "body" | "credentials" | "headers"> & {
  body?: unknown;
  headers?: HeadersInit;
  csrf?: boolean;
};

let csrfToken: string | null = null;

function buildUrl(path: string) {
  return `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

async function parseResponse<T>(response: Response): Promise<ApiEnvelope<T>> {
  const text = await response.text();
  if (!text) return { success: response.ok };
  try {
    return JSON.parse(text) as ApiEnvelope<T>;
  } catch {
    if (response.ok) return { success: true };
    return { success: false, message: "Unexpected server response" };
  }
}

export async function getCsrfToken() {
  if (csrfToken) return csrfToken;
  const response = await apiRequest<{ csrfToken: string }>("/auth/csrf");
  if (!response.csrfToken) throw new ApiError(500, "CSRF token was unavailable");
  csrfToken = response.csrfToken;
  return csrfToken;
}

export function clearCsrfToken() {
  csrfToken = null;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, headers: suppliedHeaders, csrf = false, ...requestOptions } = options;
  const headers = new Headers(suppliedHeaders);
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (csrf) headers.set("X-CSRF-Token", await getCsrfToken());

  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      ...requestOptions,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "include",
      cache: "no-store",
      signal: options.signal ?? AbortSignal.timeout(10000),
    });
  } catch {
    throw new ApiError(0, "Unable to reach the RentNest API.");
  }
  const payload = await parseResponse<T>(response);
  if (!response.ok || !payload.success) {
    if (response.status === 401) {
      clearCsrfToken();
      if (!["/auth/login", "/auth/register", "/auth/me", "/auth/password"].includes(path)) {
        window.dispatchEvent(new Event("rentnest:session-ended"));
      }
    }
    throw new ApiError(response.status, payload.message ?? "Request failed", payload.errors);
  }
  return payload.data as T;
}

import type { ApiError, ApiResponse } from "@email-platform/types";

// This is the sole browser-visible backend origin. It is supplied by the
// deployment environment; individual requests only provide route paths.
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER = "x-csrf-token";

export class ApiClientError extends Error {
  code: string;
  status: number;
  fieldErrors: Array<{ field?: string; message: string }>;

  constructor(body: ApiError, status: number) {
    super(body.message);
    this.name = "ApiClientError";
    this.code = body.code;
    this.status = status;
    this.fieldErrors = body.errors ?? [];
  }
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1] ?? "") : undefined;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Pass a FormData body directly (skips JSON.stringify + content-type header). */
  formData?: FormData;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL must be configured before making API requests.");
  }
  const url = new URL(path.replace(/^\//, ""), API_URL.endsWith("/") ? API_URL : `${API_URL}/`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, formData, signal } = options;
  const headers: Record<string, string> = {};

  const isMutation = method !== "GET";
  if (isMutation) {
    const csrfToken = readCookie(CSRF_COOKIE_NAME);
    if (csrfToken) headers[CSRF_HEADER] = csrfToken;
  }

  let requestBody: BodyInit | undefined;
  if (formData) {
    requestBody = formData;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    requestBody = JSON.stringify(body);
  }

  const res = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: requestBody,
    credentials: "include",
    signal,
  });

  // 204 / empty body
  const text = await res.text();
  const json = text ? (JSON.parse(text) as ApiResponse<T>) : ({ success: true, data: undefined } as ApiResponse<T>);

  if (!json.success) {
    throw new ApiClientError(json, res.status);
  }
  return json.data;
}

export const apiClient = {
  get: <T>(path: string, query?: RequestOptions["query"], signal?: AbortSignal) =>
    request<T>(path, { method: "GET", query, signal }),
  post: <T>(path: string, body?: unknown, query?: RequestOptions["query"]) =>
    request<T>(path, { method: "POST", body, query }),
  patch: <T>(path: string, body?: unknown, query?: RequestOptions["query"]) =>
    request<T>(path, { method: "PATCH", body, query }),
  delete: <T>(path: string, query?: RequestOptions["query"]) => request<T>(path, { method: "DELETE", query }),
  upload: <T>(path: string, formData: FormData) => request<T>(path, { method: "POST", formData }),
  /** For streamed responses (CSV export) that bypass the JSON envelope. */
  async downloadBlob(path: string, query?: RequestOptions["query"]): Promise<Blob> {
    const res = await fetch(buildUrl(path, query), { method: "GET", credentials: "include" });
    if (!res.ok) {
      throw new ApiClientError(
        { success: false, message: "Download failed", code: "DOWNLOAD_FAILED" },
        res.status,
      );
    }
    return res.blob();
  },
};

export { API_URL };

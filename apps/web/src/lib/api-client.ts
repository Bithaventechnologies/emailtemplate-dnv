
import type { ApiError, ApiResponse } from "@email-platform/types";

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
  if (typeof document === "undefined") {
    return undefined;
  }

  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name}=([^;]*)`),
  );

  return match
    ? decodeURIComponent(match[1] ?? "")
    : undefined;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  body?: unknown;
  query?: Record<
    string,
    string | number | boolean | undefined | null
  >;
  formData?: FormData;
  signal?: AbortSignal;
}

function buildUrl(
  path: string,
  query?: RequestOptions["query"],
): string {
  if (!API_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_URL must be configured before making API requests.",
    );
  }

  const baseUrl = API_URL.endsWith("/")
    ? API_URL
    : `${API_URL}/`;

  const url = new URL(
    path.replace(/^\//, ""),
    baseUrl,
  );

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

async function parseResponse<T>(
  response: Response,
): Promise<T> {
  const text = await response.text();

  let json: ApiResponse<T>;

  try {
    json = text
      ? (JSON.parse(text) as ApiResponse<T>)
      : ({
          success: response.ok,
          data: undefined,
        } as ApiResponse<T>);
  } catch {
    throw new ApiClientError(
      {
        success: false,
        message:
          text || "Invalid response from server",
        code: "INVALID_RESPONSE",
      },
      response.status,
    );
  }

  if (!response.ok || !json.success) {
    const errorBody: ApiError =
      json.success === false
        ? {
            success: false,
            message:
              json.message ||
              `Request failed with status ${response.status}`,
            code:
              json.code ||
              `HTTP_${response.status}`,
            errors: json.errors ?? [],
          }
        : {
            success: false,
            message: `Request failed with status ${response.status}`,
            code: `HTTP_${response.status}`,
            errors: [],
          };

    throw new ApiClientError(
      errorBody,
      response.status,
    );
  }

  return json.data;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    query,
    formData,
    signal,
  } = options;

  const headers: Record<string, string> = {};

  /*
   * CSRF protection
   *
   * GET requests normally don't require the CSRF header.
   * Mutating requests do.
   */
  const isMutation =
    method !== "GET";

  if (isMutation) {
    const csrfToken = readCookie(
      CSRF_COOKIE_NAME,
    );

    if (csrfToken) {
      headers[CSRF_HEADER] = csrfToken;
    }
  }

  let requestBody: BodyInit | undefined;

  /*
   * FormData
   *
   * Do NOT manually set Content-Type.
   * The browser automatically creates the
   * multipart/form-data boundary.
   */
  if (formData) {
    requestBody = formData;
  }

  /*
   * JSON body
   */
  else if (body !== undefined) {
    headers["Content-Type"] =
      "application/json";

    requestBody = JSON.stringify(body);
  }

  const url = buildUrl(path, query);

  console.log(
    `[API] ${method} ${url}`,
  );

  const response = await fetch(url, {
    method,
    headers,
    body: requestBody,
    signal,

    /*
     * IMPORTANT:
     *
     * This allows the browser to send
     * the session_token cookie to the backend.
     */
    credentials: "include",
  });

  console.log(
    `[API] ${method} ${url} -> ${response.status}`,
  );

  return parseResponse<T>(response);
}

export const apiClient = {
  get: <T>(
    path: string,
    query?: RequestOptions["query"],
    signal?: AbortSignal,
  ) =>
    request<T>(path, {
      method: "GET",
      query,
      signal,
    }),

  post: <T>(
    path: string,
    body?: unknown,
    query?: RequestOptions["query"],
  ) =>
    request<T>(path, {
      method: "POST",
      body,
      query,
    }),

  put: <T>(
    path: string,
    body?: unknown,
    query?: RequestOptions["query"],
  ) =>
    request<T>(path, {
      method: "PUT",
      body,
      query,
    }),

  patch: <T>(
    path: string,
    body?: unknown,
    query?: RequestOptions["query"],
  ) =>
    request<T>(path, {
      method: "PATCH",
      body,
      query,
    }),

  delete: <T>(
    path: string,
    query?: RequestOptions["query"],
  ) =>
    request<T>(path, {
      method: "DELETE",
      query,
    }),

  upload: <T>(
    path: string,
    formData: FormData,
  ) =>
    request<T>(path, {
      method: "POST",
      formData,
    }),

  async downloadBlob(
    path: string,
    query?: RequestOptions["query"],
  ): Promise<Blob> {
    const url = buildUrl(path, query);

    console.log(
      `[API] GET ${url}`,
    );

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    });

    console.log(
      `[API] GET ${url} -> ${response.status}`,
    );

    if (!response.ok) {
      throw new ApiClientError(
        {
          success: false,
          message: "Download failed",
          code: "DOWNLOAD_FAILED",
        },
        response.status,
      );
    }

    return response.blob();
  },
};

export { API_URL };


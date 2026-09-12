import { ApiClientError } from "@/lib/api-client";

/** Extracts a human-readable message from any thrown error, unwrapping ApiClientError. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

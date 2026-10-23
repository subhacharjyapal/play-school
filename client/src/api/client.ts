import axios from "axios";

/**
 * Shared axios instance. Sends cookies (JWT + CSRF) with every request.
 * CSRF: the server issues a readable `ls_csrf_token` cookie; we echo it in
 * the x-csrf-token header on state-changing requests.
 */
export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  timeout: 20000,
});

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

api.interceptors.request.use((config) => {
  if (config.method && !["get", "head", "options"].includes(config.method.toLowerCase())) {
    const token = getCookie("ls_csrf_token");
    if (token) config.headers.set?.("x-csrf-token", token);
  }
  return config;
});

export interface ApiErrorBody {
  error?: string;
  details?: unknown;
}

/** Extract a user-friendly message from an axios error. */
export function apiErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as ApiErrorBody | undefined;
    if (body?.error) return body.error;
    if (err.code === "ECONNABORTED") return "Request timed out. Please try again.";
  }
  return fallback;
}

/** Extract per-field errors from a 400 validation response. */
export function apiFieldErrors(err: unknown): Record<string, string> {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as ApiErrorBody | undefined;
    if (Array.isArray(body?.details)) {
      const out: Record<string, string> = {};
      for (const d of body.details) {
        if (d && typeof d === "object" && "field" in d && "message" in d) {
          const field = String((d as { field: unknown }).field);
          if (!out[field]) out[field] = String((d as { message: unknown }).message);
        }
      }
      return out;
    }
  }
  return {};
}

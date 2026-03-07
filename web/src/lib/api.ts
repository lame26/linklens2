import { supabase } from "./supabase";

const RAW_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || "";
const FALLBACK_PROD_API_BASE_URL = "https://linkpocket-api.lame26.workers.dev";

function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

const API_BASE_URL = (() => {
  if (typeof window !== "undefined") {
    const appOnLocalhost = isLocalHost(window.location.hostname);
    if (!RAW_API_BASE_URL) {
      return appOnLocalhost ? "" : FALLBACK_PROD_API_BASE_URL;
    }

    try {
      const parsed = new URL(RAW_API_BASE_URL);
      const targetHost = parsed.hostname;
      if (!appOnLocalhost && isLocalHost(targetHost)) {
        return FALLBACK_PROD_API_BASE_URL;
      }

      return parsed.toString().replace(/\/$/, "");
    } catch {
      return appOnLocalhost ? "" : FALLBACK_PROD_API_BASE_URL;
    }
  }

  if (!RAW_API_BASE_URL) {
    return "";
  }

  return RAW_API_BASE_URL.replace(/\/$/, "");
})();

export const REQUEST_TIMEOUT_MS = 25000;

export function toApiUrl(pathname: string): string {
  return API_BASE_URL ? `${API_BASE_URL}${pathname}` : pathname;
}

export async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} 요청 시간 초과`)), timeoutMs);
      })
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

export async function parseResponseError(response: Response): Promise<string> {
  const text = (await response.text()).trim();
  if (response.status === 401) {
    return "인증이 만료되었습니다. 다시 로그인해 주세요.";
  }
  if (!text) {
    return `HTTP ${response.status}`;
  }

  try {
    const parsed = JSON.parse(text) as { error?: string; message?: string };
    if (parsed?.message) {
      return parsed.message;
    }
    if (parsed?.error) {
      return parsed.error;
    }
  } catch {
    // no-op
  }

  const lowered = text.toLowerCase();
  if (lowered.includes("<!doctype") || lowered.includes("<html")) {
    return `API 응답이 HTML입니다 (HTTP ${response.status}). VITE_API_BASE_URL/Worker 배포를 확인해 주세요.`;
  }

  return text;
}

export async function getFreshAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

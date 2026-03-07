import { useCallback, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getFreshAccessToken, parseResponseError, REQUEST_TIMEOUT_MS, toApiUrl, withTimeout } from "../lib/api";

export type SummaryLengthMode = "short" | "medium" | "long";
export type SummaryStyleMode = "neutral" | "easy" | "insight";

interface UseAiPreferencesOptions {
  session: Session | null;
  onError: (message: string) => void;
  onToast: (toast: { kind: "ok" | "err"; message: string }) => void;
}

interface PreferencePayload {
  preferences?: {
    summaryLength?: SummaryLengthMode;
    summaryStyle?: SummaryStyleMode;
    summaryFocus?: string;
    customPrompt?: string;
  };
}

function normalizeLength(value: string | undefined, fallback: SummaryLengthMode): SummaryLengthMode {
  return value === "short" || value === "medium" || value === "long" ? value : fallback;
}

function normalizeStyle(value: string | undefined, fallback: SummaryStyleMode): SummaryStyleMode {
  return value === "neutral" || value === "easy" || value === "insight" ? value : fallback;
}

export function useAiPreferences({ session, onError, onToast }: UseAiPreferencesOptions) {
  const [summaryLengthMode, setSummaryLengthMode] = useState<SummaryLengthMode>("medium");
  const [summaryStyleMode, setSummaryStyleMode] = useState<SummaryStyleMode>("neutral");
  const [summaryFocusText, setSummaryFocusText] = useState("");
  const [summaryCustomPrompt, setSummaryCustomPrompt] = useState("");
  const [loadingAiPreferences, setLoadingAiPreferences] = useState(false);
  const [savingAiPreferences, setSavingAiPreferences] = useState(false);

  const resetDraft = useCallback(() => {
    setSummaryLengthMode("medium");
    setSummaryStyleMode("neutral");
    setSummaryFocusText("");
    setSummaryCustomPrompt("");
  }, []);

  const applyPayload = useCallback(
    (payload: PreferencePayload | null) => {
      const pref = payload?.preferences;
      setSummaryLengthMode((current) => normalizeLength(pref?.summaryLength, current));
      setSummaryStyleMode((current) => normalizeStyle(pref?.summaryStyle, current));
      setSummaryFocusText((pref?.summaryFocus || "").slice(0, 120));
      setSummaryCustomPrompt((pref?.customPrompt || "").slice(0, 500));
    },
    []
  );

  const loadPreferences = useCallback(async () => {
    if (!session) {
      resetDraft();
      return;
    }

    setLoadingAiPreferences(true);
    try {
      const accessToken = await getFreshAccessToken();
      if (!accessToken) {
        throw new Error("인증이 만료되었습니다. 다시 로그인해 주세요.");
      }

      const response = await withTimeout(
        fetch(toApiUrl("/api/v1/ai/preferences"), {
          method: "GET",
          headers: {
            authorization: `Bearer ${accessToken}`
          }
        }),
        REQUEST_TIMEOUT_MS,
        "AI 설정 조회"
      );

      if (!response.ok) {
        throw new Error(await parseResponseError(response));
      }

      const payload = (await response.json().catch(() => null)) as PreferencePayload | null;
      applyPayload(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      onError(`AI 요약 설정 조회 실패: ${message}`);
    } finally {
      setLoadingAiPreferences(false);
    }
  }, [applyPayload, onError, resetDraft, session]);

  const savePreferences = useCallback(async () => {
    if (!session || savingAiPreferences) {
      return;
    }

    setSavingAiPreferences(true);
    try {
      const accessToken = await getFreshAccessToken();
      if (!accessToken) {
        throw new Error("인증이 만료되었습니다. 다시 로그인해 주세요.");
      }

      const response = await withTimeout(
        fetch(toApiUrl("/api/v1/ai/preferences"), {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            summaryLength: summaryLengthMode,
            summaryStyle: summaryStyleMode,
            summaryFocus: summaryFocusText,
            customPrompt: summaryCustomPrompt
          })
        }),
        REQUEST_TIMEOUT_MS,
        "AI 설정 저장"
      );

      if (!response.ok) {
        throw new Error(await parseResponseError(response));
      }

      const payload = (await response.json().catch(() => null)) as PreferencePayload | null;
      applyPayload(payload);
      onToast({ kind: "ok", message: "AI 요약 설정이 저장되었습니다." });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      onError(`AI 요약 설정 저장 실패: ${message}`);
      onToast({ kind: "err", message: "AI 요약 설정 저장 실패" });
    } finally {
      setSavingAiPreferences(false);
    }
  }, [
    applyPayload,
    onError,
    onToast,
    savingAiPreferences,
    session,
    summaryCustomPrompt,
    summaryFocusText,
    summaryLengthMode,
    summaryStyleMode
  ]);

  return {
    summaryLengthMode,
    setSummaryLengthMode,
    summaryStyleMode,
    setSummaryStyleMode,
    summaryFocusText,
    setSummaryFocusText,
    summaryCustomPrompt,
    setSummaryCustomPrompt,
    loadingAiPreferences,
    savingAiPreferences,
    loadPreferences,
    savePreferences,
    resetDraft
  };
}

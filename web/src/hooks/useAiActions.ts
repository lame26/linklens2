import { useCallback, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Session } from "@supabase/supabase-js";
import { getFreshAccessToken, parseResponseError, REQUEST_TIMEOUT_MS, toApiUrl, withTimeout } from "../lib/api";
import { supabase } from "../lib/supabase";
import type { LinkItem } from "../lib/types";

interface UseAiActionsOptions {
  session: Session | null;
  linksQuery: {
    setLinks: Dispatch<SetStateAction<LinkItem[]>>;
    loadLinks: (options?: { silent?: boolean; skipCounts?: boolean }) => Promise<void>;
  };
  getLinkDisplayLabel: (link: Pick<LinkItem, "title" | "url">) => string;
  normalizeCategoryName: (value: string | null | undefined) => string | null;
  onError: (message: string) => void;
  onToast: (toast: { kind: "info" | "ok" | "err"; message: string }) => void;
}

export function useAiActions({
  session,
  linksQuery,
  getLinkDisplayLabel,
  normalizeCategoryName,
  onError,
  onToast
}: UseAiActionsOptions) {
  const [savingLinkId, setSavingLinkId] = useState<string | null>(null);
  const [bulkAiRunning, setBulkAiRunning] = useState(false);

  const requestAiAnalysis = useCallback(
    async (linkId: string): Promise<void> => {
      if (!session) {
        throw new Error("세션이 만료되었습니다. 다시 로그인해 주세요.");
      }
      const accessToken = await getFreshAccessToken();
      if (!accessToken) {
        throw new Error("인증이 만료되었습니다. 다시 로그인해 주세요.");
      }

      const response = await withTimeout(
        fetch(toApiUrl("/api/v1/ai/analyze-link"), {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({ linkId })
        }),
        REQUEST_TIMEOUT_MS,
        "AI 분석"
      );

      if (!response.ok) {
        const message = await parseResponseError(response);
        throw new Error(message);
      }
    },
    [session]
  );

  const runAiWithRetry = useCallback(
    async (linkId: string, retryCount = 1): Promise<void> => {
      let attempt = 0;
      while (true) {
        try {
          await requestAiAnalysis(linkId);
          return;
        } catch (error) {
          attempt += 1;
          const message = error instanceof Error ? error.message : String(error);
          const mayRetry =
            message.includes("요청 시간 초과") ||
            message.includes("Failed to fetch") ||
            message.includes("NetworkError") ||
            /\b429\b/.test(message) ||
            /\b5\d\d\b/.test(message);
          if (!mayRetry || attempt > retryCount) {
            throw error;
          }
          await new Promise((resolve) => setTimeout(resolve, 900));
        }
      }
    },
    [requestAiAnalysis]
  );

  const runAiEnrichmentInBackground = useCallback(
    async (link: Pick<LinkItem, "id" | "title" | "url">, options?: { silent?: boolean; refreshAfter?: boolean }) => {
      try {
        await runAiWithRetry(link.id, 1);
        if (!options?.silent) {
          onToast({ kind: "ok", message: `AI 분석 완료: ${getLinkDisplayLabel(link)}` });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        onError(`AI 자동 분석 실패: ${message}`);
        if (!options?.silent) {
          onToast({ kind: "err", message: `AI 분석 실패: ${getLinkDisplayLabel(link)} (재시도 가능)` });
        }
      } finally {
        if (options?.refreshAfter !== false) {
          await linksQuery.loadLinks({ silent: true, skipCounts: true });
        }
      }
    },
    [getLinkDisplayLabel, linksQuery, onError, onToast, runAiWithRetry]
  );

  const runAiAnalysis = useCallback(
    async (link: LinkItem) => {
      if (!session) {
        return;
      }

      setSavingLinkId(link.id);

      try {
        linksQuery.setLinks((prev) => prev.map((item) => (item.id === link.id ? { ...item, ai_state: "pending", ai_error: null } : item)));
        await runAiWithRetry(link.id, 1);

        await linksQuery.loadLinks({ silent: true });
        onToast({ kind: "ok", message: `AI 분석 완료: ${getLinkDisplayLabel(link)}` });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        onError(`AI 분석 실패: ${message}`);
        onToast({ kind: "err", message: `AI 분석 실패: ${getLinkDisplayLabel(link)}` });
        await linksQuery.loadLinks({ silent: true });
      } finally {
        setSavingLinkId(null);
      }
    },
    [getLinkDisplayLabel, linksQuery, onError, onToast, runAiWithRetry, session]
  );

  const runBulkAiForUncategorized = useCallback(async () => {
    if (!session || bulkAiRunning) {
      return;
    }

    setBulkAiRunning(true);

    try {
      const pageSize = 500;
      let page = 0;
      const targets: { id: string }[] = [];

      while (true) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        const { data, error } = await supabase
          .from("links")
          .select("id, category, ai_state")
          .is("deleted_at", null)
          .order("created_at", { ascending: true })
          .range(from, to);

        if (error) {
          throw error;
        }

        if (!data || data.length === 0) {
          break;
        }

        for (const row of data) {
          const category = normalizeCategoryName(row?.category);
          if (!category && row?.ai_state !== "pending" && typeof row?.id === "string") {
            targets.push({ id: row.id });
          }
        }

        if (data.length < pageSize) {
          break;
        }

        page += 1;
      }

      if (targets.length === 0) {
        onToast({ kind: "info", message: "미분류 링크가 없습니다." });
        return;
      }

      onToast({ kind: "info", message: `미분류 링크 AI 분석 시작 (${targets.length}건)` });

      let success = 0;
      let failed = 0;

      for (const target of targets) {
        linksQuery.setLinks((prev) => prev.map((item) => (item.id === target.id ? { ...item, ai_state: "pending", ai_error: null } : item)));
        try {
          await runAiWithRetry(target.id, 1);
          success += 1;
        } catch {
          failed += 1;
        }
      }

      await linksQuery.loadLinks({ silent: true });
      if (failed === 0) {
        onToast({ kind: "ok", message: `미분류 링크 AI 분석 완료 (${success}건)` });
      } else {
        onToast({ kind: "err", message: `일괄 AI 분석 완료: 성공 ${success}건, 실패 ${failed}건` });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      onError(`미분류 일괄 AI 실행 실패: ${message}`);
      onToast({ kind: "err", message: "미분류 일괄 AI 실행 실패" });
    } finally {
      setBulkAiRunning(false);
    }
  }, [bulkAiRunning, linksQuery, normalizeCategoryName, onError, onToast, runAiWithRetry, session]);

  return {
    savingLinkId,
    bulkAiRunning,
    runAiEnrichmentInBackground,
    runAiAnalysis,
    runBulkAiForUncategorized
  };
}

import { useCallback, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { LinkItem } from "../lib/types";

interface ImportArticleRow {
  url?: string;
  title?: string;
  notes?: string;
  press_raw?: string;
  date_raw?: string;
  date_iso?: string;
  date?: string;
  keywords?: string[];
  keywords_joined?: string;
  tags?: string[] | string;
}

interface UseImportExportActionsOptions {
  session: Session | null;
  autoAnalyzeOnImport: boolean;
  linksQuery: {
    loadLinks: (options?: { silent?: boolean; skipCounts?: boolean }) => Promise<void>;
  };
  syncLinkTags: (linkId: string, tagsRaw: string) => Promise<void>;
  runAiEnrichmentInBackground: (
    link: Pick<LinkItem, "id" | "title" | "url">,
    options?: { silent?: boolean; refreshAfter?: boolean }
  ) => Promise<void>;
  normalizeTags: (raw: string) => string[];
  parseUrlValid: (value: string) => boolean;
  buildImportFallbackUrl: (row: ImportArticleRow, index: number) => string;
  inferImportYear: (rows: ImportArticleRow[]) => number;
  resolveImportPublishedAt: (row: ImportArticleRow, fallbackYear: number) => string | null;
  parseImportKeywords: (row: ImportArticleRow) => string[];
  parseCsvRows: (text: string) => ImportArticleRow[];
  mapLinkRow: (row: any) => LinkItem;
  csvEscape: (value: unknown) => string;
  downloadTextFile: (filename: string, text: string, mimeType: string) => void;
  clearError: () => void;
  onError: (message: string) => void;
  onToast: (toast: { kind: "info" | "ok" | "err"; message: string }) => void;
  onImportFileInputReset: () => void;
}

export function useImportExportActions({
  session,
  autoAnalyzeOnImport,
  linksQuery,
  syncLinkTags,
  runAiEnrichmentInBackground,
  normalizeTags,
  parseUrlValid,
  buildImportFallbackUrl,
  inferImportYear,
  resolveImportPublishedAt,
  parseImportKeywords,
  parseCsvRows,
  mapLinkRow,
  csvEscape,
  downloadTextFile,
  clearError,
  onError,
  onToast,
  onImportFileInputReset
}: UseImportExportActionsOptions) {
  const [importingFile, setImportingFile] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<"" | "jsonl" | "csv">("");

  const fetchAllLinksForExport = useCallback(async (): Promise<LinkItem[]> => {
    if (!session) {
      return [];
    }

    const pageSize = 500;
    let page = 0;
    const result: LinkItem[] = [];

    while (true) {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      const { data, error } = await supabase
        .from("links")
        .select(
          "id, url, title, note, status, rating, is_favorite, category, summary, keywords, collection_id, ai_state, ai_error, published_at, created_at, deleted_at, collection:collections(id, name, color), link_tags(tag:tags(name))"
        )
        .is("deleted_at", null)
        .order("created_at", { ascending: true })
        .range(from, to);

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        break;
      }

      result.push(...data.map(mapLinkRow));
      if (data.length < pageSize) {
        break;
      }

      page += 1;
    }

    return result;
  }, [mapLinkRow, session]);

  const handleImportArticlesFile = useCallback(
    async (file: File): Promise<void> => {
      if (!session) {
        return;
      }

      setImportingFile(true);
      clearError();

      try {
        const text = await file.text();
        const trimmed = text.trim();
        const lowerName = file.name.toLowerCase();
        if (!trimmed) {
          onToast({ kind: "err", message: "빈 파일입니다." });
          return;
        }

        let rows: ImportArticleRow[] = [];
        if (lowerName.endsWith(".csv")) {
          rows = parseCsvRows(text);
        } else if (trimmed.startsWith("[")) {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            rows = parsed as ImportArticleRow[];
          }
        } else {
          rows = [];
          for (const line of trimmed.split(/\r?\n/)) {
            const rawLine = line.trim();
            if (!rawLine) {
              continue;
            }
            try {
              rows.push(JSON.parse(rawLine) as ImportArticleRow);
            } catch {
              // Skip malformed line.
            }
          }
        }

        if (rows.length === 0) {
          onToast({ kind: "err", message: "가져올 데이터가 없습니다." });
          return;
        }

        const inferredYear = inferImportYear(rows);
        let inserted = 0;
        let failed = 0;
        const importedLinksForAi: Array<Pick<LinkItem, "id" | "url" | "title">> = [];

        for (let i = 0; i < rows.length; i += 1) {
          const row = rows[i];
          const rawUrl = (row.url || "").trim();
          const resolvedUrl = parseUrlValid(rawUrl) ? rawUrl : buildImportFallbackUrl(row, i);
          const resolvedTitle = (row.title || "").trim() || `가져온 기사 #${i + 1}`;
          const publishedAt = resolveImportPublishedAt(row, inferredYear);
          const noteParts = [
            row.press_raw ? `출처: ${row.press_raw}` : "",
            row.date_iso ? `날짜: ${row.date_iso}` : row.date ? `날짜: ${row.date}` : row.date_raw ? `날짜: ${row.date_raw}` : "",
            row.notes ? `\n${row.notes}` : ""
          ].filter(Boolean);
          const importKeywords = parseImportKeywords(row);
          const importTagsRaw =
            Array.isArray(row.tags)
              ? row.tags.filter((item) => typeof item === "string")
              : typeof row.tags === "string"
                ? row.tags.split(",")
                : [];
          const importTags = normalizeTags([...importKeywords, ...importTagsRaw].join(", "));

          const { data, error }: { data: any; error: any } = await supabase
            .from("links")
            .insert([
              {
                user_id: session.user.id,
                url: resolvedUrl,
                title: resolvedTitle,
                note: noteParts.join("\n"),
                status: "unread",
                category: null,
                published_at: publishedAt,
                keywords: []
              }
            ])
            .select(
              "id, url, title, note, status, rating, is_favorite, category, summary, keywords, collection_id, ai_state, ai_error, published_at, created_at, deleted_at"
            )
            .single();

          if (error || !data?.id) {
            failed += 1;
            continue;
          }

          if (importTags.length > 0) {
            await syncLinkTags(data.id, importTags.join(", "));
          }

          inserted += 1;
          importedLinksForAi.push({
            id: data.id,
            url: data.url,
            title: data.title
          });
        }

        await linksQuery.loadLinks({ silent: true, skipCounts: true });
        if (autoAnalyzeOnImport && importedLinksForAi.length > 0) {
          void (async () => {
            for (const link of importedLinksForAi) {
              await runAiEnrichmentInBackground(link, { silent: true, refreshAfter: false });
            }
            await linksQuery.loadLinks({ silent: true });
            onToast({ kind: "ok", message: `가져온 기사 AI 보강 완료 (${importedLinksForAi.length}건)` });
          })();
        }
        onToast({
          kind: failed > 0 ? "info" : "ok",
          message: `가져오기 완료: 성공 ${inserted}건${failed > 0 ? `, 실패 ${failed}건` : ""}${autoAnalyzeOnImport && importedLinksForAi.length > 0 ? " · AI 보강 시작" : ""}`
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        onError(`파일 가져오기 실패: ${message}`);
        onToast({ kind: "err", message: "파일 형식을 확인해 주세요. (CSV/JSONL/JSON)" });
      } finally {
        setImportingFile(false);
        onImportFileInputReset();
      }
    },
    [
      autoAnalyzeOnImport,
      buildImportFallbackUrl,
      inferImportYear,
      linksQuery,
      normalizeTags,
      onError,
      onImportFileInputReset,
      onToast,
      parseCsvRows,
      parseImportKeywords,
      parseUrlValid,
      resolveImportPublishedAt,
      runAiEnrichmentInBackground,
      session,
      syncLinkTags
    ]
  );

  const handleExportLinks = useCallback(
    async (format: "jsonl" | "csv"): Promise<void> => {
      if (!session || exportingFormat) {
        return;
      }

      setExportingFormat(format);
      clearError();

      try {
        const rows = await fetchAllLinksForExport();
        if (rows.length === 0) {
          onToast({ kind: "info", message: "내보낼 링크가 없습니다." });
          return;
        }

        const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        if (format === "jsonl") {
          const jsonl = rows
            .map((item) =>
              JSON.stringify({
                url: item.url,
                title: item.title,
                notes: item.note,
                status: item.status,
                rating: item.rating,
                category: item.category,
                summary: item.summary,
                keywords: item.keywords,
                tags: item.tags,
                collection: item.collection?.name || null,
                published_at: item.published_at,
                created_at: item.created_at
              })
            )
            .join("\n");
          downloadTextFile(`linkpocket_export_${stamp}.jsonl`, jsonl, "application/x-ndjson;charset=utf-8");
        } else {
          const header = [
            "url",
            "title",
            "notes",
            "status",
            "rating",
            "category",
            "summary",
            "keywords_joined",
            "tags_joined",
            "collection",
            "published_at",
            "created_at"
          ];
          const lines = rows.map((item) =>
            [
              item.url,
              item.title || "",
              item.note || "",
              item.status,
              item.rating ?? "",
              item.category || "",
              item.summary || "",
              item.keywords.join(" | "),
              item.tags.join(" | "),
              item.collection?.name || "",
              item.published_at || "",
              item.created_at
            ]
              .map(csvEscape)
              .join(",")
          );
          const csv = [header.join(","), ...lines].join("\n");
          downloadTextFile(`linkpocket_export_${stamp}.csv`, csv, "text/csv;charset=utf-8");
        }

        onToast({ kind: "ok", message: `내보내기 완료 (${rows.length}건)` });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        onError(`내보내기 실패: ${message}`);
        onToast({ kind: "err", message: "내보내기 실패" });
      } finally {
        setExportingFormat("");
      }
    },
    [clearError, csvEscape, downloadTextFile, exportingFormat, fetchAllLinksForExport, onError, onToast, session]
  );

  return {
    importingFile,
    exportingFormat,
    handleImportArticlesFile,
    handleExportLinks
  };
}

import { useCallback, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { LinkItem } from "../lib/types";

interface LibraryStats {
  total: number;
  unread: number;
  reading: number;
  archived: number;
  favorite: number;
  aiDone: number;
  trash: number;
}

interface UseLinksQueryOptions {
  session: Session | null;
  showTrash: boolean;
  collectionFilter: string;
  categoryFilter: string;
  favoriteOnly: boolean;
  search: string;
  sortMode: "newest" | "oldest" | "rating";
  categoryBaseMenu: readonly string[];
  categoryFilterAliases: Record<string, string[]>;
  createEmptyCategoryCounts: () => Record<string, number>;
  mapLinkRow: (row: any) => LinkItem;
  getDateSortValue: (link: Pick<LinkItem, "published_at" | "created_at">) => number;
  onError: (message: string | null) => void;
}

export function useLinksQuery({
  session,
  showTrash,
  collectionFilter,
  categoryFilter,
  favoriteOnly,
  search,
  sortMode,
  categoryBaseMenu,
  categoryFilterAliases,
  createEmptyCategoryCounts,
  mapLinkRow,
  getDateSortValue,
  onError
}: UseLinksQueryOptions) {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [libraryStats, setLibraryStats] = useState<LibraryStats>({
    total: 0,
    unread: 0,
    reading: 0,
    archived: 0,
    favorite: 0,
    aiDone: 0,
    trash: 0
  });
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>(() => createEmptyCategoryCounts());
  const [loadingLinks, setLoadingLinks] = useState(false);

  const resetLinks = useCallback(() => {
    setLinks([]);
    setCategoryCounts(createEmptyCategoryCounts());
    setLibraryStats({
      total: 0,
      unread: 0,
      reading: 0,
      archived: 0,
      favorite: 0,
      aiDone: 0,
      trash: 0
    });
  }, [createEmptyCategoryCounts]);

  const loadLinks = useCallback(
    async (options?: { silent?: boolean; skipCounts?: boolean }) => {
      if (!session) {
        resetLinks();
        return;
      }

      const silent = options?.silent === true;
      const skipCounts = options?.skipCounts === true;

      if (!silent) {
        setLoadingLinks(true);
      }
      onError(null);

      try {
        let query = supabase
          .from("links")
          .select(
            "id, url, title, note, status, rating, is_favorite, category, summary, keywords, collection_id, ai_state, ai_error, published_at, created_at, deleted_at, collection:collections(id, name, color), link_tags(tag:tags(name))"
          );

        query = showTrash ? query.not("deleted_at", "is", null) : query.is("deleted_at", null);

        if (collectionFilter !== "all") {
          query = query.eq("collection_id", collectionFilter);
        }

        if (categoryFilter !== "all") {
          const aliases = categoryFilterAliases[categoryFilter] || [categoryFilter];
          query = aliases.length > 1 ? query.in("category", aliases) : query.eq("category", aliases[0]);
        }

        if (favoriteOnly) {
          query = query.eq("is_favorite", true);
        }

        const searchValue = search.trim();
        if (searchValue) {
          query = query.or(`url.ilike.%${searchValue}%,title.ilike.%${searchValue}%,note.ilike.%${searchValue}%`);
        }

        if (sortMode === "newest") {
          query = query.order("published_at", { ascending: false, nullsFirst: false });
          query = query.order("created_at", { ascending: false });
        }

        if (sortMode === "oldest") {
          query = query.order("published_at", { ascending: true, nullsFirst: false });
          query = query.order("created_at", { ascending: true });
        }

        if (sortMode === "rating") {
          query = query.order("rating", { ascending: false, nullsFirst: false });
          query = query.order("created_at", { ascending: false });
        }

        const countOnly = async (countQuery: any) => {
          const { count, error } = await countQuery;
          if (error) {
            throw error;
          }
          return count ?? 0;
        };

        const listPromise = query.limit(200);
        const statsPromise = skipCounts
          ? Promise.resolve<{
              total: number;
              unread: number;
              reading: number;
              archived: number;
              favorite: number;
              aiDone: number;
              trash: number;
              categoryCountValues: number[];
            } | null>(null)
          : (async () => {
              const fixedQueries = [
                countOnly(supabase.from("links").select("id", { count: "exact", head: true }).is("deleted_at", null)),
                countOnly(supabase.from("links").select("id", { count: "exact", head: true }).is("deleted_at", null).eq("status", "unread")),
                countOnly(supabase.from("links").select("id", { count: "exact", head: true }).is("deleted_at", null).eq("status", "reading")),
                countOnly(supabase.from("links").select("id", { count: "exact", head: true }).is("deleted_at", null).eq("status", "archived")),
                countOnly(supabase.from("links").select("id", { count: "exact", head: true }).is("deleted_at", null).eq("is_favorite", true)),
                countOnly(supabase.from("links").select("id", { count: "exact", head: true }).is("deleted_at", null).eq("ai_state", "success")),
                countOnly(supabase.from("links").select("id", { count: "exact", head: true }).not("deleted_at", "is", null))
              ] as const;

              const categoryCountQueries = categoryBaseMenu.map((category) => {
                const aliases = categoryFilterAliases[category] || [category];
                return countOnly(
                  supabase.from("links").select("id", { count: "exact", head: true }).is("deleted_at", null).in("category", aliases)
                );
              });

              const [fixedResults, categoryCountValues] = await Promise.all([Promise.all(fixedQueries), Promise.all(categoryCountQueries)]);
              const [total, unread, reading, archived, favorite, aiDone, trash] = fixedResults;
              return { total, unread, reading, archived, favorite, aiDone, trash, categoryCountValues };
            })();

        const [listResult, statsPayload] = await Promise.all([listPromise, statsPromise]);

        if (listResult.error) {
          onError(`링크 조회 실패: ${listResult.error.message}`);
          return;
        }

        if (statsPayload) {
          setLibraryStats({
            total: statsPayload.total,
            unread: statsPayload.unread,
            reading: statsPayload.reading,
            archived: statsPayload.archived,
            favorite: statsPayload.favorite,
            aiDone: statsPayload.aiDone,
            trash: statsPayload.trash
          });

          const nextCategoryCounts = createEmptyCategoryCounts();
          categoryBaseMenu.forEach((category, index) => {
            nextCategoryCounts[category] = statsPayload.categoryCountValues[index] ?? 0;
          });
          setCategoryCounts(nextCategoryCounts);
        }

        const mapped = (listResult.data || []).map(mapLinkRow);
        if (sortMode === "newest") {
          mapped.sort((a, b) => getDateSortValue(b) - getDateSortValue(a));
        } else if (sortMode === "oldest") {
          mapped.sort((a, b) => getDateSortValue(a) - getDateSortValue(b));
        }
        setLinks(mapped);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        onError(`링크 조회 실패: ${message}`);
      } finally {
        if (!silent) {
          setLoadingLinks(false);
        }
      }
    },
    [
      categoryBaseMenu,
      categoryFilter,
      categoryFilterAliases,
      collectionFilter,
      createEmptyCategoryCounts,
      favoriteOnly,
      getDateSortValue,
      mapLinkRow,
      onError,
      resetLinks,
      search,
      session,
      showTrash,
      sortMode
    ]
  );

  return {
    links,
    setLinks,
    libraryStats,
    categoryCounts,
    loadingLinks,
    loadLinks,
    resetLinks
  };
}

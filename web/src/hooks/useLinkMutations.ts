import { useCallback, useState } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Collection, LinkItem, LinkStatus } from "../lib/types";

interface LinkDraft {
  note: string;
  status: LinkStatus;
  rating: string;
  tags: string;
  collectionId: string;
}

interface UseLinkMutationsOptions {
  session: Session | null;
  linksQuery: {
    links: LinkItem[];
    setLinks: Dispatch<SetStateAction<LinkItem[]>>;
    loadLinks: (options?: { silent?: boolean; skipCounts?: boolean }) => Promise<void>;
  };
  collections: Collection[];
  draftsRef: MutableRefObject<Record<string, LinkDraft>>;
  setDrafts: Dispatch<SetStateAction<Record<string, LinkDraft>>>;
  normalizeTags: (raw: string) => string[];
  getLinkDraft: (link: LinkItem) => LinkDraft;
  isDraftDirty: (link: LinkItem, draft: LinkDraft) => boolean;
  parseRating: (value: string) => number | null;
  onError: (message: string) => void;
}

export function useLinkMutations({
  session,
  linksQuery,
  collections,
  draftsRef,
  setDrafts,
  normalizeTags,
  getLinkDraft,
  isDraftDirty,
  parseRating,
  onError
}: UseLinkMutationsOptions) {
  const [savingDraftLinkId, setSavingDraftLinkId] = useState<string | null>(null);

  const syncLinkTags = useCallback(
    async (linkId: string, tagsRaw: string): Promise<void> => {
      if (!session) {
        return;
      }

      const names = normalizeTags(tagsRaw);

      if (names.length > 0) {
        const upsertPayload = names.map((name) => ({
          user_id: session.user.id,
          name
        }));

        const { error: upsertError } = await supabase.from("tags").upsert(upsertPayload, {
          onConflict: "user_id,name",
          ignoreDuplicates: true
        });

        if (upsertError) {
          throw upsertError;
        }
      }

      const { data: tagRows, error: tagError } = names.length
        ? await supabase.from("tags").select("id, name").in("name", names)
        : { data: [], error: null };

      if (tagError) {
        throw tagError;
      }

      const tagIds = (tagRows || []).map((row: any) => row.id);

      const { error: deleteError } = await supabase.from("link_tags").delete().eq("link_id", linkId);
      if (deleteError) {
        throw deleteError;
      }

      if (tagIds.length > 0) {
        const rows = tagIds.map((tagId) => ({
          link_id: linkId,
          tag_id: tagId
        }));

        const { error: linkTagError } = await supabase.from("link_tags").insert(rows);
        if (linkTagError) {
          throw linkTagError;
        }
      }
    },
    [normalizeTags, session]
  );

  const saveDraftById = useCallback(
    async (linkId: string) => {
      if (!session) {
        return;
      }

      const link = linksQuery.links.find((item) => item.id === linkId);
      if (!link) {
        return;
      }

      const draft = draftsRef.current[linkId] || getLinkDraft(link);
      if (!isDraftDirty(link, draft)) {
        return;
      }

      const ratingValue = parseRating(draft.rating);
      setSavingDraftLinkId(linkId);

      try {
        const payload = {
          note: draft.note.trim() || null,
          status: draft.status,
          rating: ratingValue,
          collection_id: draft.collectionId || null
        };

        const { error } = await supabase.from("links").update(payload).eq("id", linkId);
        if (error) {
          throw error;
        }

        await syncLinkTags(linkId, draft.tags);

        const normalizedTags = normalizeTags(draft.tags);
        linksQuery.setLinks((prev) =>
          prev.map((item) =>
            item.id === linkId
              ? {
                  ...item,
                  note: payload.note,
                  status: draft.status,
                  rating: ratingValue,
                  collection_id: payload.collection_id,
                  collection: collections.find((collection) => collection.id === payload.collection_id) || null,
                  tags: normalizedTags
                }
              : item
          )
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        onError(`링크 수정 실패: ${message}`);
      } finally {
        setSavingDraftLinkId(null);
      }
    },
    [collections, draftsRef, getLinkDraft, isDraftDirty, linksQuery, normalizeTags, onError, parseRating, session, syncLinkTags]
  );

  const setLinkDeleted = useCallback(
    async (linkId: string, deleted: boolean) => {
      const { error } = await supabase
        .from("links")
        .update({ deleted_at: deleted ? new Date().toISOString() : null })
        .eq("id", linkId);

      if (error) {
        onError(`삭제/복원 실패: ${error.message}`);
        return;
      }

      await linksQuery.loadLinks();
    },
    [linksQuery, onError]
  );

  const toggleFavorite = useCallback(
    async (link: LinkItem) => {
      const { error } = await supabase.from("links").update({ is_favorite: !link.is_favorite }).eq("id", link.id);

      if (error) {
        onError(`즐겨찾기 변경 실패: ${error.message}`);
        return;
      }

      linksQuery.setLinks((prev) => prev.map((item) => (item.id === link.id ? { ...item, is_favorite: !item.is_favorite } : item)));
    },
    [linksQuery, onError]
  );

  const markLinkAsRead = useCallback(
    async (linkId: string) => {
      if (!session) {
        return;
      }

      linksQuery.setLinks((prev) => prev.map((item) => (item.id === linkId && item.status === "unread" ? { ...item, status: "reading" } : item)));
      setDrafts((prev) => {
        const current = prev[linkId];
        if (!current || current.status !== "unread") {
          return prev;
        }
        return {
          ...prev,
          [linkId]: {
            ...current,
            status: "reading"
          }
        };
      });

      const { error } = await supabase.from("links").update({ status: "reading" }).eq("id", linkId).eq("status", "unread");

      if (error) {
        onError(`읽음 상태 변경 실패: ${error.message}`);
        await linksQuery.loadLinks();
      }
    },
    [linksQuery, onError, session, setDrafts]
  );

  return {
    savingDraftLinkId,
    syncLinkTags,
    saveDraftById,
    setLinkDeleted,
    toggleFavorite,
    markLinkAsRead
  };
}

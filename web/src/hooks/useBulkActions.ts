import { useCallback, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { supabase } from "../lib/supabase";
import type { LinkItem } from "../lib/types";

interface UseBulkActionsOptions {
  visibleLinks: LinkItem[];
  linksQuery: {
    setLinks: Dispatch<SetStateAction<LinkItem[]>>;
    loadLinks: (options?: { silent?: boolean; skipCounts?: boolean }) => Promise<void>;
  };
  onError: (message: string) => void;
  onToast: (toast: { kind: "ok" | "info" | "err"; message: string }) => void;
  selectedLinkId: string | null;
  setSelectedLinkId: (value: string | null) => void;
}

export function useBulkActions({
  visibleLinks,
  linksQuery,
  onError,
  onToast,
  selectedLinkId,
  setSelectedLinkId
}: UseBulkActionsOptions) {
  const [selectedLinkIds, setSelectedLinkIds] = useState<string[]>([]);

  const visibleLinkIds = useMemo(() => visibleLinks.map((item) => item.id), [visibleLinks]);
  const selectedVisibleIds = useMemo(() => visibleLinkIds.filter((id) => selectedLinkIds.includes(id)), [selectedLinkIds, visibleLinkIds]);
  const selectedVisibleCount = selectedVisibleIds.length;
  const allVisibleSelected = visibleLinks.length > 0 && selectedVisibleCount === visibleLinks.length;

  const toggleSelectLink = useCallback((linkId: string) => {
    setSelectedLinkIds((prev) => (prev.includes(linkId) ? prev.filter((id) => id !== linkId) : [...prev, linkId]));
  }, []);

  const toggleSelectAllVisible = useCallback((allSelected: boolean, visibleIds: string[]) => {
    if (visibleIds.length === 0) {
      return;
    }

    setSelectedLinkIds((prev) => {
      if (allSelected) {
        return prev.filter((id) => !visibleIds.includes(id));
      }
      const merged = new Set(prev);
      for (const id of visibleIds) {
        merged.add(id);
      }
      return Array.from(merged);
    });
  }, []);

  const bulkUpdateStatus = useCallback(
    async (targetStatus: "unread" | "reading", targetIds: string[]) => {
      if (targetIds.length === 0) {
        return;
      }

      const { error } = await supabase.from("links").update({ status: targetStatus }).in("id", targetIds).is("deleted_at", null);
      if (error) {
        onError(`일괄 상태 변경 실패: ${error.message}`);
        return;
      }

      linksQuery.setLinks((prev) =>
        prev.map((item) =>
          targetIds.includes(item.id)
            ? {
                ...item,
                status: targetStatus
              }
            : item
        )
      );
      setSelectedLinkIds((prev) => prev.filter((id) => !targetIds.includes(id)));
      await linksQuery.loadLinks({ silent: true });
      onToast({ kind: "ok", message: `${targetIds.length}건을 ${targetStatus === "reading" ? "읽음" : "안읽음"}으로 변경했습니다.` });
    },
    [linksQuery, onError, onToast]
  );

  const bulkDeleteLinks = useCallback(
    async (targetIds: string[]) => {
      if (targetIds.length === 0) {
        return;
      }

      const confirmed = window.confirm(`선택한 링크 ${targetIds.length}건을 삭제할까요?`);
      if (!confirmed) {
        return;
      }

      const { error } = await supabase.from("links").update({ deleted_at: new Date().toISOString() }).in("id", targetIds).is("deleted_at", null);
      if (error) {
        onError(`일괄 삭제 실패: ${error.message}`);
        return;
      }

      setSelectedLinkIds((prev) => prev.filter((id) => !targetIds.includes(id)));
      await linksQuery.loadLinks({ silent: true });
      onToast({ kind: "ok", message: `${targetIds.length}건을 삭제했습니다.` });
    },
    [linksQuery, onError, onToast]
  );

  const restoreDeletedLinks = useCallback(
    async (targetIds: string[]) => {
      if (targetIds.length === 0) {
        return;
      }

      const { error } = await supabase.from("links").update({ deleted_at: null }).in("id", targetIds).not("deleted_at", "is", null);
      if (error) {
        onError(`일괄 복원 실패: ${error.message}`);
        return;
      }

      setSelectedLinkIds((prev) => prev.filter((id) => !targetIds.includes(id)));
      if (selectedLinkId && targetIds.includes(selectedLinkId)) {
        setSelectedLinkId(null);
      }
      await linksQuery.loadLinks({ silent: true });
      onToast({ kind: "ok", message: `${targetIds.length}건을 복원했습니다.` });
    },
    [linksQuery, onError, onToast, selectedLinkId, setSelectedLinkId]
  );

  const permanentlyDeleteLinks = useCallback(
    async (targetIds: string[]) => {
      if (targetIds.length === 0) {
        return;
      }

      const confirmed = window.confirm(`선택한 휴지통 기사 ${targetIds.length}건을 영구 삭제할까요?\n이 작업은 되돌릴 수 없습니다.`);
      if (!confirmed) {
        return;
      }

      const { error } = await supabase.from("links").delete().in("id", targetIds);
      if (error) {
        onError(`영구 삭제 실패: ${error.message}`);
        return;
      }

      setSelectedLinkIds((prev) => prev.filter((id) => !targetIds.includes(id)));
      if (selectedLinkId && targetIds.includes(selectedLinkId)) {
        setSelectedLinkId(null);
      }
      await linksQuery.loadLinks({ silent: true });
      onToast({ kind: "ok", message: `${targetIds.length}건을 영구 삭제했습니다.` });
    },
    [linksQuery, onError, onToast, selectedLinkId, setSelectedLinkId]
  );

  return {
    selectedLinkIds,
    setSelectedLinkIds,
    visibleLinkIds,
    selectedVisibleIds,
    selectedVisibleCount,
    allVisibleSelected,
    toggleSelectLink,
    toggleSelectAllVisible,
    bulkUpdateStatus,
    bulkDeleteLinks,
    restoreDeletedLinks,
    permanentlyDeleteLinks
  };
}

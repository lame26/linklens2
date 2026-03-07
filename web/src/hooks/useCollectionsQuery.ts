import { useCallback, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Collection } from "../lib/types";

interface UseCollectionsQueryOptions {
  session: Session | null;
  onError: (message: string) => void;
}

export function useCollectionsQuery({ session, onError }: UseCollectionsQueryOptions) {
  const [collections, setCollections] = useState<Collection[]>([]);

  const resetCollections = useCallback(() => {
    setCollections([]);
  }, []);

  const loadCollections = useCallback(async () => {
    if (!session) {
      setCollections([]);
      return;
    }

    const { data, error } = await supabase.from("collections").select("id, name, color").order("name", { ascending: true });

    if (error) {
      onError(`컬렉션 조회 실패: ${error.message}`);
      return;
    }

    setCollections((data || []) as Collection[]);
  }, [onError, session]);

  return {
    collections,
    setCollections,
    resetCollections,
    loadCollections
  };
}

"use client";

import { useCallback, useState } from "react";

// Which documents a single chat searches.
// null = the whole library (default for new chats). A list = only these documents.
export function useChatScope(initial: string[] | null, readyIds: string[]) {
  const [ids, setIds] = useState<string[] | null>(initial);

  // Adding a document switches the chat from "all" to a specific list
  const add = useCallback(
    (id: string) =>
      setIds((prev) => (prev?.includes(id) ? prev : [...(prev ?? []), id])),
    [],
  );
  const toggle = useCallback(
    (id: string) =>
      setIds((prev) => {
        if (prev === null) return readyIds.filter((readyId) => readyId !== id);
        return prev.includes(id)
          ? prev.filter((selectedId) => selectedId !== id)
          : [...prev, id];
      }),
    [readyIds],
  );
  const remove = useCallback(
    (id: string) => setIds((prev) => (prev ?? []).filter((x) => x !== id)),
    [],
  );
  const selectAll = useCallback(() => setIds(null), []);
  const selectNone = useCallback(() => setIds([]), []);

  return { ids, add, toggle, remove, selectAll, selectNone };
}
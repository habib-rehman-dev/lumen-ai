"use client";

import { useCallback, useState } from "react";

// Which documents a single chat searches.
// null = the whole library (default for new chats). A list = only these documents.
export function useChatScope(initial: string[] | null) {
  const [ids, setIds] = useState<string[] | null>(initial);

  // Adding a document switches the chat from "all" to a specific list
  const add = useCallback(
    (id: string) => setIds((prev) => (prev?.includes(id) ? prev : [...(prev ?? []), id])),
    [],
  );
  const remove = useCallback(
    (id: string) => setIds((prev) => (prev ?? []).filter((x) => x !== id)),
    [],
  );
  const selectAll = useCallback(() => setIds(null), []);

  return { ids, add, remove, selectAll };
}
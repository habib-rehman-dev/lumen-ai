"use client";

import { createContext, useContext, useMemo, useState } from "react";

import { useDocuments } from "@/hooks/use-documents";

type SelectionContext = {
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  selectAll: () => void;
  selectNone: () => void;
  selectedCount: number;
  // Exactly what the backend expects: null = all ready docs, array = only these
  documentIds: string[] | null;
};

const Ctx = createContext<SelectionContext | null>(null);

export function DocumentSelectionProvider({ children }: { children: React.ReactNode }) {
  const { data: docs } = useDocuments();
  // We store what the user UNCHECKED, so new uploads are selected automatically
  const [deselected, setDeselected] = useState<Set<string>>(new Set());

  const value = useMemo<SelectionContext>(() => {
    const readyIds = (docs ?? []).filter((d) => d.status === "ready").map((d) => d.id);
    const selected = readyIds.filter((id) => !deselected.has(id));

    return {
      isSelected: (id) => !deselected.has(id),
      toggle: (id) =>
        setDeselected((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        }),
      selectAll: () => setDeselected(new Set()),
      selectNone: () => setDeselected(new Set(readyIds)),
      selectedCount: selected.length,
      documentIds: selected.length === readyIds.length ? null : selected,
    };
  }, [docs, deselected]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDocumentSelection() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDocumentSelection must be used inside DocumentSelectionProvider");
  return ctx;
}
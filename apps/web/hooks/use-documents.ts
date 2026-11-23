"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deleteDocument, listDocuments, uploadDocument } from "@/lib/api";
import { qk } from "@/lib/query-keys";

export function useDocuments() {
  return useQuery({
    queryKey: qk.documents,
    queryFn: listDocuments,
    // Poll every 2 s while any file is still processing; stop when all are done
    refetchInterval: (query) =>
      query.state.data?.some((d) => d.status === "pending") ? 2000 : false,
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.documents }),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.documents }),
  });
}
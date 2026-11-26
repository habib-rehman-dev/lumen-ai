"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deleteChat, getChat, listChats, updateChat } from "@/lib/api";
import { qk } from "@/lib/query-keys";

// Sidebar list of chats
export function useChats() {
  return useQuery({ queryKey: qk.chats, queryFn: listChats });
}

export function useChatDetail(id: string | null) {
  return useQuery({
    queryKey: qk.chat(id ?? ""),
    queryFn: () => getChat(id!),
    enabled: !!id,
    // Never reuse an old copy when reopening a chat, so its saved documents are current
    gcTime: 0,
    staleTime: 0,
  });
}
export function useDeleteChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteChat,
    // Refresh the sidebar list after a delete
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.chats }),
  });
}


export function useUpdateChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { pinned?: boolean; title?: string } }) =>
      updateChat(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.chats }),
  });
}

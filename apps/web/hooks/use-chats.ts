"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deleteChat, getChat, listChats } from "@/lib/api";
import { qk } from "@/lib/query-keys";

// Sidebar list of chats
export function useChats() {
  return useQuery({ queryKey: qk.chats, queryFn: listChats });
}

// One chat with its messages (used when opening an old chat in F3)
export function useChatDetail(id: string | null) {
  return useQuery({
    queryKey: qk.chat(id ?? ""),
    queryFn: () => getChat(id!),
    enabled: !!id,  // don't fetch for a new chat
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
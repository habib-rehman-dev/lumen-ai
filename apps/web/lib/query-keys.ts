export const qk = {
  documents: ["documents"] as const,
  chats: ["chats"] as const,
  chat: (id: string) => ["chats", id] as const,
};
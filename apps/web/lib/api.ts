export type DocumentItem = {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  status: "pending" | "ready" | "failed" | "deleting";
  error: string | null;
  created_at: string;
};

export type Citation = {
  index: number;
  document_id: string;
  filename: string;
  page: string | null;
  snippet: string;
  score: number;
};

export type ChatSummary = {
  id: string; title: string; created_at: string; updated_at: string;
  document_ids: string[] | null;   // null = this chat uses the whole library
};
export type ChatDetail = ChatSummary & {
  messages: {
    id: string;
    role: "user" | "assistant";
    content: string;
    citations: Citation[] | null;
  }[];
};

// Turns FastAPI errors ({"detail": "..."}) into normal JS errors with a readable message
async function check(res: Response) {
  if (res.ok) return res;
  const body = await res.json().catch(() => null);
  throw new Error(typeof body?.detail === "string" ? body.detail : `Request failed (${res.status})`);
}

// ---- Documents ----
export const listDocuments = async (): Promise<DocumentItem[]> =>
  (await check(await fetch("/api/documents"))).json();

export async function uploadDocument(
  file: File,
): Promise<{ document: DocumentItem; duplicate: boolean }> {
  const form = new FormData();
  form.append("file", file); // the backend expects the field name "file"
  const res = await check(await fetch("/api/documents", { method: "POST", body: form }));
  // Backend: 201 = new file, 200 = this exact file was already uploaded
  return { document: await res.json(), duplicate: res.status === 200 };
}

export const deleteDocument = async (id: string) => {
  await check(await fetch(`/api/documents/${id}`, { method: "DELETE" }));
};

// ---- Chats ----
export const listChats = async (): Promise<ChatSummary[]> =>
  (await check(await fetch("/api/chats"))).json();

export const getChat = async (id: string): Promise<ChatDetail> =>
  (await check(await fetch(`/api/chats/${id}`))).json();

export const deleteChat = async (id: string) => {
  await check(await fetch(`/api/chats/${id}`, { method: "DELETE" }));
};


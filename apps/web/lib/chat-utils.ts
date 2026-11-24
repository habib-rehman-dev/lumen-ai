import type { UIMessage } from "ai";

// Joins all text parts of a message into one string
export function getMessageText(message: UIMessage): string {
  return message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}
// Turns raw error text into something a user can read
export function friendlyError(raw: string | undefined): string {
    if (!raw) return "Please try again.";
    const text = raw.trim();
    // A whole HTML page means the request never reached our API (e.g. a missing route)
    if (text.startsWith("<")) {
        return "The chat service couldn't be reached. Please try again in a moment.";
    }
    // FastAPI errors look like {"detail": "..."}
    try {
        const detail = JSON.parse(text)?.detail;
        if (typeof detail === "string") return detail;
    } catch {
        /* not JSON, use the text as is */
    }
    return text.length > 200 ? `${text.slice(0, 200)}…` : text;
}


import type { Citation } from "@/lib/api";

// Reads the sources that the backend attached to a message (the "data-citations" part)
export function getMessageCitations(message: UIMessage): Citation[] {
  const part = message.parts.find((p) => p.type === "data-citations");
  return part && "data" in part ? (part.data as Citation[]) : [];
}
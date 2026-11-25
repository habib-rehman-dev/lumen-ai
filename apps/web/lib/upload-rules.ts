// Keep in sync with the backend (SUPPORTED_EXTENSIONS and max_upload_mb)
export const ACCEPT_EXTENSIONS = [".pdf", ".docx", ".txt", ".md", ".csv"];
export const MAX_UPLOAD_MB = 25;

// Returns what is wrong with the file, or null when it is fine
export function validateUpload(file: File): string | null {
  const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();
  if (!ACCEPT_EXTENSIONS.includes(ext)) {
    return `unsupported type (use ${ACCEPT_EXTENSIONS.join(", ")})`;
  }
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return `larger than ${MAX_UPLOAD_MB} MB`;
  return null;
}
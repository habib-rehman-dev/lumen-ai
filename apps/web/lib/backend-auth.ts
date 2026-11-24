import "server-only";

// Server-to-server call to FastAPI's account endpoints. The key never reaches the browser.
export function backendAuth(path: "/auth/register" | "/auth/verify", body: object) {
  return fetch(`${process.env.BACKEND_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Key": process.env.INTERNAL_API_KEY!,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
}
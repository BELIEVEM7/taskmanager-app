export async function api(url: string, method = "GET", body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  // Session expired: go to login. Auth routes are excluded because
  // a wrong password on /api/auth/login also returns 401.
  if (res.status === 401 && !url.startsWith("/api/auth/")) {
    window.location.href = "/login";
    throw new Error("Your session has expired. Please log in again.");
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? "Something went wrong");
  return data;
}
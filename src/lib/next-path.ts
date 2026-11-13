const SAFE_NEXT = /^\/(?!\/)[A-Za-z0-9\-._~!$&'()*+,;=:@%/?#[\]]*$/;

/**
 * Only same-site admin paths are accepted as a post-login destination, so a
 * crafted `?next=` cannot bounce a signed-in owner to another origin.
 */
export function safeNextPath(value: unknown, fallback = "/admin"): string {
  if (typeof value !== "string") return fallback;
  if (!SAFE_NEXT.test(value)) return fallback;
  return value.startsWith("/admin") ? value : fallback;
}

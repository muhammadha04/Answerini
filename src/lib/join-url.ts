/** Build the shareable join URL for a game PIN. */
export function getJoinUrl(pin: string, origin?: string): string {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/join?pin=${encodeURIComponent(pin)}`;
}

/** Ensure short links work in QR codes and copy. */
export function normalizeShortLink(link: string): string {
  const trimmed = link.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function formatShortLinkDisplay(link: string): string {
  return link.trim().replace(/^https?:\/\//i, "");
}

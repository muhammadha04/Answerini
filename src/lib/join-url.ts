/** Build the shareable join URL for a game PIN. */
export function getJoinUrl(pin: string, origin?: string): string {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/join?pin=${encodeURIComponent(pin)}`;
}

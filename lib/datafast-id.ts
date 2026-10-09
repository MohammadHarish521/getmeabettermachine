const VISITOR_RE = /^[A-Za-z0-9_-]{8,128}$/;

export function datafastVisitorId(raw: string | undefined | null) {
  if (!raw) return null;
  const value = raw.trim();
  return VISITOR_RE.test(value) ? value : null;
}

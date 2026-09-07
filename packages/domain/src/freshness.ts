import type { FreshnessMetadata } from './types.ts';
export function freshness(now = Date.now(), ttl = 30_000, known = true): FreshnessMetadata {
  return { observedAt: known ? new Date(now).toISOString() : null, fetchedAt: new Date(now).toISOString(), staleAt: new Date(now + ttl).toISOString(), slot: null, commitment: null, state: known ? 'fresh' : 'unknown' };
}
export function isStale(f: FreshnessMetadata, now = Date.now()): boolean { return f.state === 'stale' || now >= Date.parse(f.staleAt); }
export function ageLabel(f: FreshnessMetadata, now = Date.now()): string {
  if (!f.observedAt) return 'Observation time unknown';
  const seconds = Math.max(0, Math.floor((now - Date.parse(f.observedAt))/1000));
  return `${isStale(f, now) ? 'Stale · ' : ''}Observed ${seconds < 60 ? `${seconds}s` : `${Math.floor(seconds/60)}m`} ago`;
}

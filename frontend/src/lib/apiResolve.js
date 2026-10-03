// Backend endpoint resolution for MajiSmart web app.
// Production incident: the deployed bundle pointed at a dead backend host
// (majismartv2.onrender.com) while the live API was qmel — every login hung
// until the 30s axios timeout. This module picks a WORKING backend by probing
// /api/health across ordered candidates, so a stale env var or dead host can
// never brick the app again.
//
// Pure functions (no window/axios imports) so they are unit-testable in Node.

export const LIVE_BACKENDS = [
  'https://majismartv2-qmel.onrender.com',
  'https://majismartv2.onrender.com',
];

export const HEALTH_TIMEOUT_MS = 8000;
export const WINNER_STORAGE_KEY = 'ms_api_url';

export function withApiSuffix(u) {
  const clean = String(u || '').trim().replace(/\/+$/, '');
  if (!clean) return clean;
  return clean.endsWith('/api') ? clean : clean + '/api';
}

// Ordered candidates: cached winner first (proven working), then explicit env,
// then localhost for dev, then known live backends. De-duplicated.
export function candidateBaseUrls({ envUrl, cachedUrl, isLocalhost } = {}) {
  const out = [];
  const seen = new Set();
  const push = (u) => {
    if (!u) return;
    const n = withApiSuffix(u);
    if (!n || seen.has(n)) return;
    seen.add(n);
    out.push(n);
  };
  push(cachedUrl);
  push(envUrl);
  if (isLocalhost) push('http://localhost:5000');
  LIVE_BACKENDS.forEach(push);
  return out;
}

// Probe candidates in order; return first whose probe resolves true.
// `probe(url)` must resolve true/false (never throw — wrap if unsure).
// `dead` is an optional Set of urls to skip (hosts that just failed).
// Falls back to candidates[0] when nothing responds (backend may be
// cold-starting; a real request is still worth attempting).
export async function pickWorkingBase({ candidates, probe, dead } = {}) {
  const list = Array.isArray(candidates) ? candidates : [];
  for (const url of list) {
    if (dead && dead.has(url)) continue;
    try {
      // eslint-disable-next-line no-await-in-loop
      const ok = await probe(url);
      if (ok) return url;
    } catch (e) {
      // treat throw as failure
    }
  }
  return list[0] || null;
}

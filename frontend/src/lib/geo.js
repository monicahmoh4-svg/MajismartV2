// Shared geolocation: permission-aware GPS + reverse-geocoded place names
// + Google Maps (embed needs no API key). Pure functions are unit-tested;
// browser access is injected so Node tests can stub it.

export const GEO_TIMEOUT_MS = 15000;

// Ask the OS/browser for a position. Resolves { lat, lng, accuracy }.
// Rejects with DENIED (user/blocked — includes how to re-enable),
// UNAVAILABLE (no fix) or TIMEOUT. Never resolves silently-wrong data.
export function getPosition({ timeout = GEO_TIMEOUT_MS, geo = null } = {}) {
  const nav = geo || (typeof navigator !== 'undefined' ? navigator : null);
  return new Promise((resolve, reject) => {
    if (!nav || !nav.geolocation) {
      reject({ code: 'UNSUPPORTED', message: 'Geolocation is not supported on this device or browser.' });
      return;
    }
    nav.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords || {};
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          reject({ code: 'UNAVAILABLE', message: 'The location fix was empty. Try again outdoors with a clear sky view.' });
          return;
        }
        resolve({ lat: latitude, lng: longitude, accuracy: accuracy ?? null });
      },
      (err) => {
        const code = err && err.code;
        if (code === 1) {
          reject({
            code: 'DENIED',
            message: 'Location permission was denied. Tap the lock/tune icon in the address bar → Location → Allow, then try again.',
          });
        } else if (code === 2) {
          reject({ code: 'UNAVAILABLE', message: 'No position fix. Turn on device location (GPS) and try again with a clear sky view.' });
        } else {
          reject({ code: 'TIMEOUT', message: 'Location timed out. Check signal and try again.' });
        }
      },
      { enableHighAccuracy: true, timeout, maximumAge: 60000 }
    );
  });
}

// Optional pre-check so UI can explain BEFORE the browser prompt appears.
export async function permissionState({ permissions = null } = {}) {
  try {
    const perms = permissions || (typeof navigator !== 'undefined' ? navigator.permissions : null);
    if (!perms || !perms.query) return 'unknown';
    const s = await perms.query({ name: 'geolocation' });
    return s.state; // 'granted' | 'prompt' | 'denied'
  } catch (e) {
    return 'unknown';
  }
}

function firstString(...vals) {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
}

// BigDataCloud free client reverse-geocode (no key, CORS-enabled).
export function parseBigDataCloud(d) {
  if (!d || typeof d !== 'object') return null;
  const name = firstString(d.locality, d.city, d.localityInfo?.administrative?.[0]?.name);
  const area = firstString(
    d.localityInfo?.administrative?.[1]?.name,
    d.principalSubdivision,
    d.locality
  );
  const country = firstString(d.countryName, d.countryCode);
  if (!name && !area && !country) return null;
  return {
    name: name || area || 'Located point',
    details: [area && area !== name ? area : null, country].filter(Boolean).join(', ') || null,
    countyGuess: firstString(d.city, d.locality, d.principalSubdivision),
    country,
    source: 'bigdatacloud',
  };
}

// OSM Nominatim fallback (usage-policy friendly: single call per user tap).
export function parseNominatim(d) {
  const a = (d && d.address) || null;
  if (!a && !d?.display_name) return null;
  const name = firstString(
    a?.suburb, a?.neighbourhood, a?.village, a?.town, a?.city, a?.county,
    d?.name
  );
  const details = firstString(
    [a?.county, a?.state, a?.country].filter(Boolean).join(', '),
    d?.display_name?.split(',').slice(0, 3).join(',')
  );
  if (!name && !details) return null;
  return {
    name: name || 'Located point',
    details,
    countyGuess: firstString(a?.county, a?.state),
    country: firstString(a?.country),
    source: 'nominatim',
  };
}

// Resolve lat/lng -> { name, details, countyGuess, country, source }.
// fetchImpl injectable for tests. Throws { code:'GEOCODE_FAILED' } when all
// providers fail (caller keeps raw coordinates in that case).
export async function reverseGeocode(lat, lng, { fetchImpl = null } = {}) {
  const f = fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
  if (!f) throw { code: 'GEOCODE_FAILED', message: 'No network fetch available.' };
  const errors = [];
  try {
    const r = await f(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    if (r.ok) {
      const parsed = parseBigDataCloud(await r.json());
      if (parsed) return parsed;
    } else {
      errors.push('bigdatacloud:' + r.status);
    }
  } catch (e) {
    errors.push('bigdatacloud:' + (e.message || 'network'));
  }
  try {
    const r = await f(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=14`,
      { headers: { Accept: 'application/json' } }
    );
    if (r.ok) {
      const parsed = parseNominatim(await r.json());
      if (parsed) return parsed;
    } else {
      errors.push('nominatim:' + r.status);
    }
  } catch (e) {
    errors.push('nominatim:' + (e.message || 'network'));
  }
  throw { code: 'GEOCODE_FAILED', message: 'Place lookup failed (' + errors.join(', ') + '). Coordinates still usable.' };
}

// Keyless Google Maps surfaces.
export function googleMapsEmbedUrl(lat, lng, zoom = 15) {
  return `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
}
export function googleMapsLink(lat, lng) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

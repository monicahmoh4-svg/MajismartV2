// GIS dispatch core: rank verified field staff for a job. Pure functions
// (no DB) so pairing is unit-testable; routes supply the rows.

function haversineKm(aLat, aLng, bLat, bLng) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function openJobsFor(openByName, staff) {
  const keys = [staff.name, staff.email, staff.id].filter(Boolean).map((v) => String(v).toLowerCase());
  for (const k of keys) {
    if (openByName[k] !== undefined) return openByName[k];
  }
  return 0;
}

// Rank candidates. GPS tier: staff with base coords, nearest first (beyond
// 2 km the distance gap must be decisive, else least-loaded wins).
// County tier (lat/lng null): least-loaded verified staff in the county.
// Over-capacity (>= 10 open jobs) staff are never matched.
function rankStaff(staff, openByName, lat, lng) {
  const withLoad = staff.map((s) => ({
    ...s,
    distance_km:
      lat != null && lng != null && s.base_latitude != null && s.base_longitude != null
        ? Math.round(haversineKm(Number(lat), Number(lng), Number(s.base_latitude), Number(s.base_longitude)) * 10) / 10
        : null,
    open_jobs: openByName ? openJobsFor(openByName, s) : 0,
  }));
  const eligible = withLoad.filter((s) => s.open_jobs < 10);
  const geo = lat != null && lng != null
    ? eligible.filter((s) => s.distance_km != null)
    : [];
  const pool = geo.length ? geo : eligible;
  pool.sort((a, b) => {
    if (a.distance_km != null && b.distance_km != null && Math.abs(a.distance_km - b.distance_km) > 2) {
      return a.distance_km - b.distance_km;
    }
    return a.open_jobs - b.open_jobs;
  });
  return { ranked: pool, method: geo.length ? 'gps' : 'county' };
}

module.exports = { haversineKm, rankStaff };

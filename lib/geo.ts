// UK + EU/EEA are geo-restricted (FishHaven not offered there yet). Best-effort:
// based on the edge-provided country header; unknown country is allowed (documented).
const BLOCKED = new Set([
  "GB", // United Kingdom
  // EU-27
  "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT",
  "LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE",
  // EEA extras
  "IS","LI","NO",
]);

export function isRegionBlocked(country?: string | null): boolean {
  return !!country && BLOCKED.has(country.toUpperCase());
}

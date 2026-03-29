import { chicagoRailPlaces, TransitPlace } from '../data/chicagoRailPlaces';
import { SelectedPlace } from '../types/transit';
import { scoreMatch, tiebreaker } from '../utils/search';
import { searchExternalPlaces as searchExternalPlacesService } from './externalPlaceSearch';

const MAX_RESULTS = 20;
const MAX_CITY_ONLY_RESULTS = 5; // cap low-quality city-only matches
const CITY_MATCH_THRESHOLD = 15; // scores at or below this are "city only"

// ─── Local Transit Search ────────────────────────────────────────────────────

export function searchLocalTransitPlaces(query: string): SelectedPlace[] {
  const q = query.trim();
  if (!q) return [];

  type Scored = { place: TransitPlace; score: number; tb: number };
  const scored: Scored[] = [];

  for (const place of chicagoRailPlaces) {
    const s = scoreMatch(q, place.name, place.aliases, place.lineCodes, place.city);
    if (s > 0) {
      const tb = tiebreaker(place.name, place.agency, place.lineCodes?.length);
      scored.push({ place, score: s, tb });
    }
  }

  // Sort: primary score desc, then tiebreaker desc, then name alpha
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.tb !== a.tb) return b.tb - a.tb;
    return a.place.name.localeCompare(b.place.name);
  });

  // Cap city-only matches so "Chicago" doesn't flood with 200+ results
  let cityOnlyCount = 0;
  const filtered: Scored[] = [];
  for (const entry of scored) {
    if (entry.score <= CITY_MATCH_THRESHOLD) {
      cityOnlyCount++;
      if (cityOnlyCount > MAX_CITY_ONLY_RESULTS) continue;
    }
    filtered.push(entry);
    if (filtered.length >= MAX_RESULTS) break;
  }

  // Convert and deduplicate same-name stations
  return deduplicateResults(filtered.map(({ place }) => transitPlaceToSelected(place)));
}

/**
 * Get popular/default stations shown when search is empty.
 */
export function getDefaultStations(): SelectedPlace[] {
  const defaultNames = [
    'Chicago Union Station',
    'Chicago OTC',
    'Millennium Station',
    'LaSalle Street',
    'Clark/Lake',
    'Fullerton',
    'Belmont',
    "O'Hare",
    'Midway',
    'Roosevelt',
  ];

  const results: SelectedPlace[] = [];
  const seen = new Set<string>();
  for (const target of defaultNames) {
    const tl = target.toLowerCase();
    const place = chicagoRailPlaces.find(
      (p) => p.name.toLowerCase() === tl || p.name.toLowerCase().startsWith(tl)
    );
    if (place && !seen.has(place.id)) {
      seen.add(place.id);
      results.push(transitPlaceToSelected(place));
    }
  }
  return results;
}

// ─── External Fallback ───────────────────────────────────────────────────────

// Score threshold: if best local result is at or above this, local results
// are "strong" and we skip the external API call entirely.
const STRONG_LOCAL_THRESHOLD = 80; // contains-in-name tier or better

/**
 * Determine if local results are strong enough to skip external search.
 */
function hasStrongLocalMatch(localResults: SelectedPlace[], query: string): boolean {
  if (localResults.length >= 5) return true;
  if (localResults.length === 0) return false;

  // Re-score the top result to check quality
  const top = localResults[0];
  const topScore = scoreMatch(
    query,
    top.label,
    undefined, // aliases not on SelectedPlace, but name match is enough
    top.lineCodes,
    undefined
  );
  return topScore >= STRONG_LOCAL_THRESHOLD;
}

// ─── Unified Search ──────────────────────────────────────────────────────────

/**
 * Main search entry point.
 * Returns local results immediately. Calls external only when local is weak.
 * Accepts AbortSignal so the caller can cancel stale requests.
 */
export async function searchPlaces(
  query: string,
  signal?: AbortSignal
): Promise<SelectedPlace[]> {
  const q = query.trim();
  if (!q) return [];

  const localResults = searchLocalTransitPlaces(q);

  // Skip external if local results are strong enough
  if (hasStrongLocalMatch(localResults, q)) {
    return localResults;
  }

  // Only hit external for queries >= 3 chars to avoid noise
  if (q.length < 3) return localResults;

  try {
    const externalResults = await searchExternalPlacesService(q, signal);
    if (signal?.aborted) return localResults;

    // Merge: local first, then external (deduped by id)
    const seen = new Set(localResults.map((r) => r.id));
    const merged = [...localResults];
    for (const ext of externalResults) {
      if (!seen.has(ext.id)) {
        merged.push(ext);
        seen.add(ext.id);
      }
    }
    return merged.slice(0, MAX_RESULTS);
  } catch {
    // External failed — degrade gracefully to local-only
    return localResults;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function transitPlaceToSelected(place: TransitPlace): SelectedPlace {
  return {
    id: place.id,
    label: place.name,
    locationName: place.name,
    address: formatSubtitle(place),
    latitude: place.latitude,
    longitude: place.longitude,
    source: 'local_rail',
    agency: place.agency,
    mode: place.mode,
    kind: place.kind,
    sourceStopId: place.sourceStopId,
    lineCodes: place.lineCodes,
  };
}

/**
 * Build a concise subtitle that differentiates same-name stations.
 * Examples:
 *   "CTA · Red"
 *   "CTA · Blue, Brown, Purple"
 *   "Metra · BNSF"
 */
function formatSubtitle(place: TransitPlace): string {
  const parts: string[] = [];
  if (place.agency) parts.push(place.agency);
  if (place.lineCodes?.length) {
    parts.push(place.lineCodes.join(', '));
  }
  if (parts.length > 0) return parts.join(' · ');
  return place.city ?? '';
}

/**
 * Merge same-name results that a user can't meaningfully distinguish.
 * For same-name, same-agency results, keep the one serving more lines.
 * For same-name across agencies (CTA vs Metra), keep both — they're
 * different physical stations.
 */
function deduplicateResults(results: SelectedPlace[]): SelectedPlace[] {
  const out: SelectedPlace[] = [];
  const seen = new Map<string, number>(); // "name|agency" → index in out

  for (const result of results) {
    const key = `${result.label.toLowerCase()}|${result.agency ?? ''}`;
    const existingIdx = seen.get(key);

    if (existingIdx !== undefined) {
      const existing = out[existingIdx];
      // Merge line codes into the one already in results
      const existingLines = new Set(existing.lineCodes ?? []);
      const newLines = result.lineCodes ?? [];
      let changed = false;
      for (const lc of newLines) {
        if (!existingLines.has(lc)) {
          existingLines.add(lc);
          changed = true;
        }
      }
      if (changed) {
        existing.lineCodes = Array.from(existingLines).sort();
        existing.address = formatMergedSubtitle(existing.agency, existing.lineCodes);
      }
      // Skip adding this duplicate
    } else {
      seen.set(key, out.length);
      out.push({ ...result }); // shallow copy so merges don't mutate originals
    }
  }

  return out;
}

function formatMergedSubtitle(
  agency: string | undefined,
  lineCodes: string[] | undefined
): string {
  const parts: string[] = [];
  if (agency) parts.push(agency);
  if (lineCodes?.length) parts.push(lineCodes.join(', '));
  return parts.join(' · ');
}

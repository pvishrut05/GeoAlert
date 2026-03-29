import Constants from 'expo-constants';
import { SelectedPlace } from '../types/transit';

// ─── Config ──────────────────────────────────────────────────────────────────
// Mapbox access token is read from app.json extra. Never hardcoded.
// If the token is missing, every function silently returns [].

function getToken(): string | null {
  try {
    return (
      (Constants.expoConfig?.extra as any)?.mapboxAccessToken ??
      (Constants.expoConfig?.extra as any)?.MAPBOX_ACCESS_TOKEN ??
      null
    );
  } catch {
    return null;
  }
}

// Chicago bias for relevance
const PROXIMITY = '-87.6298,41.8781'; // lng,lat (Mapbox uses lng,lat order)
const SEARCH_LIMIT = 8;
const FETCH_TIMEOUT_MS = 6000;

// ─── Mapbox Geocoding v5 ─────────────────────────────────────────────────────
// Uses the forward geocoding endpoint which returns coordinates directly.
// No separate "detail" call needed (unlike Google Places).

interface MapboxFeature {
  id: string;
  text: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
}

/**
 * Search places via Mapbox Geocoding API.
 *
 * Intentionally fail-soft:
 * - missing token → []
 * - network error → []
 * - non-200 response → []
 * - malformed payload → []
 * - abort/cancel → []
 * Never throws into the calling layer.
 */
export async function searchExternalPlaces(
  query: string,
  signal?: AbortSignal
): Promise<SelectedPlace[]> {
  try {
    const token = getToken();
    if (!token) return [];

    const q = query.trim();
    if (!q) return [];

    const encoded = encodeURIComponent(q);
    const url =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json` +
      `?access_token=${token}` +
      `&proximity=${PROXIMITY}` +
      `&limit=${SEARCH_LIMIT}` +
      `&language=en` +
      `&types=poi,address,place,neighborhood,locality`;

    // Race the fetch against a timeout so a slow network doesn't hang the UI
    const resp = await fetchWithTimeout(url, FETCH_TIMEOUT_MS, signal);
    if (!resp || !resp.ok) return [];

    const data = await resp.json().catch(() => null);
    if (!data?.features?.length) return [];

    return normalizeFeatures(data.features);
  } catch {
    // Catch-all: abort errors, JSON parse errors, anything unexpected.
    // The contract is: external search never breaks the caller.
    return [];
  }
}

/** Returns true if a Mapbox token is configured. */
export function isExternalSearchAvailable(): boolean {
  return getToken() !== null;
}

// ─── Internals ───────────────────────────────────────────────────────────────

function normalizeFeatures(features: MapboxFeature[]): SelectedPlace[] {
  const results: SelectedPlace[] = [];

  for (const f of features) {
    try {
      if (!f.center || f.center.length < 2) continue;
      const [lng, lat] = f.center;
      if (typeof lat !== 'number' || typeof lng !== 'number') continue;

      // Extract a clean short name and address from Mapbox's place_name.
      // place_name is typically "Name, Address, City, State, Country"
      const name = f.text || f.place_name?.split(',')[0] || 'Unknown';
      const address = extractAddress(f.place_name, name);

      results.push({
        id: `mbx-${f.id}`,
        label: name,
        locationName: name,
        address,
        latitude: lat,
        longitude: lng,
        source: 'external_api',
        sourcePlaceId: f.id,
      });
    } catch {
      // Skip malformed features, keep going
      continue;
    }
  }

  return results;
}

/** Remove the leading name from place_name to get just the address portion. */
function extractAddress(placeName: string | undefined, name: string): string {
  if (!placeName) return '';
  // place_name: "Millennium Park, 201 E Randolph St, Chicago, Illinois 60601, United States"
  // We want: "201 E Randolph St, Chicago, Illinois"
  const afterName = placeName.startsWith(name)
    ? placeName.slice(name.length).replace(/^[,\s]+/, '')
    : placeName;
  // Trim trailing country for brevity
  return afterName.replace(/,\s*United States$/i, '').trim();
}

/** Fetch with a timeout. Returns null on timeout instead of throwing. */
async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
  signal?: AbortSignal
): Promise<Response | null> {
  const controller = new AbortController();

  // If the caller provided a signal, abort our controller when it fires
  if (signal) {
    if (signal.aborted) return null;
    signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resp = await fetch(url, { signal: controller.signal });
    return resp;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

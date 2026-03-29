// Conversion between miles and meters.
// Radius is stored internally in meters (what geofence APIs expect).
// UI displays miles (user-facing).

const METERS_PER_MILE = 1609.344;

export function milesToMeters(miles: number): number {
  return Math.round(miles * METERS_PER_MILE);
}

export function metersToMiles(meters: number): number {
  return meters / METERS_PER_MILE;
}

/** Format meters as a user-friendly miles string. */
export function formatRadiusMiles(meters: number): string {
  const miles = metersToMiles(meters);
  if (miles < 0.095) return `${Math.round(meters)}m`; // fallback for very small
  return `${miles.toFixed(1)} mi`;
}

// Slider operates in miles. These define the range.
export const RADIUS_MIN_MILES = 0.1;
export const RADIUS_MAX_MILES = 1.0;
export const RADIUS_STEP_MILES = 0.05;
export const RADIUS_DEFAULT_MILES = 0.1;

// Pre-computed meter equivalents for the boundaries
export const RADIUS_MIN_METERS = milesToMeters(RADIUS_MIN_MILES);
export const RADIUS_MAX_METERS = milesToMeters(RADIUS_MAX_MILES);
export const RADIUS_DEFAULT_METERS = milesToMeters(RADIUS_DEFAULT_MILES);

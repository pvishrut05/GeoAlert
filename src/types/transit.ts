// Re-export the auto-generated TransitPlace type from the dataset
export type { TransitPlace } from '../data/chicagoRailPlaces';

// Normalized place model used by alarm forms and the location picker.
// Designed to unify local transit data and future external API results.
export type PlaceSource = 'local_rail' | 'local_bus' | 'external_api' | 'recent';

export interface SelectedPlace {
  id: string;
  label: string;
  locationName: string;
  address?: string;
  latitude: number;
  longitude: number;
  source: PlaceSource;
  agency?: 'CTA' | 'Metra';
  mode?: 'rail' | 'bus';
  kind?: 'station' | 'stop';
  sourceStopId?: string;
  lineCodes?: string[];
}

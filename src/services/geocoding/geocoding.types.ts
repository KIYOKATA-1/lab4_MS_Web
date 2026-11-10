export interface GeocodingLocation {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  feature_code?: string;
  country_code?: string;
  country_id?: number;
  country?: string;
  timezone?: string;
  population?: number;
  postcodes?: string[];
  admin1?: string;
  admin2?: string;
  admin3?: string;
  admin4?: string;
  admin1_id?: number;
  admin2_id?: number;
  admin3_id?: number;
  admin4_id?: number;
}

export interface GeocodingResponse {
  results?: GeocodingLocation[];
  generationtime_ms?: number;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocatedCity extends Coordinates {
  name: string;
  country?: string;
  country_code?: string;
}

export interface LocationSearchResponse extends GeocodingResponse {
  location: LocatedCity;
}

export interface GeocodingErrorResponse {
  error: string;
}

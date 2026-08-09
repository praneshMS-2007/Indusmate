/**
 * The industrial corridor this build covers.
 *
 * The creation form asks for a city name, not coordinates — nobody types
 * latitude into a form on a shop floor. Coordinates are looked up here so the
 * map in Block 5 gets correct positions for free.
 */
export const CITIES = {
  Gwalior: { lat: 26.2183, lng: 78.1828 },
  Malanpur: { lat: 26.3547, lng: 78.2831 },
  Banmore: { lat: 26.4074, lng: 78.1923 },
  Morena: { lat: 26.4963, lng: 78.0009 },
  Pithampur: { lat: 22.6013, lng: 75.6858 },
  Indore: { lat: 22.7196, lng: 75.8577 },
  Dewas: { lat: 22.9676, lng: 76.0534 },
  Mandideep: { lat: 23.0993, lng: 77.5205 },
  Bhopal: { lat: 23.2599, lng: 77.4126 },
  Jabalpur: { lat: 23.1815, lng: 79.9864 },
} as const;

export type CityName = keyof typeof CITIES;

export const CITY_NAMES = Object.keys(CITIES) as CityName[];

export function isCity(value: unknown): value is CityName {
  return typeof value === "string" && value in CITIES;
}

export function cityCoords(name: CityName) {
  return CITIES[name];
}

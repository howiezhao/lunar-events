/**
 * Event locations.
 *
 * Stored coordinates are WGS84 decimal degrees, matching browser geolocation,
 * RFC 5545 GEO, and the geo: URI used by Apple Calendar. Map links pass
 * coordinate=gps so Amap converts WGS84 to GCJ-02 itself.
 */

import type { EventLocation } from './lunar';

export interface LocationDraft {
  name: string;
  latitude: string;
  longitude: string;
}

/** Decimal degrees without trailing zeros. Safe for ICS and map URLs. */
export function formatCoord(value: number): string {
  const text = (Math.round(value * 1e6) / 1e6).toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
  return text === '-0' ? '0' : text;
}

export function formatCoordinates(latitude: number, longitude: number): string {
  return `${formatCoord(latitude)}, ${formatCoord(longitude)}`;
}

/**
 * Read a pasted coordinate pair.
 * Accepts "纬度, 经度". If the first number cannot be a latitude and the
 * second can, treats the pair as Amap order "经度, 纬度".
 */
export function splitCoordinatePaste(value: string): { latitude: string; longitude: string } | null {
  const trimmed = value.trim();
  if (!/[,，\s]/.test(trimmed)) return null;

  const numbers = trimmed.match(/-?\d+(?:\.\d+)?/g);
  if (!numbers || numbers.length < 2) return null;

  let [latitude, longitude] = numbers;
  const first = Number(latitude);
  const second = Number(longitude);
  if (!Number.isFinite(first) || !Number.isFinite(second)) return null;
  if (Math.abs(first) > 90 && Math.abs(second) <= 90) {
    [latitude, longitude] = [longitude, latitude];
  }
  return { latitude, longitude };
}

/** Validate the form fields. An empty draft means the event has no location. */
export function locationFromDraft(draft: LocationDraft): { location?: EventLocation; error?: string } {
  const name = draft.name.trim();
  const latText = draft.latitude.trim();
  const lonText = draft.longitude.trim();

  if (!latText && !lonText) {
    return name ? { location: { name } } : {};
  }
  if (!latText || !lonText) {
    return { error: '请同时填写纬度和经度' };
  }

  const latitude = Number(latText);
  const longitude = Number(lonText);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { error: '经纬度须为数字' };
  }
  if (latitude < -90 || latitude > 90) {
    return { error: '纬度需在 -90 到 90 之间' };
  }
  if (longitude < -180 || longitude > 180) {
    return { error: '经度需在 -180 到 180 之间' };
  }

  return {
    location: {
      name,
      coordinates: { latitude, longitude },
    },
  };
}

/** Drop missing or hand-edited values that are not a usable place. */
export function normalizeLocation(location: unknown): EventLocation | undefined {
  if (!location || typeof location !== 'object') return undefined;

  const record = location as {
    name?: unknown;
    coordinates?: { latitude?: unknown; longitude?: unknown };
  };
  const name = typeof record.name === 'string' ? record.name.trim() : '';
  const latitude = record.coordinates?.latitude;
  const longitude = record.coordinates?.longitude;
  const hasCoordinates =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 && latitude <= 90 &&
    longitude >= -180 && longitude <= 180;

  if (!name && !hasCoordinates) return undefined;
  return hasCoordinates ? { name, coordinates: { latitude, longitude } } : { name };
}

/** Amap link for a place name, or a WGS84 pin when coordinates exist. */
export function locationMapUrl(location: unknown): string | null {
  const normalized = normalizeLocation(location);
  if (!normalized) return null;

  if (normalized.coordinates) {
    const { latitude, longitude } = normalized.coordinates;
    const params = new URLSearchParams({
      position: `${formatCoord(longitude)},${formatCoord(latitude)}`,
      name: normalized.name || formatCoordinates(latitude, longitude),
      src: 'lunar-events',
      coordinate: 'gps',
      callnative: '0',
    });
    return `https://uri.amap.com/marker?${params.toString()}`;
  }

  const params = new URLSearchParams({
    keyword: normalized.name,
    src: 'lunar-events',
    view: 'map',
  });
  return `https://uri.amap.com/search?${params.toString()}`;
}

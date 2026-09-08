import type { BranchGroup, BranchItem } from '@/types/whitelabel';

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Distancia en km entre dos puntos lat/lng (fórmula de Haversine). */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * true si `item` trae coordenadas reales. El backend no manda `null`
 * para las sedes sin coordenadas cargadas — manda `lat: 0, lng: 0`
 * ("null island", en el Atlántico) — así que `!= null` no alcanza para
 * filtrarlas.
 */
export function hasValidCoordinates(item: BranchItem): item is BranchItem & { lat: number; lng: number } {
  return item.lat != null && item.lng != null && (item.lat !== 0 || item.lng !== 0);
}

/**
 * Sede más cercana a `userLat`/`userLng` entre todas las del árbol.
 * Ignora sedes sin coordenadas reales (ver `hasValidCoordinates`).
 * Devuelve `null` si ninguna sede del árbol tiene coordenadas.
 */
export function findNearestBranch(
  branchTree: BranchGroup[],
  userLat: number,
  userLng: number
): BranchItem | null {
  let nearest: BranchItem | null = null;
  let nearestDistance = Infinity;

  for (const group of branchTree) {
    for (const item of group.items) {
      if (!hasValidCoordinates(item)) continue;
      const distance = haversineDistanceKm(userLat, userLng, item.lat, item.lng);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = item;
      }
    }
  }

  return nearest;
}

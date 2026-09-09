import { axiosRequest } from '../axiosRequest';
import type { Envelope } from '@/types/whitelabel';

const GET_LOCATIONS = '/api/utilities/get-locations';
const CALCULATE_DELIVERY = (lat: number, lng: number, branchId: number) =>
  `/api/utilities/calculate-delivery/${lat}/${lng}/${branchId}`;

/** Shape real de `GET /api/utilities/get-locations?q=` — verificado contra el backend. */
export type LocationSuggestion = {
  name: string;
  display_name: string;
  lat: string;
  lng: string;
};

/**
 * Autocomplete de direcciones (proxy de Nominatim/OpenStreetMap — mismo
 * proveedor que ya usa `BranchMapModal`, sin API key).
 */
export async function getLocations(
  query: string,
  options?: { signal?: AbortSignal }
): Promise<LocationSuggestion[]> {
  const envelope = await axiosRequest<Envelope<LocationSuggestion[]>>({
    method: 'GET',
    url: `${GET_LOCATIONS}?q=${encodeURIComponent(query)}`,
    signal: options?.signal,
  });
  return envelope.data ?? [];
}

/**
 * Costo de envío por distancia. El endpoint depende de que exista un
 * carrito válido en el backend para esa sede (por eso `CheckoutEntregaStep`
 * llama `mergeLocalCart` justo antes) y de que la sede tenga una regla de
 * envío configurada para esa distancia — si no la tiene, rechaza con un
 * error genérico. `null` significa "no se pudo cotizar" (sin regla, sede
 * sin coordenadas, o error de red) — quien llama debe caer a un fallback
 * ("se coordina por WhatsApp"), nunca bloquear el checkout por esto.
 *
 * No se pudo confirmar en vivo la forma exacta de una respuesta EXITOSA
 * (el entorno de prueba solo tenía sedes sin regla de envío configurada) —
 * se parsea de forma defensiva contra los nombres de campo más probables.
 */
export async function calculateDeliveryFee(
  lat: number,
  lng: number,
  branchId: number,
  options?: { signal?: AbortSignal }
): Promise<number | null> {
  try {
    const envelope = await axiosRequest<Envelope<Record<string, unknown> | number>>({
      method: 'GET',
      url: CALCULATE_DELIVERY(lat, lng, branchId),
      signal: options?.signal,
    });
    const data = envelope.data;
    if (typeof data === 'number') return data;
    if (data && typeof data === 'object') {
      const amount = data.qty_delivery_amount ?? data.amount ?? data.qty_delivery ?? data.delivery_fee;
      const parsed = Number(amount);
      if (Number.isFinite(parsed)) return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

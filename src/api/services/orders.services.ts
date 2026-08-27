import { axiosRequest } from '../axiosRequest';
import type { FulfillmentType } from '@/types/cart';
import type { Envelope } from '@/types/whitelabel';

const CREATE = '/api/orders/create';

export type CreateOrderPayload = {
  branch_id: number;
  fulfillment_type: FulfillmentType;
  /** Requerido si fulfillment_type === 'DELIVERY'. */
  address?: string;
  /** Requerido si fulfillment_type === 'DELIVERY' (lat/lng del punto). */
  lat?: number;
  lng?: number;
  /** ID de método de pago (requerido en modo Full, opcional en Lite). */
  payment_method_id?: number;
  /** Referencia del pago (transfer, Zelle, etc). */
  payment_reference?: string;
  /** Comentarios adicionales del cliente. */
  comments?: string;
  /** ID de location guardada (si el delivery viene de /locations). */
  location_id?: number;
  /** Productos: mínimo 1. */
  products: Array<{ tx_slug: string; qty_product: number }>;
  /** Datos de contacto (modo Lite los pide en pantalla). */
  contact?: {
    tx_name: string;
    tx_phone: string;
    tx_email?: string;
    tx_id_number?: string;
  };
};

/** Respuesta del backend al crear una orden. */
export type CreateOrderResponse = {
  tx_order_number: string;
  total?: number;
  message?: string;
};

/**
 * POST /api/orders/create
 * Devuelve el número de orden para mostrar en la pantalla de éxito.
 */
export async function createOrder(
  payload: CreateOrderPayload
): Promise<CreateOrderResponse> {
  const envelope = await axiosRequest<Envelope<CreateOrderResponse>>({
    method: 'POST',
    url: CREATE,
    data: payload,
  });
  return (
    envelope.data ?? {
      tx_order_number: '',
    }
  );
}

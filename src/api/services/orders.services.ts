import { axiosRequest } from '../axiosRequest';
import type { FulfillmentType } from '@/types/cart';
import type { Order, OrderDetail } from '@/types/orders';
import type { Envelope, Pagination } from '@/types/whitelabel';
import { toQueryString } from '@/utils/queryParams';

const CREATE = '/api/orders/create';
const MY_ORDERS = (branch: number) => `/api/orders/my-orders/branch/${branch}`;
const DETAIL = (txOrderNumber: string) => `/api/orders/detail/${txOrderNumber}`;

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

/* ============================================================
 * "Mis órdenes" (MY-ORDERS-MODULE.md)
 * ============================================================ */

export type GetMyOrdersParams = {
  branch: number;
  page?: number;
  signal?: AbortSignal;
};

export type PaginatedOrders = {
  items: Order[];
  pagination: Pagination;
};

/**
 * GET /api/orders/my-orders/branch/:branch?page=N
 * Lista paginada de órdenes del usuario logueado en esa sede.
 */
export async function getMyOrders(
  params: GetMyOrdersParams
): Promise<PaginatedOrders> {
  const qs: Record<string, string | number> = { page: params.page ?? 1 };
  const envelope = await axiosRequest<
    Envelope<Order[]> & { pagination?: Pagination }
  >({
    method: 'GET',
    url: `${MY_ORDERS(params.branch)}${toQueryString(qs)}`,
    signal: params.signal,
  });
  return {
    items: envelope.data ?? [],
    pagination: envelope.pagination ?? {},
  };
}

/**
 * GET /api/orders/detail/:txOrderNumber
 * Detalle completo de una orden (productos, totales, stepper).
 */
export async function getOrderDetail(
  txOrderNumber: string,
  signal?: AbortSignal
): Promise<OrderDetail> {
  const envelope = await axiosRequest<Envelope<OrderDetail>>({
    method: 'GET',
    url: DETAIL(txOrderNumber),
    signal,
  });
  return envelope.data;
}

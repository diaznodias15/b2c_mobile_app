import { axiosRequest } from '../axiosRequest';
import type { FulfillmentType } from '@/types/cart';
import type { Order, OrderDetail, PaymentMethodCode } from '@/types/orders';
import type { Envelope, Pagination } from '@/types/whitelabel';
import { toQueryString } from '@/utils/queryParams';

const CREATE = '/api/orders/create';
const MY_ORDERS = (branch: number) => `/api/orders/my-orders/branch/${branch}`;
const DETAIL = (txOrderNumber: string) => `/api/orders/detail/${txOrderNumber}`;

/**
 * Shape real de `POST /api/orders/create` (CHECKOUT-FLOW.md §8.1) — la
 * versión anterior de este type (`payment_method_id`, `address`,
 * `contact`) era una suposición hecha antes de tener este documento y
 * NO coincide con los nombres de campo reales del backend. Se corrige
 * acá antes de que el checkout Full dependiera de ella.
 *
 * `is_lite`/`tx_payment_method: 'EXPRESS'`/`fulfillment_type: 'PICKUP'`
 * fijos es el payload MÍNIMO real del modo Lite (§12.2) — no pide
 * nombre/teléfono/dirección en el submit (eso ya lo tiene el backend
 * del usuario autenticado). Los campos de pago y de destinatario son
 * opcionales acá porque solo aplican en modo Full.
 */
export type CreateOrderPayload = {
  branch_id: number;
  fulfillment_type: FulfillmentType;
  tx_delivery_mode: 'EXPRESS';
  tx_payment_method: PaymentMethodCode;
  /** 0 si PICKUP o si el subtotal supera `qty_free_delivery_threshold`. */
  qty_delivery_amount: number;
  tx_currency_code: 'Bs.' | 'USD.';
  /** 1 en el checkout Lite, ausente/0 en Full. */
  is_lite?: 0 | 1;

  // Datos del método de pago — solo Full, varían según `tx_payment_method` (§6.1).
  tx_country_code?: '+58';
  tx_area_code?: string;
  /** Teléfono del PAGADOR (PAGOMOVIL) — no confundir con el del destinatario. */
  tx_phone_number?: string;
  tx_payment_reference?: string;
  /** "YYYY-MM-DD". */
  dt_payment_date?: string;
  /** Solo ZELLE. */
  tx_depositor_name?: string;
  amt_payment_amount?: number;
  /** Solo PAGOMOVIL/TRANSFERENCIA. */
  cod_bank_origin?: string;

  // Datos del destinatario — solo si fulfillment_type === 'DELIVERY' (§7).
  dt_delivery_date?: string;
  tx_recipient_name?: string;
  tx_recipient_address?: string;
  tx_recipient_aditional_info?: string;
  tx_recipient_country_code?: '+58';
  tx_recipient_area_code?: string;
  tx_recipient_phone_number?: string;

  /** Productos: mínimo 1. */
  products: Array<{ tx_slug: string; qty_product: number }>;
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

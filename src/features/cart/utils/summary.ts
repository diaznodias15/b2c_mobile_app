import type { CartItem } from '@/types/cart';
import type { CreateOrderPayload } from '@/api/services/orders.services';
import type { PaymentMethod } from '@/types/cart';

function parsePrice(raw: string | null | undefined): number {
  if (!raw) return 0;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : 0;
}

/** Suma de (qty × pri_product_final_price) sobre los items. */
export function subtotal(items: CartItem[]): number {
  return items.reduce(
    (acc, it) => acc + parsePrice(it.pri_product_final_price) * it.qty,
    0
  );
}

/** Cantidad de items (suma de qty, no líneas). */
export function totalQty(items: CartItem[]): number {
  return items.reduce((acc, it) => acc + it.qty, 0);
}

/** Cantidad de líneas (productos distintos). */
export function totalLines(items: CartItem[]): number {
  return items.length;
}

/**
 * Calcula el delivery fee. Por ahora hardcodeado a 0 (no
 * tenemos `calculate-delivery` resuelto en Fase 4A). En 4B se
 * reemplaza por la llamada al endpoint.
 */
export function deliveryFee(_items: CartItem[]): number {
  return 0;
}

export function total(
  items: CartItem[],
  delivery = deliveryFee(items)
): number {
  return subtotal(items) + delivery;
}

export type CartSummary = {
  subtotal: number;
  delivery: number;
  total: number;
  qty: number;
  lines: number;
};

export function buildSummary(items: CartItem[]): CartSummary {
  return {
    subtotal: subtotal(items),
    delivery: deliveryFee(items),
    total: total(items),
    qty: totalQty(items),
    lines: totalLines(items),
  };
}

/* ============================================================
 * Order payload builder
 * ============================================================ */

export type BuildOrderPayloadInput = {
  branchId: number;
  items: CartItem[];
  fulfillment: 'PICKUP' | 'DELIVERY';
  deliveryAddress?: { tx_address: string; lat?: number; lng?: number } | null;
  paymentMethod?: PaymentMethod | null;
  paymentReference?: string;
  comments?: string;
  contact?: { tx_name: string; tx_phone: string; tx_email?: string; tx_id_number?: string } | null;
};

/**
 * Construye el payload de `POST /api/orders/create` a partir del
 * estado del cart + checkout store. Si falta algo crítico, lanza.
 */
export function buildOrderPayload(
  input: BuildOrderPayloadInput
): CreateOrderPayload {
  if (input.items.length === 0) {
    throw new Error('El carrito está vacío');
  }
  if (!input.fulfillment) {
    throw new Error('Elegí un método de entrega');
  }
  if (input.fulfillment === 'DELIVERY' && !input.deliveryAddress) {
    throw new Error('Ingresá una dirección de entrega');
  }

  const payload: CreateOrderPayload = {
    branch_id: input.branchId,
    fulfillment_type: input.fulfillment,
    products: input.items.map((i) => ({
      tx_slug: i.tx_slug,
      qty_product: i.qty,
    })),
  };

  if (input.fulfillment === 'DELIVERY' && input.deliveryAddress) {
    payload.address = input.deliveryAddress.tx_address;
    if (input.deliveryAddress.lat != null) payload.lat = input.deliveryAddress.lat;
    if (input.deliveryAddress.lng != null) payload.lng = input.deliveryAddress.lng;
  }

  if (input.paymentMethod) {
    payload.payment_method_id = input.paymentMethod.id;
  }

  if (input.paymentReference && input.paymentReference.trim().length > 0) {
    payload.payment_reference = input.paymentReference.trim();
  }

  if (input.comments && input.comments.trim().length > 0) {
    payload.comments = input.comments.trim();
  }

  if (input.contact) {
    payload.contact = input.contact;
  }

  return payload;
}

import type { CartItem } from '@/types/cart';

/**
 * Stock de un ítem del carrito.
 *
 * `qty_availability` es el stock disponible de la sede: lo trae el carrito del
 * servidor (`GET /api/cart/items/branch/:id`, = existencias − reservado) y, para
 * ítems de invitado, se toma de `qty_product` del producto al agregarlo. Es
 * opcional porque los carritos persistidos antes de este campo no lo tienen:
 * sin dato no se bloquea nada (el backend igual valida al crear la orden).
 */
export function getAvailableUnits(item: Pick<CartItem, 'qty_availability'>): number | null {
  const available = item.qty_availability;
  return typeof available === 'number' && Number.isFinite(available) ? Math.max(0, available) : null;
}

/** Cantidad máxima permitida en el stepper: el stock, o `fallbackMax` si no se conoce. */
export function getMaxQuantity(
  item: Pick<CartItem, 'qty_availability'>,
  fallbackMax: number
): number {
  const available = getAvailableUnits(item);
  return available === null ? fallbackMax : Math.max(1, available);
}

/** `true` si el cliente pidió más unidades de las que hay disponibles. */
export function hasStockIssue(item: Pick<CartItem, 'qty' | 'qty_availability'>): boolean {
  const available = getAvailableUnits(item);
  return available !== null && available < item.qty;
}

/**
 * Cantidad a guardar al sumar `toAdd` a lo que ya hay (`current`), sin pasar
 * del stock conocido. Con stock desconocido no se limita.
 */
export function clampToAvailability(
  current: number,
  toAdd: number,
  availability: number | null | undefined
): { qty: number; capped: boolean } {
  const wanted = current + toAdd;
  if (typeof availability !== 'number' || !Number.isFinite(availability)) {
    return { qty: wanted, capped: false };
  }
  const limit = Math.max(1, Math.floor(availability));
  return wanted > limit ? { qty: Math.max(current, limit), capped: true } : { qty: wanted, capped: false };
}

/**
 * Stock a guardar en el ítem a partir del `qty_product` del producto (string o
 * number según el endpoint). `undefined` si no es un número usable.
 */
export function toAvailability(raw: unknown): number | undefined {
  if (raw === null || raw === undefined || raw === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

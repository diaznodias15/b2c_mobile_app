import type { MergeItem } from '@/api/services/cart.services';

/**
 * Líneas del carrito local aptas para `POST /api/cart/merge`. El backend responde 400 si falta
 * `products` o si una línea trae una cantidad menor que 1 o no entera, así que se descartan antes
 * de enviar (y si no queda ninguna, no se llama).
 */
export function toMergeItems(lines: { tx_slug: string; qty: number }[]): MergeItem[] {
  return lines
    .map((l) => ({ tx_slug: l.tx_slug, qty_product: Number(l.qty) }))
    .filter((l) => !!l.tx_slug && Number.isInteger(l.qty_product) && l.qty_product >= 1);
}

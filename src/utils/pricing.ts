import type { CartItem } from '@/types/cart';
import type { Product, ProductDetail } from '@/types/whitelabel';

export type ProductPricing = {
  basePrice: number;
  finalPrice: number;
  /** true solo si hay un `qty_discount` real Y el precio final es menor al base. */
  hasDiscount: boolean;
};

/**
 * Deriva base/final/hasDiscount de un `Product` o `ProductDetail` — la
 * misma regla se repetía verbatim en `ProductCard`, `ProductListItem` y
 * `product/[slug].tsx`. Los precios llegan como string desde el backend
 * (ver el comentario de `Product.pri_product_price`).
 */
export function getProductPricing(product: Product | ProductDetail): ProductPricing {
  const basePrice = Number(product.pri_product_price);
  const finalPrice = Number(product.pri_product_final_price);
  const hasDiscount = Boolean(product.qty_discount) && basePrice > finalPrice;
  return { basePrice, finalPrice, hasDiscount };
}

/**
 * Monto absoluto del descuento por unidad — `qty_discount` es un
 * PORCENTAJE (ej. 15 = 15%), no un monto. Misma fórmula que
 * `calculateDiscountAmount` de la web (PRODUCTS-CALCULATIONS.md §2.3).
 */
export function calculateDiscountAmount(price: number, discountPercent: number): number {
  return price * (discountPercent / 100);
}

/**
 * Monto absoluto del IVA por unidad, sobre la base CON descuento (no
 * sobre el precio base) — así lo aplica el backend real, confirmado en
 * PRODUCTS-CALCULATIONS.md §12.2. `qty_tax` también es un porcentaje.
 */
export function calculateTaxAmount(taxableBase: number, taxPercent: number): number {
  return taxableBase * (taxPercent / 100);
}

export type CartSummary = {
  /** Σ precio base × cantidad. */
  subtotal: number;
  /** Σ monto de descuento × cantidad. */
  discountTotal: number;
  /** Σ monto de IVA × cantidad. */
  taxTotal: number;
  /** Σ precio final (autoritativo del backend) × cantidad — NO se recalcula. */
  total: number;
};

/**
 * Desglosa el carrito en Subtotal/Descuento/IVA/Total, replicando la
 * cascada de `useCartSummary` + `productsAdapter` de la web
 * (PRODUCTS-CALCULATIONS.md §9), pero calculando descuento/IVA acá en
 * vez de confiar en montos pre-calculados del backend (esta API no los
 * expone — solo da los porcentajes `qty_discount`/`qty_tax`).
 *
 * `total` SIEMPRE usa `pri_product_final_price` (autoritativo del
 * backend), nunca `subtotal - discountTotal + taxTotal` — el backend
 * puede incluir regulaciones/redondeos que el frontend no conoce (ver
 * PRODUCTS-CALCULATIONS.md §7.2), así que no se recalcula.
 *
 * Items de carritos persistidos ANTES de que `CartItem` guardara
 * `pri_product_price`/`qty_discount`/`qty_tax` caen a discount/tax = 0
 * para ese item (no rompe, solo no desglosa esa línea).
 */
export function getCartSummary(items: CartItem[]): CartSummary {
  return items.reduce<CartSummary>(
    (acc, item) => {
      const basePrice = Number(item.pri_product_price ?? item.pri_product_final_price);
      const finalPrice = Number(item.pri_product_final_price);
      const discountPercent = Number(item.qty_discount ?? 0);
      const taxPercent = Number(item.qty_tax ?? 0);

      const discountAmount = calculateDiscountAmount(basePrice, discountPercent);
      const priceWithDiscount = basePrice - discountAmount;
      const taxAmount = calculateTaxAmount(priceWithDiscount, taxPercent);

      return {
        subtotal: acc.subtotal + basePrice * item.qty,
        discountTotal: acc.discountTotal + discountAmount * item.qty,
        taxTotal: acc.taxTotal + taxAmount * item.qty,
        total: acc.total + finalPrice * item.qty,
      };
    },
    { subtotal: 0, discountTotal: 0, taxTotal: 0, total: 0 }
  );
}

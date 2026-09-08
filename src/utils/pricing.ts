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

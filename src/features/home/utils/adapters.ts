import type { Advertising, TopProduct } from '@/types/whitelabel';

/**
 * Devuelve la URL de imagen mobile del advertising.
 * Fallback a la web si no hay mobile (defensa, no debería pasar).
 */
export function advertisingImageUrl(ad: Advertising): string {
  return ad.tx_img_url_mobile || ad.tx_img_url_web || '';
}

/**
 * Ordena los advertisements por `seq_order` asc, luego `seq_importance`,
 * y finalmente por nombre (defensa ante campos faltantes).
 */
export function sortAdvertising(list: Advertising[]): Advertising[] {
  return [...list].sort((a, b) => {
    const oa = a.seq_order ?? 9999;
    const ob = b.seq_order ?? 9999;
    if (oa !== ob) return oa - ob;
    const ia = a.seq_importance ?? 9999;
    const ib = b.seq_importance ?? 9999;
    if (ia !== ib) return ia - ib;
    return a.nb_advertising.localeCompare(b.nb_advertising);
  });
}

/**
 * Convierte el string de precio del backend a número finito.
 * Si no parsea, devuelve 0.
 */
function parsePrice(raw: string | null | undefined): number {
  if (raw == null) return 0;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : 0;
}

/** Indica si el producto tiene descuento real. */
export function hasDiscount(p: TopProduct): boolean {
  const base = parsePrice(p.pri_product_price);
  const final = parsePrice(p.pri_product_final_price);
  return final > 0 && base > 0 && final < base;
}

/** Precio final numérico (USD). */
export function finalPrice(p: TopProduct): number {
  return parsePrice(p.pri_product_final_price);
}

/** Precio base numérico (USD, sin impuestos). */
export function basePrice(p: TopProduct): number {
  return parsePrice(p.pri_product_price);
}

/** Porcentaje de descuento entero (redondeo normal). */
export function discountPercent(p: TopProduct): number {
  if (!hasDiscount(p)) return 0;
  const base = basePrice(p);
  const final = finalPrice(p);
  if (base <= 0) return 0;
  return Math.round(((base - final) / base) * 100);
}

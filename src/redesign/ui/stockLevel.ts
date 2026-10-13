import type { StockLevel } from '@/types/whitelabel';

/** Umbral de "pocas unidades" — mismo que la web (`STOCK_THRESHOLDS.LOW`). */
export const LOW_STOCK_THRESHOLD = 3;

/**
 * Nivel de stock a partir de las unidades disponibles de un listado (`qty_product`,
 * que llega como número o string). Los listados no traen `availability_indicator`
 * (solo el detalle). Regla de la web: ≤0 sin stock, ≤3 pocas unidades, si no en stock.
 * `undefined` si el dato no es un número usable (no se muestra nada en vez de inventar).
 */
export function getStockLevel(raw: unknown): StockLevel | undefined {
  if (raw === null || raw === undefined || raw === '') return undefined;
  const qty = Number(raw);
  if (!Number.isFinite(qty)) return undefined;
  if (qty <= 0) return 0;
  if (qty <= LOW_STOCK_THRESHOLD) return 1;
  return 2;
}

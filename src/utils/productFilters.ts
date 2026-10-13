import type { DisplayCurrency } from '@/utils/currency';
import { roundTo } from '@/utils/currency';
import type { Category, Department, Subcategory } from '@/types/whitelabel';

/**
 * Filtros del listado por departamento. Los precios van SIEMPRE en Bs.
 * (es lo que espera `/api/products/list`); la conversión a la moneda
 * elegida ocurre solo al leer/escribir los campos de texto del modal.
 */
export type ProductFilters = {
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
};

export const EMPTY_FILTERS: ProductFilters = {};

/** Categoría ya normalizada: la subcategoría siempre en `subcategories`. */
export type FilterCategory = Omit<Category, 'subcategories'> & {
  subcategories: Subcategory[];
};

/**
 * Categorías de un departamento listas para pintar. El backend las manda hoy
 * vacías en `/config/get`, y la web de referencia las lee como
 * `sub_categories`; se aceptan ambos nombres y se descartan las que no tienen
 * `tx_slug` (sin slug no se puede filtrar).
 */
export function getDepartmentCategories(
  department: Pick<Department, 'categories'> | undefined
): FilterCategory[] {
  const result: FilterCategory[] = [];
  for (const category of department?.categories ?? []) {
    if (!category.tx_slug) continue;
    const raw = category as Category & { sub_categories?: Subcategory[] };
    const subs = raw.subcategories ?? raw.sub_categories ?? [];
    result.push({ ...category, subcategories: subs.filter((s) => !!s.tx_slug) });
  }
  return result;
}

/** Categoría y subcategoría son excluyentes; cambiar una borra el precio y la otra. */
export function selectCategory(category: string): ProductFilters {
  return { category };
}

export function selectSubcategory(subcategory: string): ProductFilters {
  return { subcategory };
}

export function setPriceRange(
  filters: ProductFilters,
  minPrice: number | undefined,
  maxPrice: number | undefined
): ProductFilters {
  return { ...filters, minPrice, maxPrice };
}

export function clearPrice(filters: ProductFilters): ProductFilters {
  const { minPrice: _min, maxPrice: _max, ...rest } = filters;
  return rest;
}

export function hasPriceFilter(filters: ProductFilters): boolean {
  return filters.minPrice != null || filters.maxPrice != null;
}

export function hasActiveFilters(filters: ProductFilters): boolean {
  return !!filters.category || !!filters.subcategory || hasPriceFilter(filters);
}

/** Cantidad de filtros activos (para el badge del botón "Filtros"). */
export function countActiveFilters(filters: ProductFilters): number {
  return (filters.category || filters.subcategory ? 1 : 0) + (hasPriceFilter(filters) ? 1 : 0);
}

/**
 * Texto del campo → monto en Bs. Acepta coma o punto decimal. Devuelve
 * `undefined` si está vacío o no es un número ≥ 0. En `REF` convierte
 * (monto × tasa) porque la query siempre va en Bs.
 */
export function priceInputToBs(
  text: string,
  currency: DisplayCurrency,
  exchangeRate: number | null | undefined
): number | undefined {
  const normalized = text.trim().replace(',', '.');
  if (normalized === '') return undefined;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return undefined;
  if (currency === 'REF') {
    if (!exchangeRate || exchangeRate <= 0) return undefined;
    return roundTo(value * exchangeRate);
  }
  return roundTo(value);
}

/** Monto en Bs. → texto del campo en la moneda elegida (`''` si no hay valor). */
export function bsToPriceInput(
  bs: number | undefined,
  currency: DisplayCurrency,
  exchangeRate: number | null | undefined
): string {
  if (bs == null) return '';
  const value = currency === 'REF' && exchangeRate && exchangeRate > 0 ? bs / exchangeRate : bs;
  return String(roundTo(value));
}

/** `null` si el rango es válido; si no, el motivo para mostrar en el modal. */
export function validatePriceRange(
  min: number | undefined,
  max: number | undefined
): string | null {
  if (min != null && max != null && min > max) {
    return 'El precio mínimo no puede ser mayor que el máximo.';
  }
  return null;
}

/** Rango del set completo que manda el backend (`metadata`), como números. */
export function parsePriceRange(
  metadata: { min_price?: number | string; max_price?: number | string } | undefined
): { min: number; max: number } | null {
  if (!metadata) return null;
  const min = Number(metadata.min_price);
  const max = Number(metadata.max_price);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  // Igual que la web: sin rango útil si min == max o ambos son 0.
  if (min === max || (min === 0 && max === 0)) return null;
  return { min, max };
}

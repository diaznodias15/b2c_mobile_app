import type {
  AvailabilityByBranch,
  BranchAvailability,
  Product,
  ProductDetail,
  StockLevel,
} from '@/types/whitelabel';

/** Etiquetas legibles del stock según el nivel del backend. */
export const STOCK_LABELS: Record<StockLevel, string> = {
  0: 'Sin stock',
  1: 'Pocas unidades',
  2: 'En stock',
};

/** Color del dot de stock (en hex porque viene del theme). */
export const STOCK_DOT_COLORS: Record<StockLevel, string> = {
  0: '#dc2626', // rojo
  1: '#f5a524', // amarillo
  2: '#17C964', // verde
};

/** Determina si un producto está en stock (>=1 unidad). */
export function isInStock(level: StockLevel): boolean {
  return level >= 1;
}

/** Determina si un producto está agotado. */
export function isOutOfStock(level: StockLevel): boolean {
  return level === 0;
}

/* ============================================================
 * Product list sorting
 * ============================================================ */

export type SortOption = 'relevance' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc';

function parsePrice(raw: string | undefined | null): number {
  if (!raw) return 0;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Ordena productos client-side.
 * `relevance` mantiene el orden del backend.
 */
export function sortProducts(list: Product[], option: SortOption): Product[] {
  if (option === 'relevance') return [...list];
  const copy = [...list];
  switch (option) {
    case 'name-asc':
      return copy.sort((a, b) =>
        a.nb_product.localeCompare(b.nb_product, 'es')
      );
    case 'name-desc':
      return copy.sort((a, b) =>
        b.nb_product.localeCompare(a.nb_product, 'es')
      );
    case 'price-asc':
      return copy.sort(
        (a, b) => parsePrice(a.pri_product_final_price) - parsePrice(b.pri_product_final_price)
      );
    case 'price-desc':
      return copy.sort(
        (a, b) => parsePrice(b.pri_product_final_price) - parsePrice(a.pri_product_final_price)
      );
  }
}

/* ============================================================
 * Branch availability helpers
 * ============================================================ */

/**
 * Aplana el árbol de availability_per_branch a una lista plana
 * de `BranchAvailability`.
 */
export function flattenAvailability(
  tree: AvailabilityByBranch[] | undefined
): BranchAvailability[] {
  if (!tree) return [];
  const out: BranchAvailability[] = [];
  for (const state of tree) {
    for (const city of state.cities) {
      out.push(...city.branches);
    }
  }
  return out;
}

/** Encuentra la availability para una sede específica por id. */
export function findBranchAvailability(
  tree: AvailabilityByBranch[] | undefined,
  branchId: number
): BranchAvailability | null {
  return flattenAvailability(tree).find((b) => b.branch_id === branchId) ?? null;
}

/**
 * Devuelve la availability de la sede del producto, priorizando la
 * sede actualmente seleccionada del usuario. Si no hay match, devuelve
 * la primera del array (defensa).
 */
export function availabilityForCurrentBranch(
  tree: AvailabilityByBranch[] | undefined,
  currentBranchId: number | null | undefined
): BranchAvailability | null {
  if (!tree || tree.length === 0) return null;
  if (currentBranchId) {
    const found = findBranchAvailability(tree, currentBranchId);
    if (found) return found;
  }
  return flattenAvailability(tree)[0] ?? null;
}

/* ============================================================
 * Product detail helpers
 * ============================================================ */

/** Devuelve la URL de imagen (detail usa product_img, no tx_img_url). */
export function productDetailImage(detail: ProductDetail): string | null {
  return detail.product_img ?? null;
}

/** Indica si el detalle tiene descripción para mostrar en el accordion. */
export function hasDescription(detail: ProductDetail): boolean {
  return !!detail.tx_description && detail.tx_description.trim().length > 0;
}

/** Indica si hay features para mostrar como bullets. */
export function hasFeatures(detail: ProductDetail): boolean {
  return Array.isArray(detail.product_features) && detail.product_features.length > 0;
}

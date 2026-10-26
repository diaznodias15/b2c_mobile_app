import { axiosRequest } from '../axiosRequest';
import type {
  Envelope,
  Pagination,
  PriceMetadata,
  Product,
  ProductDetail,
} from '@/types/whitelabel';
import { toQueryString } from '@/utils/queryParams';
import { adaptSearchApproximation, type SearchApproximation } from '@/utils/searchApproximation';
import { familyAdapter } from '@/utils/variants';

const TOP_PRODUCTS = '/api/products/top-products';
const LIST = '/api/products/list';
const SEARCH = '/api/products/search';
const DETAIL = (slug: string) => `/api/products/detail/${slug}`;

/** Resultado paginado de list/search. */
export type PaginatedProducts = {
  items: Product[];
  pagination: Pagination;
  metadata?: PriceMetadata;
  /**
   * Solo en `getProductSearch`: `null` si lo escrito dio resultados; con datos si el backend
   * mostró productos similares (hay que avisarlo, y esa respuesta es de una sola página).
   */
  approximation?: SearchApproximation | null;
};

/* ============================================================
 * Top products (Fase 2)
 * ============================================================ */

/**
 * Trae los productos más vendidos de la sede.
 * Se usa en el Home (debajo del carrusel publicitario) y en el
 * detalle de producto (relacionados por marca).
 */
export async function getTopProducts(
  branchId: number,
  options?: { brand?: string; signal?: AbortSignal }
): Promise<Product[]> {
  const params: Record<string, string | number> = { branch: branchId };
  if (options?.brand) {
    params.brand = options.brand;
  }
  const url = `${TOP_PRODUCTS}${toQueryString(params)}`;
  const envelope = await axiosRequest<Envelope<Product[]>>({
    method: 'GET',
    url,
    signal: options?.signal,
  });
  return envelope.data ?? [];
}

/* ============================================================
 * List (Fase 3) — paginado, con filtros opcionales
 * ============================================================ */

export type GetProductListParams = {
  branch: number;
  department?: string;
  category?: string;
  subcategory?: string;
  min_price?: number;
  max_price?: number;
  page?: number;
  signal?: AbortSignal;
};

/**
 * Lista paginada de productos de un departamento (o de toda la
 * tienda si no se pasa department). Soporta filtros por subcategoría
 * y rango de precio.
 */
export async function getProductList(
  params: GetProductListParams
): Promise<PaginatedProducts> {
  const qs: Record<string, string | number> = { branch: params.branch };
  if (params.department) qs.department = params.department;
  if (params.category) qs.category = params.category;
  if (params.subcategory) qs.subcategory = params.subcategory;
  if (params.min_price != null) qs.min_price = params.min_price;
  if (params.max_price != null) qs.max_price = params.max_price;
  if (params.page != null) qs.page = params.page;

  const envelope = await axiosRequest<
    Envelope<Product[]> & { pagination?: Pagination; metadata?: PriceMetadata }
  >({
    method: 'GET',
    url: `${LIST}${toQueryString(qs)}`,
    signal: params.signal,
  });

  return {
    items: envelope.data ?? [],
    pagination: envelope.pagination ?? {},
    metadata: envelope.metadata,
  };
}

/* ============================================================
 * Search (Fase 3) — paginado, con debounce en el cliente
 * ============================================================ */

export type GetProductSearchParams = {
  branch: number;
  product: string;
  page?: number;
  min_price?: number;
  max_price?: number;
  /** Pide exactamente lo escrito, sin aproximar (el backend solo acepta `1`/`true`). */
  exact?: boolean;
  signal?: AbortSignal;
};

/**
 * Búsqueda por texto libre. Mínimo 3 caracteres (validado en la UI).
 * Devuelve resultados paginados.
 */
export async function getProductSearch(
  params: GetProductSearchParams
): Promise<PaginatedProducts> {
  const qs: Record<string, string | number> = {
    branch: params.branch,
    product: params.product,
  };
  if (params.page != null) qs.page = params.page;
  if (params.min_price != null) qs.min_price = params.min_price;
  if (params.max_price != null) qs.max_price = params.max_price;
  if (params.exact) qs.exact = 1;

  const envelope = await axiosRequest<
    Envelope<Product[]> & { pagination?: Pagination; metadata?: unknown }
  >({
    method: 'GET',
    url: `${SEARCH}${toQueryString(qs)}`,
    signal: params.signal,
  });

  return {
    items: envelope.data ?? [],
    pagination: envelope.pagination ?? {},
    metadata: envelope.metadata as PriceMetadata | undefined,
    approximation: adaptSearchApproximation(envelope.metadata),
  };
}

/* ============================================================
 * Detail (Fase 3) — un solo producto con availability por sede
 * ============================================================ */

export type GetProductDetailParams = {
  branch: number;
  signal?: AbortSignal;
};

/**
 * Trae el detalle completo de un producto + la disponibilidad
 * por cada sede (state → city → branches).
 */
export async function getProductDetail(
  slug: string,
  params: GetProductDetailParams
): Promise<ProductDetail> {
  const url = `${DETAIL(slug)}${toQueryString({ branch: params.branch })}`;
  const envelope = await axiosRequest<Envelope<ProductDetail>>({
    method: 'GET',
    url,
    signal: params.signal,
  });
  // `family` solo viene si el producto pertenece a una ficha; se normaliza (o se descarta si
  // viene mal formado) para que el detalle sea el de siempre.
  const { family: rawFamily, ...detail } = envelope.data as ProductDetail & { family?: unknown };
  const family = familyAdapter(rawFamily);
  return family ? { ...detail, family } : detail;
}

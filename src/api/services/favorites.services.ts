import { axiosRequest } from '../axiosRequest';
import type { CartBulkResult } from './cart.services';
import type { Envelope } from '@/types/whitelabel';

// FRONTEND_FAVORITES.md. Solo rol cliente; el favorito es el producto, no depende de la sede.
const SLUGS = '/api/favorites/slugs';
const BY_BRANCH = (branch: number) => `/api/favorites/branch/${branch}`;
const ITEM = (slug: string) => `/api/favorites/${slug}`;
const ADD_TO_CART = (branch: number) => `/api/favorites/add-to-cart/branch/${branch}`;

/** Favorito con la disponibilidad y los precios de la sede consultada. */
export type FavoriteProduct = {
  id: number;
  cod_barcode?: string;
  nb_product: string;
  nb_brand: string;
  is_regulado?: number;
  tx_slug: string;
  /** `false`: la sede no maneja el producto (stock 0 y precios 0). No se puede agregar. */
  is_in_branch: boolean;
  qty_availability: number;
  pri_product_price: number | string;
  pri_product_final_price: number | string;
  qty_discount?: number | string;
  qty_tax?: number | string;
  tx_img_url?: string | null;
  tx_variant_label?: string | null;
  dt_favorite_at?: string;
};

export async function getFavoriteSlugs(): Promise<string[]> {
  const res = await axiosRequest<Envelope<string[]>>({ url: SLUGS, dedup: false });
  return res.data ?? [];
}

export async function getFavorites(
  branchId: number,
  options?: { signal?: AbortSignal }
): Promise<FavoriteProduct[]> {
  const res = await axiosRequest<Envelope<FavoriteProduct[]>>({
    url: BY_BRANCH(branchId),
    signal: options?.signal,
    // Se relee al volver a la pantalla y con pull-to-refresh.
    dedup: false,
  });
  return res.data ?? [];
}

/** Idempotente: `added: false` significa que ya estaba. */
export async function addFavorite(slug: string): Promise<boolean> {
  const res = await axiosRequest<Envelope<{ added: boolean }>>({ method: 'POST', url: ITEM(slug) });
  return res.data?.added ?? true;
}

/** Idempotente: `removed: false` significa que no estaba. */
export async function removeFavorite(slug: string): Promise<boolean> {
  const res = await axiosRequest<Envelope<{ removed: boolean }>>({ method: 'DELETE', url: ITEM(slug) });
  return res.data?.removed ?? true;
}

/** Suma 1 unidad de cada favorito disponible al carrito de la sede. */
export async function addFavoritesToCart(
  branchId: number
): Promise<{ message: string; data: CartBulkResult }> {
  const res = await axiosRequest<Envelope<CartBulkResult>>({ method: 'POST', url: ADD_TO_CART(branchId) });
  return { message: res.message, data: res.data };
}

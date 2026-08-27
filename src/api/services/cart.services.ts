import { axiosRequest } from '../axiosRequest';
import type { CartServiceResponse } from '@/types/cart';
import type { Envelope, Product } from '@/types/whitelabel';
import { toQueryString } from '@/utils/queryParams';

const ITEMS = (branch: number) => `/api/cart/items/branch/${branch}`;
const INDICATOR = (branch: number) => `/api/cart/indicator/branch/${branch}`;
const ADD = '/api/cart/add-product';
const UPDATE = '/api/cart/update-product-quantity';
const REMOVE = (slug: string, branchId: number) =>
  `/api/cart/remove-product/${slug}/branch/${branchId}`;
const CLEAR = (branchId: number) => `/api/cart/clear/branch/${branchId}`;
const MERGE = (branch: number) => `/api/cart/merge/branch/${branch}`;

export type AddProductPayload = {
  branch_id: number;
  tx_slug: string;
  qty_product: number;
};

export type UpdateQuantityPayload = {
  branch_id: number;
  tx_slug: string;
  qty_product: number;
};

/** Items del carrito en el backend (shape que devuelve `items/branch/:id`). */
export type CartItemFromBackend = Product & {
  qty: number;
};

/** Indicador resumido del carrito. */
export type CartIndicator = {
  count: number;
  total?: number;
};

/* ============================================================
 * READ
 * ============================================================ */

export async function getCartItems(
  branchId: number,
  options?: { signal?: AbortSignal }
): Promise<CartItemFromBackend[]> {
  const envelope = await axiosRequest<Envelope<CartItemFromBackend[]>>({
    method: 'GET',
    url: ITEMS(branchId),
    signal: options?.signal,
  });
  return envelope.data ?? [];
}

export async function getCartIndicator(
  branchId: number,
  options?: { signal?: AbortSignal }
): Promise<CartIndicator> {
  const envelope = await axiosRequest<Envelope<CartIndicator>>({
    method: 'GET',
    url: INDICATOR(branchId),
    signal: options?.signal,
  });
  return envelope.data ?? { count: 0 };
}

/* ============================================================
 * WRITE
 * ============================================================ */

export async function addProduct(
  payload: AddProductPayload
): Promise<CartServiceResponse<unknown>> {
  return axiosRequest({
    method: 'POST',
    url: ADD,
    data: payload,
  });
}

export async function updateQuantity(
  payload: UpdateQuantityPayload
): Promise<CartServiceResponse<unknown>> {
  return axiosRequest({
    method: 'PUT',
    url: UPDATE,
    data: payload,
  });
}

export async function removeProduct(
  slug: string,
  branchId: number
): Promise<CartServiceResponse<unknown>> {
  return axiosRequest({
    method: 'DELETE',
    url: REMOVE(slug, branchId),
  });
}

export async function clearCart(branchId: number): Promise<CartServiceResponse<unknown>> {
  return axiosRequest({
    method: 'DELETE',
    url: CLEAR(branchId),
  });
}

/* ============================================================
 * MERGE (post-login: cart local -> backend)
 * ============================================================ */

export type MergeItem = { tx_slug: string; qty_product: number };

export async function mergeLocalCart(
  branchId: number,
  items: MergeItem[]
): Promise<CartServiceResponse<unknown>> {
  return axiosRequest({
    method: 'POST',
    url: MERGE(branchId),
    data: { products: items },
  });
}

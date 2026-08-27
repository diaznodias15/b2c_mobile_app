import { axiosRequest } from '../axiosRequest';
import type { TopProduct } from '@/types/whitelabel';
import { toQueryString } from '@/utils/queryParams';

const ENDPOINT = '/api/products/top-products';

type Envelope<T> = { status: string; message: string; data: T };

/**
 * Trae los productos más vendidos de la sede.
 * Se usa en el Home (debajo del carrusel publicitario) y en el
 * detalle de producto (relacionados por marca).
 */
export async function getTopProducts(
  branchId: number,
  options?: { brand?: string; signal?: AbortSignal }
): Promise<TopProduct[]> {
  const params: Record<string, string | number> = { branch: branchId };
  if (options?.brand) {
    params.brand = options.brand;
  }
  const url = `${ENDPOINT}?${toQueryString(params)}`;
  const envelope = await axiosRequest<Envelope<TopProduct[]>>({
    method: 'GET',
    url,
    signal: options?.signal,
  });
  return envelope.data ?? [];
}

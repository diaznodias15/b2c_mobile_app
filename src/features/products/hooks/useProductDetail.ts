import { useQuery } from '@tanstack/react-query';

import { getProductDetail } from '@/api/services/products.services';
import type { ProductDetail } from '@/types/whitelabel';

/**
 * Hook del detalle de un producto. Refetch al cambiar de sede
 * (porque la availability por branch viene en el response).
 */
export function useProductDetail(
  slug: string | null | undefined,
  branchId: number | null | undefined
) {
  return useQuery<ProductDetail, Error>({
    queryKey: ['product-detail', slug, branchId],
    queryFn: ({ signal }) => {
      if (!slug || !branchId) {
        throw new Error('Faltan slug o branchId');
      }
      return getProductDetail(slug, { branch: branchId, signal });
    },
    enabled: !!slug && !!branchId,
    staleTime: 60_000,
  });
}

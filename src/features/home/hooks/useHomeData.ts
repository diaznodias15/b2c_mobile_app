import { useQuery } from '@tanstack/react-query';

import { getTopProducts } from '@/api/services/products.services';
import type { TopProduct } from '@/types/whitelabel';

/**
 * Hook del Home: trae los productos más vendidos de la sede.
 * React Query maneja dedup, refetch y caché.
 *
 * - Se re-fetcha cuando cambia la sede (`enabled: !!branchId`).
 * - staleTime 60s: si el usuario vuelve al home en menos de un minuto,
 *   no se re-pega al backend.
 */
export function useTopProducts(branchId: number | null | undefined) {
  return useQuery<TopProduct[], Error>({
    queryKey: ['top-products', branchId],
    queryFn: ({ signal }) => {
      if (!branchId) {
        return Promise.resolve([]);
      }
      return getTopProducts(branchId, { signal });
    },
    enabled: !!branchId,
    staleTime: 60_000,
  });
}

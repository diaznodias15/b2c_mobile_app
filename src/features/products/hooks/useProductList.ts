import { useInfiniteQuery } from '@tanstack/react-query';

import { getProductList } from '@/api/services/products.services';
import type { Product, Pagination } from '@/types/whitelabel';

type UseProductListParams = {
  branchId: number | null | undefined;
  department: string;
  category?: string;
  subcategory?: string;
  min_price?: number;
  max_price?: number;
};

/**
 * Hook de lista paginada de productos (infinite scroll).
 * Maneja:
 *  - Paginación server-side (per_page del backend, default 24)
 *  - Refetch al cambiar branchId/department/filtros
 *  - `fetchNextPage` para cargar la siguiente página
 */
export function useProductList(params: UseProductListParams) {
  const { branchId, department, ...filters } = params;
  const enabled = !!branchId && !!department;

  return useInfiniteQuery<
    { items: Product[]; pagination: Pagination },
    Error
  >({
    queryKey: [
      'product-list',
      branchId,
      department,
      filters.category ?? null,
      filters.subcategory ?? null,
      filters.min_price ?? null,
      filters.max_price ?? null,
    ],
    queryFn: async ({ pageParam, signal }) => {
      if (!branchId) {
        return { items: [], pagination: {} };
      }
      return getProductList({
        branch: branchId,
        department,
        category: filters.category,
        subcategory: filters.subcategory,
        min_price: filters.min_price,
        max_price: filters.max_price,
        page: (pageParam as number | undefined) ?? 1,
        signal,
      });
    },
    initialPageParam: 1 as number,
    getNextPageParam: (lastPage) => lastPage.pagination.next_page ?? undefined,
    enabled,
    staleTime: 30_000,
  });
}

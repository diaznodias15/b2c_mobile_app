import { useEffect, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';

import { getProductSearch } from '@/api/services/products.services';
import type { Product, Pagination } from '@/types/whitelabel';

const DEBOUNCE_MS = 400;

/**
 * Hook de búsqueda con debounce + infinite scroll.
 *
 *  - `query` (input crudo del usuario)
 *  - `debouncedQuery` (el que efectivamente dispara el fetch, 400ms después)
 *  - Solo se fetchea si `debouncedQuery.length >= 3`
 */
export function useProductSearch({
  branchId,
  query,
}: {
  branchId: number | null | undefined;
  query: string;
}) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query]);

  const trimmed = debouncedQuery.trim();
  const enabled = !!branchId && trimmed.length >= 3;

  const result = useInfiniteQuery<
    { items: Product[]; pagination: Pagination },
    Error
  >({
    queryKey: ['product-search', branchId, trimmed],
    queryFn: async ({ pageParam, signal }) => {
      if (!branchId) return { items: [], pagination: {} };
      return getProductSearch({
        branch: branchId,
        product: trimmed,
        page: (pageParam as number | undefined) ?? 1,
        signal,
      });
    },
    initialPageParam: 1 as number,
    getNextPageParam: (lastPage) => lastPage.pagination.next_page ?? undefined,
    enabled,
    staleTime: 30_000,
  });

  return { ...result, debouncedQuery, isReady: trimmed.length >= 3 };
}

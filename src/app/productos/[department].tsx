import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MapPin } from 'lucide-react-native';

import AppTabs from '@/components/app-tabs';
import { useBranchStore, useDepartmentStore } from '@/store';
import { useProductList } from '@/features/products/hooks/useProductList';
import { ProductGrid } from '@/features/products/components/ProductGrid';
import { SortMenu } from '@/features/products/components/SortMenu';
import { BranchSelector } from '@/features/branches/components/BranchSelector';
import type { Product, SortOption } from '@/features/products/utils/adapters';

/**
 * Pantalla de productos de un departamento.
 *
 *  - Lee `:department` de la URL (slug)
 *  - Busca el department en el store (por slug) para mostrar nombre + imagen
 *  - Hook `useProductList` con infinite scroll
 *  - Sort client-side (SortMenu)
 *  - Header: botón back + nombre del departamento + branch selector compacto
 */
export default function ProductsByDepartmentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ department: string }>();
  const slug = params.department;
  const branchId = useBranchStore((s) => s.selectedBranch?.value) ?? null;
  const department = useDepartmentStore((s) =>
    s.departments.find((d) => d.tx_slug === slug)
  );
  const [sort, setSort] = useState<SortOption>('relevance');

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProductList({
    branchId,
    department: slug,
  });

  // Aplanamos todas las páginas en una sola lista.
  const products: Product[] = useMemo(
    () => (data?.pages.flatMap((p) => p.items) ?? []),
    [data]
  );
  const total = data?.pages?.[0]?.pagination?.total;

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header sticky */}
        <View className="px-4 pt-3 pb-2 flex-row items-center gap-2 border-b border-backgroundElement">
          <ArrowLeft
            size={22}
            color="#1A1A2E"
            onPress={() => router.back()}
            accessibilityLabel="Volver"
          />
          <View className="flex-1">
            <Text className="text-lg font-bold text-foreground" numberOfLines={1}>
              {department?.nb_department ?? 'Productos'}
            </Text>
            <View className="flex-row items-center gap-1">
              <MapPin size={11} color="#60646C" />
              <BranchSelector compact />
            </View>
          </View>
        </View>

        {/* Sort + count */}
        <View className="flex-row items-center justify-between px-4 py-2">
          <Text className="text-xs text-muted">
            {isLoading
              ? 'Cargando…'
              : total != null
                ? `${total} productos`
                : `${products.length} productos`}
          </Text>
          <SortMenu value={sort} onChange={setSort} />
        </View>

        {isError ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-sm text-muted text-center">
              No pudimos cargar los productos. Probá de nuevo en unos segundos.
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingVertical: 4 }}
            onScroll={({ nativeEvent }) => {
              if (
                hasNextPage &&
                !isFetchingNextPage &&
                nativeEvent.layoutMeasurement.height +
                  nativeEvent.contentOffset.y >=
                  nativeEvent.contentSize.height - 200
              ) {
                void fetchNextPage();
              }
            }}
            scrollEventThrottle={200}
          >
            <ProductGrid
              products={products}
              isLoading={isLoading}
              isFetchingMore={isFetchingNextPage}
              hasMore={hasNextPage ?? false}
              onLoadMore={() => void fetchNextPage()}
              sort={sort}
              emptyText="Este departamento todavía no tiene productos cargados."
            />
          </ScrollView>
        )}
      </SafeAreaView>
      <AppTabs />
    </View>
  );
}

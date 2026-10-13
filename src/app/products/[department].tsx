import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ChevronLeft, ListFilter, PackageSearch, RefreshCcw } from 'lucide-react-native';

import { getProductList } from '@/api/services/products.services';
import { ProductFiltersModal } from '@/components/ProductFiltersModal';
import { ProductListItem } from '@/redesign/components/ProductListItem';
import { ProductListItemSkeleton } from '@/redesign/components/ProductListItemSkeleton';
import { useListAddToCart } from '@/hooks/useListAddToCart';
import { useRefreshControl } from '@/hooks/useRefreshControl';
import { useSafePush } from '@/hooks/useSafePush';
import { selectEffectiveBranchId, useBranchStore } from '@/store/branch.store';
import { useThemeColors } from '@/store/config.store';
import { useDepartmentStore } from '@/store/department.store';
import type { ThemeColors } from '@/theme/colors';
import type { Product } from '@/types/whitelabel';
import {
  EMPTY_FILTERS,
  countActiveFilters,
  getDepartmentCategories,
  hasPriceFilter,
  parsePriceRange,
  type ProductFilters,
} from '@/utils/productFilters';

/**
 * Listado de productos de un departamento (`GET /api/products/list`) con
 * filtros por categoría/subcategoría y rango de precio, y scroll infinito.
 *
 * Es una ruta del stack (no una tab): sin `<BottomTabs />`, con su propio
 * botón de volver. Los filtros viven en estado local (se reinician al salir).
 * La sede activa va en la query key, así que al cambiarla se re-pide con los
 * mismos filtros.
 */
export default function DepartmentProductsScreen() {
  const { department: slug } = useLocalSearchParams<{ department: string }>();
  const router = useRouter();
  const push = useSafePush();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const branchId = useBranchStore(selectEffectiveBranchId);
  const refreshControl = useRefreshControl();
  const handleAddToCart = useListAddToCart();

  const department = useDepartmentStore((s) => s.departments.find((d) => d.tx_slug === slug));
  const categories = useMemo(() => getDepartmentCategories(department), [department]);

  const [filters, setFilters] = useState<ProductFilters>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: [
        'product-list',
        branchId,
        slug,
        filters.category ?? null,
        filters.subcategory ?? null,
        filters.minPrice ?? null,
        filters.maxPrice ?? null,
      ],
      queryFn: ({ pageParam, signal }) =>
        getProductList({
          branch: branchId as number,
          department: slug,
          category: filters.category,
          subcategory: filters.subcategory,
          min_price: filters.minPrice,
          max_price: filters.maxPrice,
          page: pageParam,
          signal,
        }),
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.pagination.next_page ?? undefined,
      enabled: branchId !== null && !!slug,
    });

  const products = data?.pages.flatMap((page) => page.items) ?? [];
  const total = data?.pages[0]?.pagination.total;
  const metadata = data?.pages[0]?.metadata;

  // El backend recalcula `metadata` con el filtro de precio puesto (queda el rango
  // ya filtrado), así que el rango "completo" se recuerda de la última respuesta
  // SIN filtro de precio. Cambiar de categoría lo vuelve a calcular porque ese
  // cambio también borra el precio.
  const [baseRange, setBaseRange] = useState<{ min: number; max: number } | null>(null);
  if (data && !hasPriceFilter(filters)) {
    const next = parsePriceRange(metadata);
    if (next?.min !== baseRange?.min || next?.max !== baseRange?.max) setBaseRange(next);
  }

  // Al cambiar de filtro, vuelve arriba (la lista recién filtrada empieza desde el primer ítem).
  const [listKey, setListKey] = useState(0);
  const handleFiltersChange = useCallback((next: ProductFilters) => {
    setFilters(next);
    setListKey((k) => k + 1);
  }, []);

  const handlePressProduct = useCallback(
    (product: Product) => push(`/product/${product.tx_slug}`),
    [push]
  );

  const renderItem = useCallback(
    ({ item }: { item: Product }) => (
      <ProductListItem
        product={item}
        colors={colors}
        onPress={handlePressProduct}
        onAddToCart={handleAddToCart}
      />
    ),
    [colors, handlePressProduct, handleAddToCart]
  );

  const activeCount = countActiveFilters(filters);
  const title = department?.nb_department ?? 'Productos';
  const showSkeleton = isLoading && branchId !== null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 24,
          paddingBottom: 12,
          gap: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Volver"
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.section,
            }}
          >
            <ChevronLeft size={22} color={colors.foreground} />
          </Pressable>
          <Text
            numberOfLines={1}
            style={{ flex: 1, fontSize: 22, fontWeight: '700', color: colors.foreground }}
          >
            {title}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 13, color: colors.muted }}>
            {total != null ? `${total} ${total === 1 ? 'producto' : 'productos'}` : ' '}
          </Text>
          <Pressable
            onPress={() => setFiltersOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={
              activeCount > 0 ? `Filtros, ${activeCount} activos` : 'Filtros'
            }
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 999,
              backgroundColor: activeCount > 0 ? colors.primary : colors.section,
            }}
          >
            <ListFilter size={16} color={activeCount > 0 ? colors.onPrimary : colors.foreground} />
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: activeCount > 0 ? colors.onPrimary : colors.foreground,
              }}
            >
              {activeCount > 0 ? `Filtros (${activeCount})` : 'Filtros'}
            </Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        key={listKey}
        data={showSkeleton || isError ? [] : products}
        keyExtractor={(item) => String(item.id)}
        style={{ flex: 1 }}
        refreshControl={refreshControl}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 24,
          gap: 10,
          flexGrow: 1,
        }}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
        }}
        renderItem={renderItem}
        ListEmptyComponent={
          showSkeleton ? (
            <View style={{ gap: 10 }}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <ProductListItemSkeleton key={i} colors={colors} />
              ))}
            </View>
          ) : isError ? (
            <ListMessage
              colors={colors}
              title="No pudimos cargar los productos"
              subtitle="Revisa tu conexión e inténtalo de nuevo."
              onRetry={() => void refetch()}
            />
          ) : (
            <ListMessage
              colors={colors}
              title="No hay productos disponibles"
              subtitle={
                activeCount > 0
                  ? 'Prueba quitando algún filtro.'
                  : 'Este departamento no tiene productos en la sede seleccionada.'
              }
              onClear={activeCount > 0 ? () => handleFiltersChange(EMPTY_FILTERS) : undefined}
            />
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={{ paddingVertical: 16 }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null
        }
      />

      <ProductFiltersModal
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        colors={colors}
        categories={categories}
        filters={filters}
        onChange={handleFiltersChange}
        priceRange={baseRange}
      />
    </View>
  );
}

function ListMessage({
  colors,
  title,
  subtitle,
  onRetry,
  onClear,
}: {
  colors: ThemeColors;
  title: string;
  subtitle: string;
  onRetry?: () => void;
  onClear?: () => void;
}) {
  const action = onRetry
    ? { label: 'Reintentar', onPress: onRetry }
    : onClear
      ? { label: 'Limpiar filtros', onPress: onClear }
      : null;

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 64,
        paddingHorizontal: 32,
      }}
    >
      <PackageSearch size={40} color={colors.muted} strokeWidth={1.6} />
      <Text
        style={{
          fontSize: 16,
          fontWeight: '700',
          color: colors.foreground,
          marginTop: 12,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 4 }}>
        {subtitle}
      </Text>
      {action && (
        <Pressable
          onPress={action.onPress}
          accessibilityRole="button"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginTop: 20,
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderRadius: 999,
            backgroundColor: colors.primary,
          }}
        >
          {onRetry && <RefreshCcw size={16} color={colors.onPrimary} />}
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.onPrimary }}>
            {action.label}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

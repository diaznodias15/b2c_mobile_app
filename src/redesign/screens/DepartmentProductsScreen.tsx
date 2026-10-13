import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ChevronLeft, ListFilter, PackageSearch, RefreshCcw, X } from 'lucide-react-native';

import { getProductList } from '@/api/services/products.services';
import { ProductFiltersModal } from '@/components/ProductFiltersModal';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { useListAddToCart } from '@/hooks/useListAddToCart';
import { useRefreshControl } from '@/hooks/useRefreshControl';
import { useSafePush } from '@/hooks/useSafePush';
import { selectEffectiveBranchId, useBranchStore } from '@/store/branch.store';
import { useThemeColors } from '@/store/config.store';
import { useDepartmentStore } from '@/store/department.store';
import type { ThemeColors } from '@/theme/colors';
import type { Product } from '@/types/whitelabel';
import { formatDisplayPrice } from '@/utils/currency';
import {
  EMPTY_FILTERS,
  clearPrice,
  countActiveFilters,
  getDepartmentCategories,
  hasPriceFilter,
  parsePriceRange,
  type FilterCategory,
  type ProductFilters,
} from '@/utils/productFilters';

import { ProductListItem } from '../components/ProductListItem';
import { ProductListItemSkeleton } from '../components/ProductListItemSkeleton';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { IconButton } from '../ui/IconButton';
import { Txt } from '../ui/Txt';

/**
 * Listado de productos de un departamento del rediseño. Misma lógica que
 * `products/[department].tsx` (consulta paginada con scroll infinito por `next_page`, sede en la
 * query key, filtros en estado local, rango de precio "completo" recordado de la última respuesta
 * sin filtro de precio) con otra presentación:
 *
 *  - **Los filtros activos se ven como chips** debajo de la cabecera y se quitan con un toque (el
 *    original solo decía "Filtros (n)" y había que abrir el panel para saber cuáles estaban
 *    puestos).
 *  - Cabecera con volver de 48 dp y el botón de filtros como chip.
 *  - Contador y estados (cargando, vacío, error con "Reintentar") con textos de 14 px.
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
  const { displayCurrency, exchangeRate } = useDisplayCurrency();

  const department = useDepartmentStore((s) => s.departments.find((d) => d.tx_slug === slug));
  const categories = useMemo(() => getDepartmentCategories(department), [department]);

  const [filters, setFilters] = useState<ProductFilters>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
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

  // El backend recalcula `metadata` con el filtro de precio puesto (queda el rango ya filtrado), así
  // que el rango "completo" se recuerda de la última respuesta SIN filtro de precio. Cambiar de
  // categoría lo recalcula porque ese cambio también borra el precio.
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

  const handlePressProduct = useCallback((product: Product) => push(`/product/${product.tx_slug}`), [push]);

  const renderItem = useCallback(
    ({ item }: { item: Product }) => (
      <ProductListItem product={item} colors={colors} onPress={handlePressProduct} onAddToCart={handleAddToCart} />
    ),
    [colors, handlePressProduct, handleAddToCart]
  );

  const activeCount = countActiveFilters(filters);
  const title = department?.nb_department ?? 'Productos';
  const showSkeleton = isLoading && branchId !== null;
  const fmt = (amount: number) => formatDisplayPrice(amount, exchangeRate, displayCurrency);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 8, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <IconButton icon={ChevronLeft} label="Volver" onPress={() => router.back()} colors={colors} />
          <View style={{ flex: 1 }}>
            <Txt variant="title" colors={colors} numberOfLines={1}>
              {title}
            </Txt>
            <Txt variant="caption" color="muted" colors={colors}>
              {total != null ? `${total} ${total === 1 ? 'producto' : 'productos'}` : ' '}
            </Txt>
          </View>
          <Chip
            label="Filtros"
            icon={ListFilter}
            count={activeCount}
            selected={activeCount > 0}
            onPress={() => setFiltersOpen(true)}
            colors={colors}
          />
        </View>

        {activeCount > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {filters.category || filters.subcategory ? (
              <Chip
                label={filterLabel(filters, categories)}
                icon={X}
                selected
                onPress={() => handleFiltersChange(clearCategory(filters))}
                colors={colors}
              />
            ) : null}
            {hasPriceFilter(filters) ? (
              <Chip
                label={priceLabel(filters, fmt)}
                icon={X}
                selected
                onPress={() => handleFiltersChange(clearPrice(filters))}
                colors={colors}
              />
            ) : null}
            <Chip label="Limpiar todo" onPress={() => handleFiltersChange(EMPTY_FILTERS)} colors={colors} />
          </ScrollView>
        )}
      </View>

      <FlatList
        key={listKey}
        data={showSkeleton || isError ? [] : products}
        keyExtractor={(item) => String(item.id)}
        style={{ flex: 1 }}
        refreshControl={refreshControl}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24, gap: 10, flexGrow: 1 }}
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
              action={{ label: 'Reintentar', icon: RefreshCcw, onPress: () => void refetch() }}
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
              action={activeCount > 0 ? { label: 'Limpiar filtros', onPress: () => handleFiltersChange(EMPTY_FILTERS) } : undefined}
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

/** Quita categoría y subcategoría (son excluyentes) y conserva el precio, si lo hay. */
function clearCategory(filters: ProductFilters): ProductFilters {
  const { category: _c, subcategory: _s, ...rest } = filters;
  return rest;
}

function filterLabel(filters: ProductFilters, categories: FilterCategory[]): string {
  if (filters.category) {
    return categories.find((c) => c.tx_slug === filters.category)?.nb_category ?? 'Categoría';
  }
  for (const category of categories) {
    const sub = category.subcategories.find((s) => s.tx_slug === filters.subcategory);
    if (sub) return sub.nb_subcategory ?? 'Subcategoría';
  }
  return 'Subcategoría';
}

function priceLabel(filters: ProductFilters, fmt: (amount: number) => string): string {
  const { minPrice, maxPrice } = filters;
  if (minPrice != null && maxPrice != null) return `${fmt(minPrice)} – ${fmt(maxPrice)}`;
  if (minPrice != null) return `Desde ${fmt(minPrice)}`;
  return `Hasta ${fmt(maxPrice as number)}`;
}

function ListMessage({
  colors,
  title,
  subtitle,
  action,
}: {
  colors: ThemeColors;
  title: string;
  subtitle: string;
  action?: { label: string; icon?: typeof RefreshCcw; onPress: () => void };
}) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 16 }}>
      <PackageSearch size={44} color={colors.muted} strokeWidth={1.6} />
      <Txt variant="section" colors={colors} style={{ marginTop: 12, textAlign: 'center' }}>
        {title}
      </Txt>
      <Txt variant="body" color="muted" colors={colors} style={{ marginTop: 4, textAlign: 'center' }}>
        {subtitle}
      </Txt>
      {action && (
        <View style={{ marginTop: 20 }}>
          <Button label={action.label} icon={action.icon} fullWidth={false} onPress={action.onPress} colors={colors} />
        </View>
      )}
    </View>
  );
}

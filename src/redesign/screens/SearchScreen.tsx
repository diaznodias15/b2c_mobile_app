import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Clock, PackageSearch, ScanBarcode, Search as SearchIcon, TriangleAlert, X } from 'lucide-react-native';

import { getProductSearch } from '@/api/services/products.services';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useListAddToCart } from '@/hooks/useListAddToCart';
import { useRefreshControl } from '@/hooks/useRefreshControl';
import { useSafePush } from '@/hooks/useSafePush';
import { selectEffectiveBranchId, useBranchStore } from '@/store/branch.store';
import { useThemeColors } from '@/store/config.store';
import { useDepartmentStore } from '@/store/department.store';
import { useSearchHistoryStore } from '@/store/searchHistory.store';
import { hexToRgba, type ThemeColors } from '@/theme/colors';
import type { Product } from '@/types/whitelabel';
import { getApproximationNotice } from '@/utils/searchApproximation';

import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { BottomTabs } from '../components/bottom-tabs';
import { ProductListItem } from '../components/ProductListItem';
import { ProductListItemSkeleton } from '../components/ProductListItemSkeleton';
import { Chip } from '../ui/Chip';
import { MIN_TOUCH, TYPE } from '../ui/tokens';
import { Txt } from '../ui/Txt';

/** Mínimo de caracteres para disparar la búsqueda (mismo mínimo que valida `getProductSearch`). */
const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 400;

/**
 * Buscar del rediseño. Misma lógica que `search.tsx` (búsqueda con debounce de 400 ms y mínimo de
 * 3 letras, scroll infinito por `next_page`, sede en la query key) más lo que hace útil una
 * búsqueda en e-commerce:
 *
 *  - **Búsquedas recientes** (chips, persistidas en el dispositivo; se guardan al enviar la
 *    búsqueda con el teclado o al abrir un resultado) y "Explora por categoría" cuando no hay texto,
 *    en lugar de solo "Escribe el nombre de un producto…".
 *  - **Enfoque automático** si se llega desde el buscador de la navbar del Home (`?focus=1`).
 *  - Contador de resultados ("N resultados") y, sin resultados, sugerencias para seguir explorando.
 *  - Campo de 48 dp con botón de borrar de 48 dp (antes un icono de 18 px).
 */
export default function SearchScreen() {
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const push = useSafePush();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const branchId = useBranchStore(selectEffectiveBranchId);
  const handleAddToCart = useListAddToCart();
  const refreshControl = useRefreshControl();

  const history = useSearchHistoryStore((s) => s.queries);
  const addToHistory = useSearchHistoryStore((s) => s.add);
  const removeFromHistory = useSearchHistoryStore((s) => s.remove);
  const clearHistory = useSearchHistoryStore((s) => s.clear);
  const departments = useDepartmentStore((s) => s.departments);

  const [query, setQuery] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const debouncedQuery = useDebouncedValue(query.trim(), DEBOUNCE_MS);
  const isQueryValid = debouncedQuery.length >= MIN_QUERY_LENGTH;

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['product-search', branchId, debouncedQuery],
    queryFn: ({ pageParam }) => getProductSearch({ branch: branchId as number, product: debouncedQuery, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.pagination.next_page ?? undefined,
    enabled: branchId !== null && isQueryValid,
  });

  const products = data?.pages.flatMap((page) => page.items) ?? [];
  const total = data?.pages[0]?.pagination.total;
  const showSkeleton = isQueryValid && isLoading;
  // El backend mostró productos similares porque lo escrito no dio resultados: se avisa SIEMPRE y
  // esa respuesta es de una sola página (no se pagina).
  const approximation = isQueryValid ? (data?.pages[0]?.approximation ?? null) : null;

  // Estable con `useCallback`: las filas están memoizadas y reciben estas funciones como props.
  const handlePressProduct = useCallback(
    (product: Product) => {
      addToHistory(debouncedQuery);
      push(`/product/${product.tx_slug}`);
    },
    [push, addToHistory, debouncedQuery]
  );

  const renderItem = useCallback(
    ({ item }: { item: Product }) => (
      <ProductListItem product={item} colors={colors} onPress={handlePressProduct} onAddToCart={handleAddToCart} />
    ),
    [colors, handlePressProduct, handleAddToCart]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 8, gap: 12 }}>
        <Txt variant="title" colors={colors}>
          Buscar
        </Txt>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            minHeight: MIN_TOUCH + 4,
            paddingLeft: 14,
            paddingRight: 4,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.productCard,
          }}
        >
          <SearchIcon size={20} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar productos…"
            placeholderTextColor={colors.muted}
            autoFocus={focus === '1'}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            onSubmitEditing={() => addToHistory(query)}
            accessibilityLabel="Buscar productos"
            style={{ ...TYPE.body, flex: 1, minHeight: MIN_TOUCH, color: colors.foreground }}
          />
          {query.length > 0 && (
            <Pressable
              onPress={() => setQuery('')}
              accessibilityRole="button"
              accessibilityLabel="Borrar búsqueda"
              style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={20} color={colors.muted} />
            </Pressable>
          )}
          <Pressable
            onPress={() => setScannerOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Escanear código de barras"
            style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}
          >
            <ScanBarcode size={22} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={showSkeleton ? [] : products}
        keyExtractor={(item) => String(item.id)}
        style={{ flex: 1 }}
        refreshControl={refreshControl}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 10, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage && !approximation) void fetchNextPage();
        }}
        renderItem={renderItem}
        ListHeaderComponent={
          approximation && !showSkeleton && products.length > 0 ? (
            <View
              accessibilityRole="alert"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                padding: 12,
                borderRadius: 12,
                backgroundColor: hexToRgba(colors.warning, 0.14),
                marginBottom: 2,
              }}
            >
              <TriangleAlert size={18} color={colors.warning} />
              <View style={{ flex: 1 }}>
                <Txt variant="label" colors={colors} style={{ fontWeight: '500' }}>
                  {getApproximationNotice(approximation, query)}
                </Txt>
              </View>
            </View>
          ) : isQueryValid && !showSkeleton && total != null && products.length > 0 ? (
            <Txt variant="caption" color="muted" colors={colors} style={{ marginBottom: 2 }}>
              {total} {total === 1 ? 'resultado' : 'resultados'} para «{debouncedQuery}»
            </Txt>
          ) : null
        }
        ListEmptyComponent={
          showSkeleton ? (
            <View style={{ gap: 10 }}>
              {[0, 1, 2, 3].map((i) => (
                <ProductListItemSkeleton key={i} colors={colors} />
              ))}
            </View>
          ) : isQueryValid ? (
            <NoResults colors={colors} query={query.trim()} departments={departments} onPickDepartment={(slug) => push(`/products/${slug}`)} />
          ) : (
            <Discover
              colors={colors}
              typedTooShort={query.trim().length > 0}
              history={history}
              departments={departments}
              onPickHistory={setQuery}
              onRemoveHistory={removeFromHistory}
              onClearHistory={clearHistory}
              onPickDepartment={(slug) => push(`/products/${slug}`)}
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
      <BottomTabs />

      {/* El código leído se usa como término de búsqueda (no hay endpoint propio). */}
      <BarcodeScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetect={setQuery}
        colors={colors}
      />
    </View>
  );
}

/** Estado sin texto (o con menos de 3 letras): recientes + categorías para explorar. */
function Discover({
  colors,
  typedTooShort,
  history,
  departments,
  onPickHistory,
  onRemoveHistory,
  onClearHistory,
  onPickDepartment,
}: {
  colors: ThemeColors;
  typedTooShort: boolean;
  history: string[];
  departments: { id: number; nb_department: string; tx_slug: string }[];
  onPickHistory: (query: string) => void;
  onRemoveHistory: (query: string) => void;
  onClearHistory: () => void;
  onPickDepartment: (slug: string) => void;
}) {
  return (
    <View style={{ gap: 24, paddingTop: 8 }}>
      {typedTooShort ? (
        <Txt variant="body" color="muted" colors={colors}>
          Escribe al menos {MIN_QUERY_LENGTH} letras para buscar.
        </Txt>
      ) : (
        <Txt variant="body" color="muted" colors={colors}>
          Escribe el nombre de un producto, una marca o un principio activo.
        </Txt>
      )}

      {history.length > 0 && (
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Txt variant="section" colors={colors}>
              Búsquedas recientes
            </Txt>
            <Pressable
              onPress={onClearHistory}
              accessibilityRole="button"
              accessibilityLabel="Borrar búsquedas recientes"
              style={{ minHeight: MIN_TOUCH, justifyContent: 'center' }}
            >
              <Txt variant="label" color="primary" colors={colors}>
                Borrar
              </Txt>
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {history.map((item) => (
              <HistoryChip
                key={item}
                label={item}
                colors={colors}
                onPress={() => onPickHistory(item)}
                onRemove={() => onRemoveHistory(item)}
              />
            ))}
          </View>
        </View>
      )}

      {departments.length > 0 && (
        <View style={{ gap: 8 }}>
          <Txt variant="section" colors={colors}>
            Explora por categoría
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {departments.map((department) => (
              <Chip
                key={department.id}
                label={department.nb_department}
                onPress={() => onPickDepartment(department.tx_slug)}
                colors={colors}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

/** Búsqueda reciente: tocar el texto la repite; la X (de 48 dp de alto) la quita. */
function HistoryChip({
  label,
  colors,
  onPress,
  onRemove,
}: {
  label: string;
  colors: ThemeColors;
  onPress: () => void;
  onRemove: () => void;
}) {
  return (
    <View
      style={{
        height: 40,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.productCard,
        overflow: 'hidden',
      }}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Buscar ${label}`}
        hitSlop={{ top: 4, bottom: 4 }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 12, height: '100%' }}
      >
        <Clock size={14} color={colors.muted} />
        <Txt variant="label" colors={colors} numberOfLines={1} style={{ maxWidth: 160 }}>
          {label}
        </Txt>
      </Pressable>
      <Pressable
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel={`Quitar ${label} de las búsquedas recientes`}
        hitSlop={{ top: 4, bottom: 4 }}
        style={{ width: 36, height: '100%', alignItems: 'center', justifyContent: 'center' }}
      >
        <X size={14} color={colors.muted} />
      </Pressable>
    </View>
  );
}

function NoResults({
  colors,
  query,
  departments,
  onPickDepartment,
}: {
  colors: ThemeColors;
  query: string;
  departments: { id: number; nb_department: string; tx_slug: string }[];
  onPickDepartment: (slug: string) => void;
}) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 40, paddingHorizontal: 8, gap: 6 }}>
      <PackageSearch size={44} color={colors.muted} strokeWidth={1.6} />
      <Txt variant="section" colors={colors} style={{ textAlign: 'center', marginTop: 6 }}>
        Sin resultados
      </Txt>
      <Txt variant="body" color="muted" colors={colors} style={{ textAlign: 'center' }}>
        No encontramos productos para «{query}». Revisa la ortografía o prueba con otra palabra.
      </Txt>
      {departments.length > 0 && (
        <View style={{ marginTop: 16, gap: 8, alignSelf: 'stretch' }}>
          <Txt variant="label" color="muted" colors={colors} style={{ textAlign: 'center' }}>
            O explora por categoría
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {departments.map((department) => (
              <Chip
                key={department.id}
                label={department.nb_department}
                onPress={() => onPickDepartment(department.tx_slug)}
                colors={colors}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

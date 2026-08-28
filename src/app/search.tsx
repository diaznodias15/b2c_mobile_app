import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search as SearchIcon, X, Clock } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import AppTabs from '@/components/app-tabs';
import { useBranchStore } from '@/store';
import { useProductSearch } from '@/features/products/hooks/useProductSearch';
import { ProductGrid } from '@/features/products/components/ProductGrid';
import type { Product } from '@/features/products/utils/adapters';

const MIN_CHARS = 3;

/**
 * Pantalla de búsqueda.
 *
 *  - Input autofocus con X para limpiar
 *  - Hook `useProductSearch` (debounce 400ms, mín 3 chars)
 *  - Grid 2x con infinite scroll
 *  - Empty state: pide 3+ chars, o "sin resultados"
 *  - Sin recent searches por ahora (entra en fase posterior con AsyncStorage)
 */
export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(params.q ?? '');
  const branchId = useBranchStore((s) => s.selectedBranch?.value) ?? null;

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    debouncedQuery,
    isReady,
  } = useProductSearch({ branchId, query });

  const products: Product[] =
    data?.pages.flatMap((p) => p.items) ?? [];
  const total = data?.pages?.[0]?.pagination?.total;
  const trimmed = query.trim();
  const showInitialHint = trimmed.length > 0 && !isReady;

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-4 pt-3 pb-2 flex-row items-center gap-2 border-b border-backgroundElement">
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            className="h-9 w-9 items-center justify-center rounded-full bg-backgroundElement"
            accessibilityLabel="Volver"
          >
            <X size={18} color="#1A1A2E" />
          </Pressable>
          <View className="flex-1 flex-row items-center gap-2 bg-backgroundElement rounded-[14px] px-3 py-2">
            <SearchIcon size={18} color="#60646C" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              autoFocus
              returnKeyType="search"
              placeholder="¿Qué buscás?"
              placeholderTextColor="#60646C"
              className="flex-1 text-sm text-foreground"
            />
            {query.length > 0 ? (
              <Pressable
                onPress={() => setQuery('')}
                hitSlop={6}
                accessibilityLabel="Limpiar búsqueda"
              >
                <X size={16} color="#60646C" />
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Body */}
        {!branchId ? (
          <View className="flex-1 items-center justify-center px-8">
            <Clock size={28} color="#60646C" />
            <Text className="text-sm font-bold text-foreground mt-3 text-center">
              Selecciona una sede
            </Text>
            <Text className="text-xs text-muted text-center mt-1">
              Antes de buscar elegí desde qué sede querés ver disponibilidad.
            </Text>
          </View>
        ) : showInitialHint ? (
          <View className="flex-1 items-center justify-center px-8">
            <SearchIcon size={28} color="#60646C" />
            <Text className="text-sm text-muted text-center mt-3">
              Escribí al menos {MIN_CHARS} caracteres para buscar.
            </Text>
          </View>
        ) : isError ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-sm text-muted text-center">
              No pudimos completar la búsqueda. Probá de nuevo.
            </Text>
          </View>
        ) : isReady && !isLoading && products.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <SearchIcon size={28} color="#60646C" />
            <Text className="text-sm font-bold text-foreground mt-3 text-center">
              Sin resultados para "{debouncedQuery}"
            </Text>
            <Text className="text-xs text-muted text-center mt-1">
              Probá con otra palabra o revisá la ortografía.
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingVertical: 8 }}
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
            {isReady ? (
              <Text className="text-xs text-muted px-4 mb-1">
                {isLoading
                  ? 'Buscando…'
                  : total != null
                    ? `${total} resultados`
                    : `${products.length} resultados`}
              </Text>
            ) : null}
            <ProductGrid
              products={products}
              isLoading={isLoading}
              isFetchingMore={isFetchingNextPage}
              hasMore={hasNextPage ?? false}
              onLoadMore={() => void fetchNextPage()}
              sort="relevance"
              emptyText=""
            />
          </ScrollView>
        )}
      </SafeAreaView>
      <AppTabs />
    </View>
  );
}

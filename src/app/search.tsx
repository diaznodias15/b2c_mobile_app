import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInfiniteQuery } from '@tanstack/react-query';
import { PackageSearch, Search as SearchIcon, X } from 'lucide-react-native';

import { BottomTabs } from '@/components/bottom-tabs';
import { ProductListItem } from '@/components/ProductListItem';
import { ProductListItemSkeleton } from '@/components/ProductListItemSkeleton';
import { getProductSearch } from '@/api/services/products.services';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useBranchStore, selectEffectiveBranchId } from '@/store/branch.store';
import { useCartStore } from '@/store/cart.store';
import { useThemeColors } from '@/store/config.store';
import type { ThemeColors } from '@/theme/colors';
import type { Product } from '@/types/whitelabel';

/** Mínimo de caracteres para disparar la búsqueda (mismo mínimo que valida `getProductSearch`). */
const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 400;

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const branchId = useBranchStore(selectEffectiveBranchId);
  const addProduct = useCartStore((s) => s.addProduct);

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query.trim(), DEBOUNCE_MS);
  const isQueryValid = debouncedQuery.length >= MIN_QUERY_LENGTH;

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['product-search', branchId, debouncedQuery],
    queryFn: ({ pageParam }) =>
      getProductSearch({ branch: branchId as number, product: debouncedQuery, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.pagination.next_page ?? undefined,
    enabled: branchId !== null && isQueryValid,
  });

  const products = data?.pages.flatMap((page) => page.items) ?? [];
  const showSkeleton = isQueryValid && isLoading;

  const handleAddToCart = (product: Product) => {
    if (branchId === null) return;
    addProduct({
      tx_slug: product.tx_slug,
      product_id: product.id,
      branch_id: branchId,
      nb_product: product.nb_product,
      nb_brand: product.nb_brand,
      tx_img_url: product.tx_img_url,
      pri_product_final_price: product.pri_product_final_price,
      qty: 1,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 24, paddingBottom: 12 }}>
        <Text
          style={{ fontSize: 22, fontWeight: '700', color: colors.foreground, marginBottom: 12 }}
        >
          Buscar
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: colors.section,
            borderRadius: 12,
            paddingHorizontal: 12,
            height: 46,
          }}
        >
          <SearchIcon size={18} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar productos..."
            placeholderTextColor={colors.muted}
            style={{ flex: 1, fontSize: 15, color: colors.foreground }}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Limpiar búsqueda">
              <X size={18} color={colors.muted} />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={showSkeleton ? [] : products}
        keyExtractor={(item) => String(item.id)}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, gap: 10, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        renderItem={({ item }) => (
          <ProductListItem
            product={item}
            colors={colors}
            onPress={() => router.push(`/product/${item.tx_slug}`)}
            onAddToCart={() => handleAddToCart(item)}
          />
        )}
        ListEmptyComponent={
          showSkeleton ? (
            <View style={{ gap: 10 }}>
              {[0, 1, 2, 3].map((i) => (
                <ProductListItemSkeleton key={i} colors={colors} />
              ))}
            </View>
          ) : (
            <SearchEmptyState colors={colors} hasTypedEnough={isQueryValid} query={query} />
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
    </View>
  );
}

function SearchEmptyState({
  colors,
  hasTypedEnough,
  query,
}: {
  colors: ThemeColors;
  hasTypedEnough: boolean;
  query: string;
}) {
  if (!hasTypedEnough) {
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
        <SearchIcon size={40} color={colors.muted} strokeWidth={1.6} />
        <Text style={{ fontSize: 15, color: colors.muted, textAlign: 'center', marginTop: 12 }}>
          {query.trim().length === 0
            ? 'Escribí el nombre de un producto para empezar a buscar.'
            : `Escribí al menos ${MIN_QUERY_LENGTH} letras para buscar.`}
        </Text>
      </View>
    );
  }

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
        Sin resultados
      </Text>
      <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 4 }}>
        No encontramos productos para &quot;{query}&quot;.
      </Text>
    </View>
  );
}

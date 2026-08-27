import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';

import { ProductCardMobile } from './ProductCardMobile';
import { sortProducts, type SortOption } from '@/features/products/utils/adapters';
import type { Product } from '@/types/whitelabel';

type Props = {
  products: Product[];
  isLoading?: boolean;
  isFetchingMore?: boolean;
  hasNextPage?: boolean;
  onEndReached?: () => void;
  /** Sort option aplicada client-side sobre los productos acumulados. */
  sort?: SortOption;
  emptyText?: string;
};

/**
 * Grid 2 columnas de productos. Soporta infinite scroll via
 * `onEndReached` + `hasNextPage` + `isFetchingMore`.
 *
 * El sort se aplica client-side sobre TODOS los productos acumulados
 * (si el backend ya viene ordenado, no hace nada; el usuario
 * puede re-ordenar y vuelve a renderizar).
 */
export function ProductGrid({
  products,
  isLoading,
  isFetchingMore,
  hasNextPage,
  onEndReached,
  sort = 'relevance',
  emptyText = 'No encontramos productos con esos filtros.',
}: Props) {
  const sorted = useMemo(() => sortProducts(products, sort), [products, sort]);

  if (isLoading) {
    return (
      <View className="py-10 items-center">
        <ActivityIndicator color="#0f766e" />
      </View>
    );
  }

  if (sorted.length === 0) {
    return (
      <View className="py-10 items-center px-8">
        <Text className="text-sm text-muted text-center">{emptyText}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={sorted}
      numColumns={2}
      keyExtractor={keyExtractor}
      columnWrapperStyle={{ paddingHorizontal: 16, gap: 12 }}
      contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
      renderItem={renderCard}
      scrollEnabled={false}
      ListFooterComponent={
        isFetchingMore ? (
          <View className="py-4 items-center">
            <ActivityIndicator color="#0f766e" />
          </View>
        ) : !hasNextPage && sorted.length > 0 ? (
          <View className="py-4 items-center">
            <Text className="text-[11px] text-muted">Fin del catálogo</Text>
          </View>
        ) : null
      }
      onEndReached={hasNextPage ? onEndReached : undefined}
      onEndReachedThreshold={0.4}
    />
  );
}

function keyExtractor(p: Product): string {
  return String(p.id);
}

const renderCard: ListRenderItem<Product> = ({ item }) => (
  <ProductCardMobile product={item} />
);

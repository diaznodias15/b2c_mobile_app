import {
  ActivityIndicator,
  FlatList,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';

import { useTopProducts } from '@/features/home/hooks/useHomeData';
import { useBranchStore } from '@/store';
import { TopProductCard } from './TopProductCard';
import type { TopProduct } from '@/types/whitelabel';

type Props = {
  /** Título de la sección (default "Más vendidos"). */
  title?: string;
};

/**
 * Carrusel horizontal de productos más vendidos de la sede.
 * Llama a `/api/products/top-products?branch=<id>` y muestra
 * cards de 160px de ancho.
 *
 * React Query se re-fetcha automáticamente cuando cambia `branchId`
 * (porque está en el `queryKey`), no hace falta `useEffect` extra.
 */
export function TopProductsCarousel({ title = 'Más vendidos' }: Props) {
  const branchId = useBranchStore((s) => s.selectedBranch?.value) ?? null;
  const { data, isLoading, isError } = useTopProducts(branchId);

  if (!branchId) return null;

  if (isLoading) {
    return (
      <Section title={title}>
        <View className="px-4 py-6 items-center">
          <ActivityIndicator color="#0f766e" />
        </View>
      </Section>
    );
  }

  if (isError) {
    return (
      <Section title={title}>
        <View className="px-4 py-6">
          <Text className="text-xs text-muted text-center">
            No pudimos cargar los productos destacados.
          </Text>
        </View>
      </Section>
    );
  }

  if (!data || data.length === 0) {
    return null; // No mostrar sección vacía
  }

  return (
    <Section title={title}>
      <FlatList
        horizontal
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderCard}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
      />
    </Section>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mt-4">
      <View className="px-4 mb-2 flex-row items-center justify-between">
        <Text className="text-base font-bold text-foreground">{title}</Text>
      </View>
      {children}
    </View>
  );
}

function keyExtractor(p: TopProduct): string {
  return String(p.id);
}

const renderCard: ListRenderItem<TopProduct> = ({ item }) => (
  <TopProductCard product={item} />
);

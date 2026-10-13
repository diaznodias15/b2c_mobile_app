import { useCallback } from 'react';
import { ScrollView, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { getTopProducts } from '@/api/services/products.services';
import { useListAddToCart } from '@/hooks/useListAddToCart';
import { useSafePush } from '@/hooks/useSafePush';
import { selectEffectiveBranchId, useBranchStore } from '@/store/branch.store';
import type { ThemeColors } from '@/theme/colors';
import type { Product } from '@/types/whitelabel';

import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from './ProductCardSkeleton';
import { SectionHeader } from './SectionHeader';

/**
 * Carrusel de productos destacados (Home) o de la marca (detalle). **Mismo contrato que
 * `@/components/TopProducts`** (`colors`, `title`, `subtitle`, `brand`, `excludeSlug`).
 *
 * Qué cambia: usa el `SectionHeader` v2 y el gutter de 16, y el "agregar al carrito" ya no está
 * copiado aquí: usa el hook compartido `useListAddToCart` (el original repetía el mismo bloque
 * que Buscar y el listado). La consulta y la regla de "no mostrar nada si no hay productos" son
 * las mismas.
 */
export function TopProducts({
  colors,
  title = 'Más vendidos',
  subtitle = 'Los productos favoritos de nuestros clientes.',
  brand,
  excludeSlug,
}: {
  colors: ThemeColors;
  /** Título/subtítulo personalizables — ej. "relacionados" en el detalle de producto. */
  title?: string;
  subtitle?: string;
  /** `brand_slug` para filtrar por marca (ej. relacionados en el detalle de producto). */
  brand?: string;
  /** Oculta un producto puntual del carrusel (ej. el que ya se está viendo en el detalle). */
  excludeSlug?: string;
}) {
  const push = useSafePush();
  const branchId = useBranchStore(selectEffectiveBranchId);
  const handleAddToCart = useListAddToCart();

  const { data, isLoading } = useQuery({
    queryKey: ['top-products', branchId, brand ?? null],
    queryFn: () => getTopProducts(branchId as number, { brand }),
    enabled: branchId !== null,
  });

  const products = data?.filter((p) => p.tx_slug !== excludeSlug);

  // Estable con `useCallback`: se pasa a `ProductCard` (memoizado) para todo el carrusel. Va ANTES
  // de los `return null` (reglas de hooks).
  const handlePressProduct = useCallback((product: Product) => push(`/product/${product.tx_slug}`), [push]);

  if (branchId === null) return null;
  if (!isLoading && (!products || products.length === 0)) return null;

  return (
    <View style={{ marginTop: 24 }}>
      <View style={{ paddingHorizontal: 16 }}>
        <SectionHeader title={title} subtitle={subtitle} colors={colors} />
      </View>

      {isLoading ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        >
          {[0, 1, 2].map((i) => (
            <ProductCardSkeleton key={i} colors={colors} />
          ))}
        </ScrollView>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        >
          {products?.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              colors={colors}
              onPress={handlePressProduct}
              onAddToCart={handleAddToCart}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

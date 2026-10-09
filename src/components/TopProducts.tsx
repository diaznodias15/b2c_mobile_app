import { useCallback } from 'react';
import { ScrollView, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { useSafePush } from '@/hooks/useSafePush';
import { ProductCardSkeleton } from '@/components/ProductCardSkeleton';
import { SectionHeader } from '@/components/SectionHeader';
import { ProductCard } from '@/components/ProductCard';
import { getTopProducts } from '@/api/services/products.services';
import { useBranchStore, selectEffectiveBranchId } from '@/store/branch.store';
import { useCartStore } from '@/store/cart.store';
import { useToastStore } from '@/store/toast.store';
import type { ThemeColors } from '@/theme/colors';
import type { Product } from '@/types/whitelabel';
import { toAvailability } from '@/utils/cartStock';

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
  const addProduct = useCartStore((s) => s.addProduct);
  const showToast = useToastStore((s) => s.show);

  const { data, isLoading } = useQuery({
    queryKey: ['top-products', branchId, brand ?? null],
    queryFn: () => getTopProducts(branchId as number, { brand }),
    enabled: branchId !== null,
  });

  const products = data?.filter((p) => p.tx_slug !== excludeSlug);

  // Estables con `useCallback`: se pasan a `ProductCard` (memoizado) para
  // todo el carrusel — si fueran arrow functions nuevas en cada render de
  // `TopProducts`, el memo de cada card no serviría de nada. Van ANTES de
  // los `return null` de abajo — los hooks no pueden llamarse condicional
  // ni después de un return temprano (reglas de hooks de React).
  const handleAddToCart = useCallback(
    async (product: Product): Promise<boolean> => {
      if (branchId === null) return false;
      const added = await addProduct({
        tx_slug: product.tx_slug,
        product_id: product.id,
        branch_id: branchId,
        nb_product: product.nb_product,
        nb_brand: product.nb_brand,
        tx_img_url: product.tx_img_url,
        pri_product_final_price: product.pri_product_final_price,
        pri_product_price: product.pri_product_price,
        qty_discount: product.qty_discount,
        qty_tax: product.qty_tax,
        qty_availability: toAvailability(product.qty_product),
        qty: 1,
      });
      // Con sesión `added` es la respuesta de la API: el toast y la animación solo
      // salen si el servidor aceptó el cambio (si no, `addProduct` ya avisó el motivo).
      if (added) showToast('Producto agregado al carrito');
      return added;
    },
    [addProduct, branchId, showToast]
  );

  const handlePressProduct = useCallback(
    (product: Product) => push(`/product/${product.tx_slug}`),
    [push]
  );

  if (branchId === null) return null;
  if (!isLoading && (!products || products.length === 0)) return null;

  return (
    <View style={{ marginTop: 24 }}>
      <View style={{ paddingHorizontal: 24 }}>
        <SectionHeader title={title} subtitle={subtitle} colors={colors} />
      </View>

      {isLoading ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
        >
          {[0, 1, 2].map((i) => (
            <ProductCardSkeleton key={i} colors={colors} />
          ))}
        </ScrollView>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
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

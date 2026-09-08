import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { ProductCardSkeleton } from '@/components/ProductCardSkeleton';
import { SectionHeader } from '@/components/SectionHeader';
import { ProductCard } from '@/components/ProductCard';
import { getTopProducts } from '@/api/services/products.services';
import { useBranchStore, selectEffectiveBranchId } from '@/store/branch.store';
import { useCartStore } from '@/store/cart.store';
import type { ThemeColors } from '@/theme/colors';
import type { Product } from '@/types/whitelabel';

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
  const router = useRouter();
  const branchId = useBranchStore(selectEffectiveBranchId);
  const addProduct = useCartStore((s) => s.addProduct);

  const { data, isLoading } = useQuery({
    queryKey: ['top-products', branchId, brand ?? null],
    queryFn: () => getTopProducts(branchId as number, { brand }),
    enabled: branchId !== null,
  });

  const products = data?.filter((p) => p.tx_slug !== excludeSlug);

  if (branchId === null) return null;
  if (!isLoading && (!products || products.length === 0)) return null;

  const handleAddToCart = (product: Product) => {
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
              onPress={() => router.push(`/product/${product.tx_slug}`)}
              onAddToCart={() => handleAddToCart(product)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

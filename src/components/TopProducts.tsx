import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { SectionHeader } from '@/components/SectionHeader';
import { ProductCard, PRODUCT_CARD_WIDTH } from '@/components/ProductCard';
import { getTopProducts } from '@/api/services/products.services';
import { useBranchStore, selectEffectiveBranchId } from '@/store/branch.store';
import { useCartStore } from '@/store/cart.store';
import type { ThemeColors } from '@/theme/colors';
import type { Product } from '@/types/whitelabel';

export function TopProducts({ colors }: { colors: ThemeColors }) {
  const branchId = useBranchStore(selectEffectiveBranchId);
  const addProduct = useCartStore((s) => s.addProduct);

  const { data: products, isLoading } = useQuery({
    queryKey: ['top-products', branchId],
    queryFn: () => getTopProducts(branchId as number),
    enabled: branchId !== null,
  });

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
        <SectionHeader
          title="Más vendidos"
          subtitle="Los productos favoritos de nuestros clientes."
          colors={colors}
        />
      </View>

      {isLoading ? (
        <View style={{ height: PRODUCT_CARD_WIDTH, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
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
              // TODO: navegar a /product/[slug] cuando exista esa pantalla (Fase 3)
              onPress={() => {}}
              onAddToCart={() => handleAddToCart(product)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

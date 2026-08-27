import { Image, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  basePrice,
  discountPercent,
  finalPrice,
  hasDiscount,
} from '@/features/home/utils/adapters';
import { formatPrice } from '@/utils/currency';
import type { TopProduct } from '@/types/whitelabel';

type Props = {
  product: TopProduct;
};

/**
 * Card de producto para el carrusel horizontal.
 * 160px de ancho. Click → /producto/:slug (Fase 3, hoy es stub).
 */
const CARD_WIDTH = 160;

export function TopProductCard({ product }: Props) {
  const router = useRouter();
  const showDiscount = hasDiscount(product);
  const discount = discountPercent(product);

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/producto/[slug]' as any,
          params: { slug: product.tx_slug },
        })
      }
      style={{ width: CARD_WIDTH }}
      className="bg-backgroundElement rounded-[14px] overflow-hidden"
      accessibilityRole="button"
      accessibilityLabel={`Ver detalle de ${product.nb_product}`}
    >
      <View className="aspect-square bg-white">
        {product.tx_img_url ? (
          <Image
            source={{ uri: product.tx_img_url }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-xs text-muted">Sin imagen</Text>
          </View>
        )}
        {showDiscount ? (
          <View className="absolute top-1.5 left-1.5 bg-danger rounded-md px-1.5 py-0.5">
            <Text className="text-[10px] font-bold text-primary-foreground">
              -{discount}%
            </Text>
          </View>
        ) : null}
      </View>
      <View className="p-2 gap-1">
        <Text
          className="text-[11px] text-muted"
          numberOfLines={1}
        >
          {product.nb_brand}
        </Text>
        <Text
          className="text-xs font-semibold text-foreground"
          numberOfLines={2}
          style={{ minHeight: 32 }}
        >
          {product.nb_product}
        </Text>
        <View className="mt-0.5">
          {showDiscount ? (
            <Text className="text-[10px] text-muted line-through">
              {formatPrice(basePrice(product), 'USD')}
            </Text>
          ) : null}
          <Text className="text-sm font-bold text-foreground">
            {formatPrice(finalPrice(product), 'USD')}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

import { Image, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  basePrice,
  discountPercent,
  finalPrice,
  hasDiscount,
} from '@/features/home/utils/adapters';
import { formatDualCurrency, formatPrice } from '@/utils/currency';
import { useConfigStore } from '@/store';
import type { Product } from '@/types/whitelabel';

type Props = {
  product: Product;
  /** Ancho de la card (default 160, usado en el carrusel horizontal). */
  width?: number;
  /** Compacto: oculta la marca (default false). */
  compact?: boolean;
};

/**
 * Card de producto. Se usa en:
 *  - TopProductsCarousel (width 160)
 *  - ProductGrid (flex 1, numColumns 2)
 *  - SearchResults
 *
 * Muestra: imagen, badge descuento, marca, nombre, precio USD grande
 * + Bs. compacto abajo (dual currency del whitelabel), y el precio
 * base tachado si hay descuento.
 */
export function ProductCardMobile({
  product,
  width = 160,
  compact = false,
}: Props) {
  const router = useRouter();
  const showDiscount = hasDiscount(product);
  const discount = discountPercent(product);
  const exchangeRateRaw = useConfigStore(
    (s) => s.appConfig?.amt_exchange_rate
  );
  const exchangeRate = exchangeRateRaw ? Number(exchangeRateRaw) : null;

  const dual = formatDualCurrency(finalPrice(product), exchangeRate);
  const baseDual = showDiscount
    ? formatDualCurrency(basePrice(product), exchangeRate)
    : null;

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/producto/[slug]' as any,
          params: { slug: product.tx_slug },
        })
      }
      style={[{ width }, compact ? null : { flex: 1 }]}
      className="bg-product-card rounded-[14px] overflow-hidden border border-border"
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
          <View className="absolute top-1.5 left-1.5 bg-warning rounded-md px-1.5 py-0.5">
            <Text className="text-[10px] font-bold text-foreground">
              -{discount}%
            </Text>
          </View>
        ) : null}
      </View>
      <View className="p-2 gap-1">
        {compact ? null : (
          <Text className="text-[11px] text-muted" numberOfLines={1}>
            {product.nb_brand}
          </Text>
        )}
        <Text
          className="text-xs font-semibold text-foreground"
          numberOfLines={2}
          style={{ minHeight: 32 }}
        >
          {product.nb_product}
        </Text>
        <View className="mt-0.5">
          {baseDual ? (
            <Text className="text-[10px] text-muted line-through">
              {baseDual.usd}
            </Text>
          ) : null}
          <Text
            className="text-sm font-bold text-foreground"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {dual.usd}
          </Text>
          {dual.bs ? (
            <Text className="text-[10px] text-muted">{dual.bs}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

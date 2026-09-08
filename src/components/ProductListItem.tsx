import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Check, Plus } from 'lucide-react-native';

import { DiscountBadge } from '@/components/DiscountBadge';
import { useAddToCartFlight } from '@/hooks/useAddToCartFlight';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { formatDisplayPrice } from '@/utils/currency';
import { getProductPricing } from '@/utils/pricing';
import type { ThemeColors } from '@/theme/colors';
import type { Product } from '@/types/whitelabel';

export const PRODUCT_LIST_ITEM_IMAGE_SIZE = 72;

/** Mismo fallback que `ProductCard` — imagen rota o `tx_img_url` vacío. */
const PLACEHOLDER_IMAGE = require('../../assets/images/unavailable-product-image.webp');

/**
 * Fila horizontal para listas de resultados (Buscar): imagen a la
 * izquierda, info al centro, botón de agregar a la derecha. Pensada
 * para escanear texto rápido — a diferencia de `ProductCard` (vertical,
 * más visual), que se usa en el Home/TopProducts donde el layout es en
 * fila horizontal de scroll o grid de descubrimiento.
 */
export function ProductListItem({
  product,
  colors,
  onPress,
  onAddToCart,
}: {
  product: Product;
  colors: ThemeColors;
  onPress: () => void;
  onAddToCart: () => void;
}) {
  const { basePrice, finalPrice, hasDiscount } = getProductPricing(product);
  const { displayCurrency, exchangeRate } = useDisplayCurrency();

  const [imageFailed, setImageFailed] = useState(false);
  const showPlaceholder = !product.tx_img_url || imageFailed;

  const { imageRef, isAdding, trigger } = useAddToCartFlight();

  const handleAddToCart = () => {
    const started = trigger(
      showPlaceholder ? PLACEHOLDER_IMAGE : { uri: product.tx_img_url as string }
    );
    if (started) onAddToCart();
  };

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: colors.productCard,
        borderRadius: 14,
        padding: 10,
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 6,
      }}
      accessibilityRole="button"
      accessibilityLabel={product.nb_product}
    >
      <View
        ref={imageRef}
        style={{
          width: PRODUCT_LIST_ITEM_IMAGE_SIZE,
          height: PRODUCT_LIST_ITEM_IMAGE_SIZE,
          borderRadius: 10,
          overflow: 'hidden',
          backgroundColor: colors.section,
        }}
      >
        <Image
          source={showPlaceholder ? PLACEHOLDER_IMAGE : { uri: product.tx_img_url }}
          style={{ width: '100%', height: '100%' }}
          contentFit="contain"
          onError={() => setImageFailed(true)}
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={1}
          style={{ fontSize: 11, fontWeight: '600', color: colors.muted, marginBottom: 2 }}
        >
          {product.nb_brand}
        </Text>
        <Text
          numberOfLines={2}
          style={{ fontSize: 13.5, fontWeight: '600', color: colors.foreground, lineHeight: 18 }}
        >
          {product.nb_product}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <Text style={{ fontSize: 14.5, fontWeight: '700', color: colors.foreground }}>
            {formatDisplayPrice(finalPrice, exchangeRate, displayCurrency)}
          </Text>
          {hasDiscount && (
            <>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.muted,
                  textDecorationLine: 'line-through',
                }}
              >
                {formatDisplayPrice(basePrice, exchangeRate, displayCurrency)}
              </Text>
              <DiscountBadge percent={product.qty_discount as number | string} colors={colors} size="sm" />
            </>
          )}
        </View>
      </View>

      <Pressable
        onPress={handleAddToCart}
        disabled={isAdding}
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primary,
          opacity: isAdding ? 0.7 : 1,
        }}
        accessibilityRole="button"
        accessibilityLabel={`Agregar ${product.nb_product} al carrito`}
      >
        {isAdding ? (
          <Check size={17} color={colors.onPrimary} strokeWidth={2.5} />
        ) : (
          <Plus size={17} color={colors.onPrimary} strokeWidth={2.5} />
        )}
      </Pressable>
    </Pressable>
  );
}

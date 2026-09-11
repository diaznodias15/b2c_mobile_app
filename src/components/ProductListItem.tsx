import { memo, useState } from 'react';
import { Image as RNImage, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Check, Plus } from 'lucide-react-native';

import { DiscountBadge } from '@/components/DiscountBadge';
import { useAddToCartFlight } from '@/hooks/useAddToCartFlight';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { formatDisplayPrice } from '@/utils/currency';
import { getProductPricing } from '@/utils/pricing';
import { UNAVAILABLE_PRODUCT_IMAGE } from '@/utils/localImages.generated';
import type { ThemeColors } from '@/theme/colors';
import type { Product } from '@/types/whitelabel';

export const PRODUCT_LIST_ITEM_IMAGE_SIZE = 72;

/**
 * Mismo fallback que `ProductCard` — imagen rota o `tx_img_url` vacío.
 * Data URI base64 embebido (ver el comentario largo en `ProductCard.tsx`).
 */
const PLACEHOLDER_IMAGE = { uri: UNAVAILABLE_PRODUCT_IMAGE };

/**
 * Fila horizontal para listas de resultados (Buscar): imagen a la
 * izquierda, info al centro, botón de agregar a la derecha. Pensada
 * para escanear texto rápido — a diferencia de `ProductCard` (vertical,
 * más visual), que se usa en el Home/TopProducts donde el layout es en
 * fila horizontal de scroll o grid de descubrimiento.
 *
 * `React.memo`: el caso de uso real es `search.tsx`, donde tipear en el
 * buscador re-renderiza la pantalla en cada tecla — sin memo, cada fila
 * visible de resultados se re-renderiza aunque su `product` no cambió.
 * `onPress`/`onAddToCart` reciben el `product` como argumento (en vez de
 * venir ya atados a uno) para que el padre pueda pasar UNA función
 * estable con `useCallback` para toda la lista.
 */
export const ProductListItem = memo(function ProductListItem({
  product,
  colors,
  onPress,
  onAddToCart,
}: {
  product: Product;
  colors: ThemeColors;
  onPress: (product: Product) => void;
  onAddToCart: (product: Product) => void;
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
    if (started) onAddToCart(product);
  };

  return (
    <Pressable
      onPress={() => onPress(product)}
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
        {showPlaceholder ? (
          <RNImage
            source={PLACEHOLDER_IMAGE}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        ) : (
          <Image
            source={{ uri: product.tx_img_url ?? undefined }}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
            onError={() => setImageFailed(true)}
          />
        )}
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
});

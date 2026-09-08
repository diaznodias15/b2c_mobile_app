import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Plus } from 'lucide-react-native';

import { useConfigStore } from '@/store/config.store';
import { useCurrencyStore } from '@/store/currency.store';
import { formatDisplayPrice } from '@/utils/currency';
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
  const finalPrice = Number(product.pri_product_final_price);
  const basePrice = Number(product.pri_product_price);
  const hasDiscount = Boolean(product.qty_discount) && basePrice > finalPrice;

  const displayCurrency = useCurrencyStore((s) => s.displayCurrency);
  const exchangeRate = useConfigStore((s) => s.appConfig?.amt_exchange_rate);

  const [imageFailed, setImageFailed] = useState(false);
  const showPlaceholder = !product.tx_img_url || imageFailed;

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
              <View
                style={{
                  backgroundColor: colors.danger,
                  borderRadius: 6,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFFFFF' }}>
                  -{product.qty_discount}%
                </Text>
              </View>
            </>
          )}
        </View>
      </View>

      <Pressable
        onPress={onAddToCart}
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primary,
        }}
        accessibilityRole="button"
        accessibilityLabel={`Agregar ${product.nb_product} al carrito`}
      >
        <Plus size={17} color={colors.onPrimary} strokeWidth={2.5} />
      </Pressable>
    </Pressable>
  );
}

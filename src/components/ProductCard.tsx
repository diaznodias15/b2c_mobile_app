import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Plus } from 'lucide-react-native';

import { formatPrice } from '@/utils/currency';
import type { ThemeColors } from '@/theme/colors';
import type { Product } from '@/types/whitelabel';

export const PRODUCT_CARD_WIDTH = 148;

/**
 * Fallback cuando `tx_img_url` viene null/vacío O la URL está rota (404,
 * timeout, etc. — capturado vía onError).
 */
const PLACEHOLDER_IMAGE = require('../../assets/images/unavailable-product-image.webp');

export function ProductCard({
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

  const [imageFailed, setImageFailed] = useState(false);
  const showPlaceholder = !product.tx_img_url || imageFailed;

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: PRODUCT_CARD_WIDTH,
        backgroundColor: colors.productCard,
        borderRadius: 16,
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
          width: '100%',
          height: PRODUCT_CARD_WIDTH - 20,
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: colors.section,
          marginBottom: 8,
        }}
      >
        <Image
          source={showPlaceholder ? PLACEHOLDER_IMAGE : { uri: product.tx_img_url }}
          style={{ width: '100%', height: '100%' }}
          contentFit="contain"
          onError={() => setImageFailed(true)}
        />

        {hasDiscount && (
          <View
            style={{
              position: 'absolute',
              top: 6,
              left: 6,
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
        )}
      </View>

      <Text
        numberOfLines={1}
        style={{ fontSize: 10.5, fontWeight: '600', color: colors.muted, marginBottom: 2 }}
      >
        {product.nb_brand}
      </Text>
      <Text
        numberOfLines={2}
        style={{
          fontSize: 12.5,
          fontWeight: '600',
          color: colors.foreground,
          lineHeight: 16,
          minHeight: 32,
          marginBottom: 6,
        }}
      >
        {product.nb_product}
      </Text>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flex: 1 }}>
          {hasDiscount && (
            <Text
              style={{
                fontSize: 10,
                color: colors.muted,
                textDecorationLine: 'line-through',
              }}
            >
              {formatPrice(basePrice, 'USD')}
            </Text>
          )}
          <Text
            numberOfLines={1}
            style={{ fontSize: 13.5, fontWeight: '700', color: colors.foreground }}
          >
            {formatPrice(finalPrice, 'USD')}
          </Text>
        </View>

        <Pressable
          onPress={onAddToCart}
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.primary,
          }}
          accessibilityRole="button"
          accessibilityLabel={`Agregar ${product.nb_product} al carrito`}
        >
          <Plus size={16} color={colors.onPrimary} strokeWidth={2.5} />
        </Pressable>
      </View>
    </Pressable>
  );
}

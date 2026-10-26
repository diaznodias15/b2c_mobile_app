import { memo, useState } from 'react';
import { Image as RNImage, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Check, Plus } from 'lucide-react-native';

import { useAddToCartFlight } from '@/hooks/useAddToCartFlight';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import type { ThemeColors } from '@/theme/colors';
import type { Product } from '@/types/whitelabel';
import { formatDisplayPrice } from '@/utils/currency';
import { UNAVAILABLE_PRODUCT_IMAGE } from '@/utils/localImages.generated';
import { getProductPricing } from '@/utils/pricing';

import { Badge } from '../ui/Badge';
import { IconButton } from '../ui/IconButton';
import { FavoriteButton } from './FavoriteButton';
import { VariantsHint } from './VariantsHint';
import { PriceBlock } from '../ui/PriceBlock';
import { StockPill } from '../ui/StockPill';
import { getStockLevel } from '../ui/stockLevel';
import { Txt } from '../ui/Txt';

/** Imagen más grande que la original (72): el producto es lo primero que se escanea. */
export const PRODUCT_LIST_ITEM_IMAGE_SIZE = 88;

/** Mismo fallback que el `ProductListItem` original (data URI embebido). */
const PLACEHOLDER_IMAGE = { uri: UNAVAILABLE_PRODUCT_IMAGE };

/**
 * Fila horizontal del rediseño para listas (Buscar, listado por departamento).
 * **Mismo contrato que `@/components/ProductListItem`** (`product`, `colors`,
 * `onPress`, `onAddToCart`): cambiarla es cambiar el `import`.
 *
 * Qué cambia respecto al original:
 *  - Botón de agregar de 48 dp (era 32) a la derecha del precio, donde cae el pulgar.
 *  - Stock visible en la fila de la marca; descuento como badge sobre la imagen en
 *    vez de apretado junto al precio.
 *  - Precio con jerarquía (precio final grande, tachado encima), texto ≥12 px.
 *  - Sin stock o sin precio: el botón se deshabilita (el original dejaba tocar).
 *
 * `React.memo` + callbacks que reciben el `product`: el padre pasa UNA función estable.
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
  /** Debe resolver `true` si el producto se agregó (con sesión, tras responder la API). */
  onAddToCart: (product: Product) => Promise<boolean> | boolean;
}) {
  const { finalPrice, hasDiscount } = getProductPricing(product);
  const { displayCurrency, exchangeRate } = useDisplayCurrency();

  const [imageFailed, setImageFailed] = useState(false);
  const showPlaceholder = !product.tx_img_url || imageFailed;

  const { imageRef, isAdding, isSubmitting, addWithFlight } = useAddToCartFlight();

  const stock = getStockLevel(product.qty_product);
  const hasPrice = finalPrice > 0;
  const soldOut = stock === 0;
  const canAdd = hasPrice && !soldOut;

  const handleAddToCart = () => {
    void addWithFlight(
      showPlaceholder ? PLACEHOLDER_IMAGE : { uri: product.tx_img_url as string },
      () => onAddToCart(product)
    );
  };

  const priceText = hasPrice ? formatDisplayPrice(finalPrice, exchangeRate, displayCurrency) : 'sin precio';
  const addLabel = !hasPrice
    ? 'Producto no disponible'
    : soldOut
      ? 'Producto sin stock'
      : `Agregar ${product.nb_product} al carrito`;

  return (
    <Pressable
      onPress={() => onPress(product)}
      accessibilityRole="button"
      accessibilityLabel={`${product.nb_product}, ${priceText}`}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: colors.productCard,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 12,
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <View
        ref={imageRef}
        style={{
          width: PRODUCT_LIST_ITEM_IMAGE_SIZE,
          height: PRODUCT_LIST_ITEM_IMAGE_SIZE,
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: colors.section,
        }}
      >
        <View style={{ flex: 1, opacity: soldOut ? 0.45 : 1 }}>
          {showPlaceholder ? (
            <RNImage source={PLACEHOLDER_IMAGE} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          ) : (
            <Image
              source={{ uri: product.tx_img_url ?? undefined }}
              style={{ width: '100%', height: '100%' }}
              contentFit="contain"
              onError={() => setImageFailed(true)}
            />
          )}
        </View>
        {hasDiscount && (
          <View style={{ position: 'absolute', top: 6, left: 6 }}>
            <Badge label={`-${Number(product.qty_discount)}%`} colors={colors} />
          </View>
        )}
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Txt variant="caption" color="muted" colors={colors} numberOfLines={1}>
              {product.nb_brand}
            </Txt>
          </View>
          {stock !== undefined && <StockPill level={stock} colors={colors} />}
          {/* Márgenes negativos: el botón de 48 dp no engorda la fila de la marca. */}
          <View style={{ marginVertical: -14, marginRight: -10 }}>
            <FavoriteButton slug={product.tx_slug} productName={product.nb_product} colors={colors} plain />
          </View>
        </View>

        <Txt variant="label" colors={colors} numberOfLines={2} style={{ marginTop: 2 }}>
          {product.nb_product}
        </Txt>
        {product.tx_variant_label ? (
          <Txt variant="caption" color="muted" colors={colors} numberOfLines={1}>
            {product.tx_variant_label}
          </Txt>
        ) : null}
        <VariantsHint count={product.variants_count} colors={colors} />

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 6, minHeight: 48 }}>
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <PriceBlock product={product} colors={colors} />
          </View>
          <IconButton
            icon={isAdding ? Check : Plus}
            label={addLabel}
            variant="filled"
            iconSize={20}
            onPress={handleAddToCart}
            loading={isSubmitting}
            disabled={!canAdd}
            colors={colors}
          />
        </View>
      </View>
    </Pressable>
  );
});

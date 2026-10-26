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
import { FavoriteButton } from './FavoriteButton';
import { Button } from '../ui/Button';
import { PriceBlock } from '../ui/PriceBlock';
import { StockPill } from '../ui/StockPill';
import { getStockLevel } from '../ui/stockLevel';
import { Txt } from '../ui/Txt';

/** Más ancho que el original (148): el CTA a todo el ancho y el precio necesitan aire. */
export const PRODUCT_CARD_WIDTH = 164;

/** Mismo fallback que el `ProductCard` original (data URI embebido, ver su comentario). */
const PLACEHOLDER_IMAGE = { uri: UNAVAILABLE_PRODUCT_IMAGE };

/**
 * Card vertical del rediseño. **Mismo contrato que `@/components/ProductCard`**
 * (`product`, `colors`, `onPress`, `onAddToCart`) para cambiarla con solo el `import`.
 *
 * Qué cambia respecto al original:
 *  - CTA "Agregar" a todo el ancho (48 dp) en vez de un "+" de 28×28.
 *  - Estado de stock visible; sin stock o sin precio, el CTA queda deshabilitado
 *    y lo dice ("Sin stock" / "No disponible") en vez de dejar tocar.
 *  - Todo el texto ≥12 px (marca y precio tachado eran de 10–10.5 px).
 *  - Superficie plana con borde fino en vez de sombra.
 *
 * `React.memo` + callbacks que reciben el `product`: igual que el original, el padre
 * pasa UNA función estable para toda la lista.
 */
export const ProductCard = memo(function ProductCard({
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

  return (
    <Pressable
      onPress={() => onPress(product)}
      accessibilityRole="button"
      accessibilityLabel={`${product.nb_product}, ${priceText}`}
      style={({ pressed }) => ({
        width: PRODUCT_CARD_WIDTH,
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
          width: '100%',
          aspectRatio: 1,
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: colors.section,
          marginBottom: 10,
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
          <View style={{ position: 'absolute', top: 8, left: 8 }}>
            <Badge label={`-${Number(product.qty_discount)}%`} colors={colors} />
          </View>
        )}
        <View style={{ position: 'absolute', top: 0, right: 0 }}>
          <FavoriteButton slug={product.tx_slug} productName={product.nb_product} colors={colors} />
        </View>
      </View>

      <Txt variant="caption" color="muted" colors={colors} numberOfLines={1}>
        {product.nb_brand}
      </Txt>
      <Txt
        variant="label"
        colors={colors}
        numberOfLines={2}
        style={{ minHeight: 40, marginTop: 2, marginBottom: 6 }}
      >
        {product.nb_product}
      </Txt>

      {/* Reserva la altura del tachado para que los CTA queden alineados entre cards con y sin descuento. */}
      <View style={{ minHeight: 40, justifyContent: 'flex-end' }}>
        <PriceBlock product={product} colors={colors} />
      </View>

      <View style={{ minHeight: 16, marginTop: 6, marginBottom: 10 }}>
        {stock !== undefined && <StockPill level={stock} colors={colors} />}
      </View>

      <Button
        label={
          !hasPrice ? 'No disponible' : soldOut ? 'Sin stock' : isAdding ? 'Agregado' : 'Agregar'
        }
        icon={canAdd ? (isAdding ? Check : Plus) : undefined}
        onPress={handleAddToCart}
        loading={isSubmitting}
        disabled={!canAdd}
        accessibilityLabel={canAdd ? `Agregar ${product.nb_product} al carrito` : undefined}
        colors={colors}
      />
    </Pressable>
  );
});

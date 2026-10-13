import { View } from 'react-native';

import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import type { ThemeColors } from '@/theme/colors';
import type { Product, ProductDetail } from '@/types/whitelabel';
import { formatDisplayPrice } from '@/utils/currency';
import { getProductPricing } from '@/utils/pricing';

import { Txt } from './Txt';
import { useColors } from './useColors';

/**
 * Precio de un producto: el precio final es lo más grande y pesado; el precio base
 * tachado va encima, en secundario, solo si hay descuento real. La base es Bs. y se
 * convierte a REF según la moneda elegida (ver `formatDisplayPrice`).
 *
 * Un precio de 0 no es "gratis": el backend lo manda para productos sin precio en la
 * sede, así que se muestra "Precio no disponible".
 *
 * `adjustsFontSizeToFit` evita que montos largos ("Bs. 1.761.911,72") se partan o se
 * corten en cards angostas.
 */
export function PriceBlock({
  product,
  size = 'sm',
  colors,
}: {
  product: Product | ProductDetail;
  size?: 'sm' | 'lg';
  colors?: ThemeColors;
}) {
  const theme = useColors(colors);
  const { basePrice, finalPrice, hasDiscount } = getProductPricing(product);
  const { displayCurrency, exchangeRate } = useDisplayCurrency();

  if (!(finalPrice > 0)) {
    return (
      <Txt variant="label" color="muted" colors={theme} numberOfLines={1}>
        Precio no disponible
      </Txt>
    );
  }

  return (
    <View>
      {hasDiscount && (
        <Txt
          variant="caption"
          color="muted"
          colors={theme}
          numberOfLines={1}
          style={{ textDecorationLine: 'line-through' }}
        >
          {formatDisplayPrice(basePrice, exchangeRate, displayCurrency)}
        </Txt>
      )}
      <Txt
        variant={size === 'lg' ? 'price' : 'priceSm'}
        colors={theme}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
      >
        {formatDisplayPrice(finalPrice, exchangeRate, displayCurrency)}
      </Txt>
    </View>
  );
}

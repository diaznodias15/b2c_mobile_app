import { useState } from 'react';
import { Image as RNImage, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Info, Trash2 } from 'lucide-react-native';

import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { useSafePush } from '@/hooks/useSafePush';
import { cartLineKey, useCartStore } from '@/store/cart.store';
import { useToastStore } from '@/store/toast.store';
import { hexToRgba, type ThemeColors } from '@/theme/colors';
import type { CartItem } from '@/types/cart';
import { getAvailableUnits, getMaxQuantity } from '@/utils/cartStock';
import { formatDisplayPrice } from '@/utils/currency';
import { UNAVAILABLE_PRODUCT_IMAGE } from '@/utils/localImages.generated';
import { getCartLinePricing } from '@/utils/pricing';

import { Badge } from '../ui/Badge';
import { IconButton } from '../ui/IconButton';
import { Txt } from '../ui/Txt';
import { QuantityStepper } from './QuantityStepper';

const MAX_QTY = 99;
const IMAGE_SIZE = 72;

/** Data URI base64 embebido (ver el comentario largo en `ProductCard.tsx`). */
const PLACEHOLDER_IMAGE = { uri: UNAVAILABLE_PRODUCT_IMAGE };

/**
 * Línea del carrito del rediseño. Misma lógica que la `CartLineItem` de `cart.tsx`
 * (cantidades y borrado contra `cart.store`, que con sesión espera a la API; `isPending`
 * bloquea la línea; el toast de "eliminado" solo sale si el servidor aceptó) y otra forma:
 *
 *  - Stepper de 48 dp y, con cantidad > 1, botón de quitar de 48 dp en su propia fila (antes
 *    iban apilados a la derecha de la card, con un icono de 18 px).
 *  - Precio de la línea como dato principal, con el cálculo "N × unitario" debajo y el
 *    tachado del valor base si hay descuento.
 *  - Imagen de 72 con el `-N%` encima.
 */
export function CartLineItem({ item, colors }: { item: CartItem; colors: ThemeColors }) {
  const push = useSafePush();
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeProduct = useCartStore((s) => s.removeProduct);
  // Hay una operación de ESTA línea esperando a la API: loader y botones bloqueados.
  const isPending = useCartStore((s) => s.pendingKeys.includes(cartLineKey(item.branch_id, item.tx_slug)));
  const { displayCurrency, exchangeRate } = useDisplayCurrency();

  const [imageFailed, setImageFailed] = useState(false);
  const showPlaceholder = !item.tx_img_url || imageFailed;
  // Con la cantidad actual: la fila se recalcula al instante al tocar +/−.
  const pricing = getCartLinePricing(item);
  const fmt = (amount: number) => formatDisplayPrice(amount, exchangeRate, displayCurrency);

  const handleRemove = async () => {
    // Con sesión espera a `DELETE`; el toast solo sale si el servidor aceptó.
    const removed = await removeProduct(item.tx_slug, item.branch_id);
    if (removed) useToastStore.getState().show('El producto ha sido eliminado del carrito.');
  };

  return (
    <Pressable
      onPress={() => push(`/product/${item.tx_slug}`)}
      accessibilityRole="button"
      accessibilityLabel={`Ver ${item.nb_product}`}
      style={({ pressed }) => ({
        flexDirection: 'row',
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
        style={{
          width: IMAGE_SIZE,
          height: IMAGE_SIZE,
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: colors.section,
        }}
      >
        {showPlaceholder ? (
          <RNImage source={PLACEHOLDER_IMAGE} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
        ) : (
          <Image
            source={{ uri: item.tx_img_url ?? undefined }}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
            onError={() => setImageFailed(true)}
          />
        )}
        {pricing.hasDiscount && (
          <View style={{ position: 'absolute', top: 4, left: 4 }}>
            <Badge label={`-${Math.round(pricing.discountPercent)}%`} colors={colors} />
          </View>
        )}
      </View>

      <View style={{ flex: 1, gap: 8 }}>
        <View>
          <Txt variant="caption" color="muted" colors={colors} numberOfLines={1}>
            {item.nb_brand}
          </Txt>
          <Txt variant="label" colors={colors} numberOfLines={2}>
            {item.nb_product}
          </Txt>
          {item.tx_variant_label ? (
            <Txt variant="caption" color="muted" colors={colors} numberOfLines={1}>
              {item.tx_variant_label}
            </Txt>
          ) : null}
        </View>

        <View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 8 }}>
            <Txt variant="priceSm" colors={colors}>
              {fmt(pricing.lineTotal)}
            </Txt>
            {pricing.hasDiscount && (
              <Txt variant="caption" color="muted" colors={colors} style={{ textDecorationLine: 'line-through' }}>
                {fmt(pricing.lineBase)}
              </Txt>
            )}
          </View>
          <Txt variant="caption" color="muted" colors={colors}>
            {item.qty} × {fmt(pricing.unitPrice)}
            {pricing.lineTax > 0 ? ` · IVA inc. ${fmt(pricing.lineTax)}` : ''}
          </Txt>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <QuantityStepper
            value={item.qty}
            max={getMaxQuantity(item, MAX_QTY)}
            onChange={(qty) => void updateQuantity(item.tx_slug, item.branch_id, qty)}
            onRemove={() => void handleRemove()}
            loading={isPending}
            colors={colors}
          />
          {/* Con cantidad 1 el "−" del stepper ya es la papelera; un segundo botón sería redundante. */}
          {item.qty > 1 && (
            <IconButton
              icon={Trash2}
              label={`Quitar ${item.nb_product} del carrito`}
              variant="plain"
              iconSize={20}
              onPress={() => void handleRemove()}
              loading={isPending}
              colors={{ ...colors, foreground: colors.danger }}
            />
          )}
        </View>
      </View>
    </Pressable>
  );
}

/** Aviso bajo la card cuando se pidió más de lo disponible (igual que `AvailabilityAlert` de la web). */
export function StockAlert({ item, colors }: { item: CartItem; colors: ThemeColors }) {
  const available = getAvailableUnits(item) ?? 0;
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 8,
        backgroundColor: hexToRgba(colors.danger, 0.1),
        borderRadius: 12,
        padding: 12,
      }}
      accessibilityRole="alert"
    >
      <Info size={18} color={colors.danger} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Txt variant="caption" colors={colors} style={{ lineHeight: 18 }}>
          {available === 0 ? (
            <>
              <Txt variant="caption" colors={colors} style={{ fontWeight: '700' }}>
                Producto no disponible:{' '}
              </Txt>
              ya no hay existencias en esta sede. Quítalo del carrito para continuar.
            </>
          ) : (
            <>
              <Txt variant="caption" colors={colors} style={{ fontWeight: '700' }}>
                Cantidad no disponible:{' '}
              </Txt>
              solo hay {available} {available === 1 ? 'unidad disponible' : 'unidades disponibles'}. Has agregado{' '}
              {item.qty}. Ajusta la cantidad.
            </>
          )}
        </Txt>
      </View>
    </View>
  );
}

import { useState, type ComponentType } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Check, MapPin, Store, User } from 'lucide-react-native';

import { mergeLocalCart } from '@/api/services/cart.services';
import { calculateDeliveryFee } from '@/api/services/utilities.services';
import { DeliveryMapModal } from '@/components/DeliveryMapModal';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { selectEffectiveBranchId, useBranchStore } from '@/store/branch.store';
import { useCartStore } from '@/store/cart.store';
import { useCheckoutStore } from '@/store/checkout.store';
import { useConfigStore } from '@/store/config.store';
import type { ThemeColors } from '@/theme/colors';
import type { FulfillmentType } from '@/types/cart';
import { formatDisplayPrice } from '@/utils/currency';
import { isAreaCodeValid, isPhoneNumberValid } from '@/utils/phone';
import { getCartSummary } from '@/utils/pricing';
import { isNameValid } from '@/utils/validations';

import { Button } from '../ui/Button';
import { Surface } from '../ui/Surface';
import { TextField } from '../ui/TextField';
import { Txt } from '../ui/Txt';
import { CheckoutStepHeader } from './CheckoutStepHeader';
import { PhoneContactFields } from './PhoneContactFields';

/**
 * Paso 1 del checkout Full: Retiro vs Delivery + datos del destinatario. **Mismo contrato que
 * `@/components/CheckoutEntregaStep`** (`onNext`, `insets`, `colors`) y misma lógica: el punto de
 * entrega se elige con `DeliveryMapModal` (Leaflet/OSM); al confirmarlo se sincroniza el carrito
 * local con el backend (`mergeLocalCart`, requisito real del endpoint de cotización) y se pide el
 * costo real con `calculate-delivery`; si el subtotal ya supera el umbral de envío gratis ni se
 * llama al backend; si no se puede cotizar (`null`) se dice "se coordina por WhatsApp" y NUNCA se
 * asume gratis ni se bloquea el flujo.
 *
 * Qué cambia (solo presentación):
 *  - Cabecera con "Paso 1 de 2" y barra de progreso, y volver de 48 dp.
 *  - Retiro/Delivery como dos tarjetas con icono, título y descripción (antes dos botones).
 *  - Campos con `TextField` (etiqueta visible, 48 dp, error junto al campo) y el teléfono con chips.
 *  - El estado del costo de envío en una tarjeta propia (calculando / monto / se coordina).
 *  - "Continuar al pago" fijo abajo, con el motivo cuando está deshabilitado.
 */
export function CheckoutEntregaStep({
  onNext,
  insets,
  colors,
}: {
  onNext: () => void;
  insets: { top: number; bottom: number };
  colors: ThemeColors;
}) {
  const fulfillment = useCheckoutStore((s) => s.fulfillment);
  const setFulfillment = useCheckoutStore((s) => s.setFulfillment);
  const deliveryAddress = useCheckoutStore((s) => s.deliveryAddress);
  const setDeliveryAddress = useCheckoutStore((s) => s.setDeliveryAddress);
  const recipientName = useCheckoutStore((s) => s.recipientName);
  const setRecipientName = useCheckoutStore((s) => s.setRecipientName);
  const recipientAreaCode = useCheckoutStore((s) => s.recipientAreaCode);
  const setRecipientAreaCode = useCheckoutStore((s) => s.setRecipientAreaCode);
  const recipientPhone = useCheckoutStore((s) => s.recipientPhone);
  const setRecipientPhone = useCheckoutStore((s) => s.setRecipientPhone);
  const comments = useCheckoutStore((s) => s.comments);
  const setComments = useCheckoutStore((s) => s.setComments);
  const deliveryFee = useCheckoutStore((s) => s.deliveryFee);
  const setDeliveryFee = useCheckoutStore((s) => s.setDeliveryFee);
  const isCalculatingDeliveryFee = useCheckoutStore((s) => s.isCalculatingDeliveryFee);
  const setIsCalculatingDeliveryFee = useCheckoutStore((s) => s.setIsCalculatingDeliveryFee);

  const branchId = useBranchStore(selectEffectiveBranchId);
  const cartItems = useCartStore((s) => s.items);
  const freeDeliveryThreshold = useConfigStore((s) => s.appConfig?.qty_free_delivery_threshold ?? 0);
  const { displayCurrency, exchangeRate } = useDisplayCurrency();

  const [mapVisible, setMapVisible] = useState(false);

  const isDelivery = fulfillment === 'DELIVERY';
  const addressText = deliveryAddress?.tx_address ?? '';
  const hasCoords = deliveryAddress?.lat != null && deliveryAddress?.lng != null;

  const nameOk = isNameValid(recipientName);
  const phoneOk = isAreaCodeValid(recipientAreaCode) && isPhoneNumberValid(recipientPhone);
  const addressOk = addressText.trim().length > 5;

  const canContinue = fulfillment !== null && (!isDelivery || (addressOk && nameOk && phoneOk));
  const missing =
    fulfillment === null
      ? 'Elige cómo quieres recibir tu pedido'
      : isDelivery && !nameOk
        ? 'Escribe el nombre de quien recibe'
        : isDelivery && !phoneOk
          ? 'Escribe el teléfono de quien recibe'
          : isDelivery && !addressOk
            ? 'Escribe la dirección de entrega'
            : null;

  async function handleConfirmMapPosition(position: { lat: number; lng: number; label?: string }) {
    setDeliveryAddress({
      tx_address: position.label ?? addressText,
      lat: position.lat,
      lng: position.lng,
    });

    if (branchId === null) return;

    // Mismo atajo que la web: si el subtotal ya supera el umbral de envío gratis, ni siquiera se
    // llama al backend.
    const cartTotal = getCartSummary(cartItems).total;
    if (freeDeliveryThreshold > 0 && cartTotal > freeDeliveryThreshold) {
      setDeliveryFee(0);
      return;
    }

    setDeliveryFee(null);
    setIsCalculatingDeliveryFee(true);
    try {
      await mergeLocalCart(
        branchId,
        cartItems.map((item) => ({ tx_slug: item.tx_slug, qty_product: item.qty }))
      );
      const fee = await calculateDeliveryFee(position.lat, position.lng, branchId);
      setDeliveryFee(fee);
    } catch {
      setDeliveryFee(null);
    } finally {
      setIsCalculatingDeliveryFee(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAwareScrollView
        bottomOffset={24}
        contentContainerStyle={{ padding: 16, paddingTop: insets.top + 8, gap: 20, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <CheckoutStepHeader
          step={1}
          totalSteps={2}
          title="¿Cómo quieres recibir tu pedido?"
          subtitle="Elige una opción para continuar."
          colors={colors}
        />

        <View style={{ gap: 10 }}>
          <OptionCard
            icon={Store}
            title="Retiro en tienda"
            description="Pasas a buscarlo a tu sede."
            value="PICKUP"
            selected={fulfillment === 'PICKUP'}
            onSelect={setFulfillment}
            colors={colors}
          />
          <OptionCard
            icon={MapPin}
            title="Delivery"
            description="Te lo llevamos a la dirección que indiques."
            value="DELIVERY"
            selected={isDelivery}
            onSelect={setFulfillment}
            colors={colors}
          />
        </View>

        {isDelivery && (
          <View style={{ gap: 16 }}>
            <Txt variant="section" colors={colors}>
              Datos de la entrega
            </Txt>

            <TextField
              label="Nombre de quien recibe"
              value={recipientName}
              onChangeText={setRecipientName}
              placeholder="Nombre y apellido"
              icon={User}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              error={recipientName.length > 0 && !nameOk ? 'Escribe el nombre de quien recibe.' : null}
              colors={colors}
            />

            <PhoneContactFields
              label="Teléfono de quien recibe"
              areaCode={recipientAreaCode}
              number={recipientPhone}
              onChangeAreaCode={setRecipientAreaCode}
              onChangeNumber={setRecipientPhone}
              colors={colors}
            />

            <TextField
              label="Dirección"
              value={addressText}
              onChangeText={(text) => setDeliveryAddress({ ...deliveryAddress, tx_address: text })}
              placeholder="Calle, edificio, punto de referencia"
              icon={MapPin}
              autoCapitalize="sentences"
              inputProps={{ multiline: true, numberOfLines: 3, textAlignVertical: 'top' }}
              helper="Mínimo 6 caracteres. Puedes escribirla o elegirla en el mapa."
              colors={colors}
            />

            <Button
              label={hasCoords ? 'Ajustar ubicación en el mapa' : 'Elegir ubicación en el mapa'}
              variant="secondary"
              icon={MapPin}
              onPress={() => setMapVisible(true)}
              colors={colors}
            />

            {hasCoords && (
              <Surface colors={colors} tone="section" padding={14} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {isCalculatingDeliveryFee ? (
                  <>
                    <ActivityIndicator size="small" color={colors.muted} />
                    <Txt variant="label" color="muted" colors={colors} style={{ fontWeight: '500' }}>
                      Calculando costo de envío…
                    </Txt>
                  </>
                ) : deliveryFee !== null ? (
                  <Txt variant="label" colors={colors} style={{ fontWeight: '500' }}>
                    Costo de envío:{' '}
                    <Txt variant="label" colors={colors} style={{ fontWeight: '800' }}>
                      {deliveryFee > 0 ? formatDisplayPrice(deliveryFee, exchangeRate, displayCurrency) : 'Gratis'}
                    </Txt>
                  </Txt>
                ) : (
                  <View style={{ flex: 1 }}>
                    <Txt variant="label" color="muted" colors={colors} style={{ fontWeight: '500' }}>
                      No pudimos calcular el envío para esta dirección. El costo se coordinará por WhatsApp.
                    </Txt>
                  </View>
                )}
              </Surface>
            )}

            <TextField
              label="Información adicional (opcional)"
              value={comments}
              onChangeText={setComments}
              placeholder="Piso, color de la fachada, referencias…"
              autoCapitalize="sentences"
              inputProps={{ multiline: true, numberOfLines: 2, textAlignVertical: 'top' }}
              colors={colors}
            />
          </View>
        )}
      </KeyboardAwareScrollView>

      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: insets.bottom + 10,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.productCard,
          gap: 8,
        }}
      >
        {!canContinue && missing ? (
          <Txt variant="caption" color="muted" colors={colors} style={{ textAlign: 'center' }}>
            {missing}
          </Txt>
        ) : null}
        <Button label="Continuar al pago" disabled={!canContinue} onPress={onNext} colors={colors} />
      </View>

      <DeliveryMapModal
        visible={mapVisible}
        onClose={() => setMapVisible(false)}
        onConfirm={handleConfirmMapPosition}
        colors={colors}
      />
    </View>
  );
}

/** Tarjeta de opción (Retiro / Delivery): icono, título y descripción; el elegido lleva check y borde grueso. */
function OptionCard({
  icon: Icon,
  title,
  description,
  value,
  selected,
  onSelect,
  colors,
}: {
  icon: ComponentType<{ size?: number; color?: string }>;
  title: string;
  description: string;
  value: FulfillmentType;
  selected: boolean;
  onSelect: (value: FulfillmentType) => void;
  colors: ThemeColors;
}) {
  return (
    <Pressable
      onPress={() => onSelect(value)}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title}. ${description}`}
      style={({ pressed }) => ({
        minHeight: 76,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 14,
        borderRadius: 14,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.primaryOverlay : colors.productCard,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: selected ? colors.primary : colors.section,
        }}
      >
        <Icon size={22} color={selected ? colors.onPrimary : colors.foreground} />
      </View>
      <View style={{ flex: 1 }}>
        <Txt variant="label" colors={colors} style={{ fontWeight: '800' }}>
          {title}
        </Txt>
        <Txt variant="caption" color="muted" colors={colors}>
          {description}
        </Txt>
      </View>
      {selected && (
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Check size={16} color={colors.onPrimary} strokeWidth={3} />
        </View>
      )}
    </Pressable>
  );
}

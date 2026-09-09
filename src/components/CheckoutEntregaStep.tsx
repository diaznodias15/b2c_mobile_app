import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { MapPin, Store } from 'lucide-react-native';

import { mergeLocalCart } from '@/api/services/cart.services';
import { calculateDeliveryFee } from '@/api/services/utilities.services';
import {
  CheckoutBackButton,
  CheckoutField,
  CheckoutFieldLabel,
  CheckoutOptionCard,
  checkoutInputStyle,
} from '@/components/CheckoutPrimitives';
import { DeliveryMapModal } from '@/components/DeliveryMapModal';
import { selectEffectiveBranchId, useBranchStore } from '@/store/branch.store';
import { useCartStore } from '@/store/cart.store';
import { useCheckoutStore } from '@/store/checkout.store';
import { useConfigStore } from '@/store/config.store';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { formatDisplayPrice } from '@/utils/currency';
import { getCartSummary } from '@/utils/pricing';
import { isNameValid } from '@/utils/validations';
import type { ThemeColors } from '@/theme/colors';

/**
 * Step 1 del checkout Full: Retiro vs Delivery + datos del destinatario
 * (CHECKOUT-FLOW.md §11). El punto de entrega se elige con
 * `DeliveryMapModal` (Leaflet/OSM, mismo motor que `BranchMapModal`) —
 * al confirmar un punto se sincroniza el carrito local con el backend
 * (`mergeLocalCart`, requisito real del endpoint de cotización) y se
 * pide el costo real vía `calculate-delivery`. Si la sede no tiene una
 * regla de envío configurada para esa distancia (pasa en varias sedes
 * de prueba), `calculateDeliveryFee` devuelve `null` y se cae al mismo
 * mensaje de "se coordina por WhatsApp" que ya usa el resto del
 * checkout — nunca se bloquea el flujo por esto (CHECKOUT-FLOW.md §19.5).
 */
export function CheckoutEntregaStep({
  onNext,
  insets,
  colors,
}: {
  onNext: () => void;
  insets: { top: number };
  colors: ThemeColors;
}) {
  const fulfillment = useCheckoutStore((s) => s.fulfillment);
  const setFulfillment = useCheckoutStore((s) => s.setFulfillment);
  const deliveryAddress = useCheckoutStore((s) => s.deliveryAddress);
  const setDeliveryAddress = useCheckoutStore((s) => s.setDeliveryAddress);
  const recipientName = useCheckoutStore((s) => s.recipientName);
  const setRecipientName = useCheckoutStore((s) => s.setRecipientName);
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

  const canContinue =
    fulfillment !== null &&
    (!isDelivery ||
      (addressText.trim().length > 5 && isNameValid(recipientName) && recipientPhone.trim().length >= 7));

  async function handleConfirmMapPosition(position: { lat: number; lng: number; label?: string }) {
    setDeliveryAddress({
      tx_address: position.label ?? addressText,
      lat: position.lat,
      lng: position.lng,
    });

    if (branchId === null) return;

    // Mismo atajo que la web (CHECKOUT-API.md §6.2): si el subtotal ya
    // supera el umbral de envío gratis, ni siquiera se llama al backend.
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
      <CheckoutBackButton insets={insets} colors={colors} />

      <KeyboardAwareScrollView
        bottomOffset={24}
        contentContainerStyle={{ padding: 24, paddingTop: insets.top + 60 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground, marginBottom: 6 }}>
          ¿Cómo querés recibir tu pedido?
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 20 }}>
          Elegí una opción para continuar.
        </Text>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          <CheckoutOptionCard
            label="Retiro en tienda"
            icon={Store}
            active={fulfillment === 'PICKUP'}
            onPress={() => setFulfillment('PICKUP')}
            colors={colors}
          />
          <CheckoutOptionCard
            label="Delivery"
            icon={MapPin}
            active={isDelivery}
            onPress={() => setFulfillment('DELIVERY')}
            colors={colors}
          />
        </View>

        {isDelivery && (
          <View
            style={{
              backgroundColor: colors.section,
              borderRadius: 14,
              padding: 16,
              gap: 4,
            }}
          >
            <CheckoutFieldLabel colors={colors}>Dirección de entrega</CheckoutFieldLabel>

            <CheckoutField label="Nombre de quien recibe" colors={colors}>
              <TextInput
                value={recipientName}
                onChangeText={setRecipientName}
                placeholder="Nombre y apellido"
                placeholderTextColor={colors.muted}
                style={checkoutInputStyle(colors)}
              />
            </CheckoutField>

            <CheckoutField label="Teléfono de quien recibe" colors={colors}>
              <TextInput
                value={recipientPhone}
                onChangeText={setRecipientPhone}
                placeholder="+58 0414-1234567"
                placeholderTextColor={colors.muted}
                style={checkoutInputStyle(colors)}
                keyboardType="phone-pad"
              />
            </CheckoutField>

            <CheckoutField label="Dirección" colors={colors}>
              <TextInput
                value={addressText}
                onChangeText={(text) => setDeliveryAddress({ ...deliveryAddress, tx_address: text })}
                placeholder="Calle, edificio, punto de referencia"
                placeholderTextColor={colors.muted}
                style={checkoutInputStyle(colors)}
                multiline
              />
            </CheckoutField>

            <Pressable
              onPress={() => setMapVisible(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingVertical: 10,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.border,
                marginBottom: 8,
              }}
              accessibilityRole="button"
              accessibilityLabel="Mostrar el mapa"
            >
              <MapPin size={16} color={colors.primary} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary }}>
                {hasCoords ? 'Ajustar ubicación en el mapa' : 'Mostrar el mapa'}
              </Text>
            </Pressable>

            {hasCoords && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: colors.background,
                  borderRadius: 10,
                  padding: 10,
                  marginBottom: 8,
                }}
              >
                {isCalculatingDeliveryFee ? (
                  <>
                    <ActivityIndicator size="small" color={colors.muted} />
                    <Text style={{ fontSize: 12, color: colors.muted }}>Calculando costo de envío…</Text>
                  </>
                ) : deliveryFee !== null ? (
                  <Text style={{ fontSize: 12, color: colors.foreground }}>
                    Costo de envío:{' '}
                    <Text style={{ fontWeight: '700' }}>
                      {deliveryFee > 0
                        ? formatDisplayPrice(deliveryFee, exchangeRate, displayCurrency)
                        : 'Gratis'}
                    </Text>
                  </Text>
                ) : (
                  <Text style={{ fontSize: 12, color: colors.muted, flex: 1 }}>
                    No pudimos calcular el envío para esta dirección — el costo se coordinará por WhatsApp.
                  </Text>
                )}
              </View>
            )}

            <CheckoutField label="Información adicional (opcional)" colors={colors}>
              <TextInput
                value={comments}
                onChangeText={setComments}
                placeholder="Piso, color de la fachada, referencias..."
                placeholderTextColor={colors.muted}
                style={checkoutInputStyle(colors)}
                multiline
              />
            </CheckoutField>
          </View>
        )}

        <Pressable
          onPress={onNext}
          disabled={!canContinue}
          style={{
            height: 50,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: canContinue ? colors.primary : colors.border,
            marginTop: 20,
          }}
          accessibilityRole="button"
          accessibilityLabel="Continuar al pago"
        >
          <Text
            style={{ fontSize: 15, fontWeight: '700', color: canContinue ? colors.onPrimary : colors.muted }}
          >
            Continuar al pago
          </Text>
        </Pressable>
      </KeyboardAwareScrollView>

      <DeliveryMapModal
        visible={mapVisible}
        onClose={() => setMapVisible(false)}
        onConfirm={handleConfirmMapPosition}
        colors={colors}
      />
    </View>
  );
}

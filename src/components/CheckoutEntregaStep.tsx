import { Pressable, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { MapPin, Store } from 'lucide-react-native';

import {
  CheckoutBackButton,
  CheckoutField,
  CheckoutFieldLabel,
  CheckoutOptionCard,
  checkoutInputStyle,
} from '@/components/CheckoutPrimitives';
import { useCheckoutStore } from '@/store/checkout.store';
import { isNameValid } from '@/utils/validations';
import type { ThemeColors } from '@/theme/colors';

/**
 * Step 1 del checkout Full: Retiro vs Delivery + datos del destinatario
 * (CHECKOUT-FLOW.md §11). Sin mapa interactivo por ahora — la dirección
 * es texto libre (MVP, mismo criterio que el resto de la app: primero
 * funcional, el picker de mapa puede sumarse después como iteración,
 * igual que pasó con `BranchMapModal` en el detalle de producto).
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

  const isDelivery = fulfillment === 'DELIVERY';
  const addressText = deliveryAddress?.tx_address ?? '';

  const canContinue =
    fulfillment !== null &&
    (!isDelivery ||
      (addressText.trim().length > 5 && isNameValid(recipientName) && recipientPhone.trim().length >= 7));

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
    </View>
  );
}

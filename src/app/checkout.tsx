import { useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircleCheck, MessageCircle, MapPin, Store } from 'lucide-react-native';

import { createOrder } from '@/api/services/orders.services';
import { CartSummaryCard } from '@/components/CartSummaryCard';
import {
  CheckoutBackButton,
  CheckoutField,
  CheckoutOptionCard,
  checkoutInputStyle,
} from '@/components/CheckoutPrimitives';
import { CheckoutEntregaStep } from '@/components/CheckoutEntregaStep';
import { CheckoutPagoStep } from '@/components/CheckoutPagoStep';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { selectEffectiveBranchId, useBranchStore } from '@/store/branch.store';
import { useCartStore } from '@/store/cart.store';
import { useCheckoutStore } from '@/store/checkout.store';
import { isConfigFlagTrue, useConfigStore, useThemeColors } from '@/store/config.store';
import { useUserStore } from '@/store/user.store';
import { isEmailValid, isNameValid } from '@/utils/validations';
import { getCartSummary } from '@/utils/pricing';
import type { ThemeColors } from '@/theme/colors';
import type { FulfillmentType } from '@/types/cart';

/**
 * Orquesta los dos modos del checkout (CHECKOUT-FLOW.md), gateado en
 * runtime por `appConfig.is_lite_mode`:
 *  - Lite: un solo paso (confirmar datos de contacto) → éxito. El
 *    payload real que espera el backend en este modo es MÍNIMO
 *    (branch_id, fulfillment_type: PICKUP, tx_payment_method: EXPRESS,
 *    is_lite: 1 — §12.2) — no pide nombre/teléfono en el submit porque
 *    ya los tiene del usuario autenticado. El form de contacto que se
 *    ve acá es una mejora de UX para que el representante de WhatsApp
 *    sepa a quién y cómo contactar, no algo que el backend exija.
 *  - Full: 2 pasos locales (Entrega → Pago), con estado compartido en
 *    `useCheckoutStore` — éxito. Sin mapa interactivo para elegir
 *    dirección todavía (MVP, ver `CheckoutEntregaStep`).
 */
export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const appConfig = useConfigStore((s) => s.appConfig);
  const branchId = useBranchStore(selectEffectiveBranchId);
  const user = useUserStore((s) => s.user);

  const items = useCartStore((s) => s.items);
  const removeProduct = useCartStore((s) => s.removeProduct);
  const cartItems = useMemo(
    () => items.filter((item) => item.branch_id === branchId),
    [items, branchId]
  );
  const cartSummary = useMemo(() => getCartSummary(cartItems), [cartItems]);
  const { displayCurrency, exchangeRate } = useDisplayCurrency();

  const resetCheckout = useCheckoutStore((s) => s.reset);
  const fulfillment = useCheckoutStore((s) => s.fulfillment);
  const deliveryAddress = useCheckoutStore((s) => s.deliveryAddress);
  const recipientName = useCheckoutStore((s) => s.recipientName);
  const recipientPhone = useCheckoutStore((s) => s.recipientPhone);
  const comments = useCheckoutStore((s) => s.comments);
  const paymentMethod = useCheckoutStore((s) => s.paymentMethod);
  const paymentAmount = useCheckoutStore((s) => s.paymentAmount);
  const paymentCurrency = useCheckoutStore((s) => s.paymentCurrency);
  const paymentReference = useCheckoutStore((s) => s.paymentReference);
  const bankOrigin = useCheckoutStore((s) => s.bankOrigin);
  const depositorName = useCheckoutStore((s) => s.depositorName);
  const payerPhone = useCheckoutStore((s) => s.payerPhone);

  const [fullStep, setFullStep] = useState<'entrega' | 'pago'>('entrega');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  // Campos del form de contacto del modo Lite (no viven en el store de
  // checkout Full — es un flujo aparte, más simple).
  const [liteName, setLiteName] = useState(user?.name ?? '');
  const [litePhone, setLitePhone] = useState(user?.tx_phone ?? '');
  const [liteEmail, setLiteEmail] = useState(user?.email ?? '');
  const [liteFulfillment, setLiteFulfillment] = useState<FulfillmentType>('PICKUP');
  const [liteAddress, setLiteAddress] = useState('');

  const isLite = isConfigFlagTrue(appConfig?.is_lite_mode);

  const productsPayload = cartItems.map((item) => ({ tx_slug: item.tx_slug, qty_product: item.qty }));

  const handleFinish = async (result: { tx_order_number: string }) => {
    // Bug §20.7 de la web corregido: no avanzar a "éxito" si el backend
    // no mandó un número de orden real.
    if (!result.tx_order_number) {
      setError('No pudimos confirmar tu pedido. Intentá de nuevo.');
      return;
    }
    cartItems.forEach((item) => removeProduct(item.tx_slug, item.branch_id));
    resetCheckout();
    setOrderNumber(result.tx_order_number);
  };

  const liteCanSubmit =
    (liteFulfillment === 'PICKUP' || liteAddress.trim().length > 5) &&
    isNameValid(liteName) &&
    litePhone.trim().length >= 7 &&
    (liteEmail.trim().length === 0 || isEmailValid(liteEmail)) &&
    !isSubmitting;

  const handleSubmitLite = async () => {
    if (!liteCanSubmit || branchId === null) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await createOrder({
        branch_id: branchId,
        fulfillment_type: 'PICKUP',
        tx_delivery_mode: 'EXPRESS',
        tx_payment_method: 'EXPRESS',
        qty_delivery_amount: 0,
        tx_currency_code: 'Bs.',
        is_lite: 1,
        products: productsPayload,
      });
      await handleFinish(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el pedido');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitFull = async () => {
    if (branchId === null || !fulfillment || !paymentMethod) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const isDelivery = fulfillment === 'DELIVERY';
      const result = await createOrder({
        branch_id: branchId,
        fulfillment_type: fulfillment,
        tx_delivery_mode: 'EXPRESS',
        tx_payment_method: paymentMethod,
        qty_delivery_amount: 0,
        tx_currency_code: paymentCurrency,
        tx_payment_reference: paymentReference.trim() || undefined,
        dt_payment_date: new Date().toISOString().slice(0, 10),
        amt_payment_amount: paymentAmount ?? undefined,
        cod_bank_origin: bankOrigin || undefined,
        tx_depositor_name: paymentMethod === 'ZELLE' ? depositorName.trim() || undefined : undefined,
        tx_phone_number: paymentMethod === 'PAGOMOVIL' ? payerPhone.trim() || undefined : undefined,
        tx_country_code: paymentMethod === 'PAGOMOVIL' ? '+58' : undefined,
        ...(isDelivery && {
          dt_delivery_date: new Date().toISOString().slice(0, 19).replace('T', ' '),
          tx_recipient_name: recipientName.trim(),
          tx_recipient_address: deliveryAddress?.tx_address.trim(),
          tx_recipient_aditional_info: comments.trim() || undefined,
          tx_recipient_country_code: '+58' as const,
          tx_recipient_phone_number: recipientPhone.trim(),
        }),
        products: productsPayload,
      });
      await handleFinish(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el pedido');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderNumber) {
    return (
      <CheckoutSuccess
        orderNumber={orderNumber}
        companyPhone={appConfig?.tx_company_phone}
        colors={colors}
        insets={insets}
      />
    );
  }

  if (cartItems.length === 0) {
    return <CheckoutEmpty colors={colors} insets={insets} />;
  }

  if (!isLite) {
    if (fullStep === 'entrega') {
      return (
        <CheckoutEntregaStep onNext={() => setFullStep('pago')} insets={insets} colors={colors} />
      );
    }
    return (
      <CheckoutPagoStep
        fulfillment={fulfillment ?? 'PICKUP'}
        cartSummary={cartSummary}
        exchangeRate={exchangeRate}
        displayCurrency={displayCurrency}
        isSubmitting={isSubmitting}
        error={error}
        onBack={() => setFullStep('entrega')}
        onSubmit={handleSubmitFull}
        colors={colors}
        insets={insets}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <CheckoutBackButton insets={insets} colors={colors} />

      <KeyboardAwareScrollView
        bottomOffset={24}
        contentContainerStyle={{ padding: 24, paddingTop: insets.top + 60, gap: 4 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground, marginBottom: 6 }}>
          Confirmar pedido
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 20 }}>
          Completá tus datos para finalizar la compra.
        </Text>

        <CheckoutField label="Tipo de entrega" colors={colors}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <CheckoutOptionCard
              label="Retiro en tienda"
              icon={Store}
              active={liteFulfillment === 'PICKUP'}
              onPress={() => setLiteFulfillment('PICKUP')}
              colors={colors}
            />
            <CheckoutOptionCard
              label="Delivery"
              icon={MapPin}
              active={liteFulfillment === 'DELIVERY'}
              onPress={() => setLiteFulfillment('DELIVERY')}
              colors={colors}
            />
          </View>
        </CheckoutField>

        {liteFulfillment === 'DELIVERY' && (
          <CheckoutField label="Dirección de entrega" colors={colors}>
            <TextInput
              value={liteAddress}
              onChangeText={setLiteAddress}
              placeholder="Calle, edificio, referencia"
              placeholderTextColor={colors.muted}
              style={checkoutInputStyle(colors)}
              multiline
            />
          </CheckoutField>
        )}

        <CheckoutField label="Nombre completo" colors={colors}>
          <TextInput
            value={liteName}
            onChangeText={setLiteName}
            placeholder="Tu nombre y apellido"
            placeholderTextColor={colors.muted}
            style={checkoutInputStyle(colors)}
          />
        </CheckoutField>

        <CheckoutField label="Teléfono" colors={colors}>
          <TextInput
            value={litePhone}
            onChangeText={setLitePhone}
            placeholder="+58 0414-1234567"
            placeholderTextColor={colors.muted}
            style={checkoutInputStyle(colors)}
            keyboardType="phone-pad"
          />
        </CheckoutField>

        <CheckoutField label="Email (opcional)" colors={colors}>
          <TextInput
            value={liteEmail}
            onChangeText={setLiteEmail}
            placeholder="tucorreo@ejemplo.com"
            placeholderTextColor={colors.muted}
            style={checkoutInputStyle(colors)}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </CheckoutField>

        <View
          style={{
            flexDirection: 'row',
            gap: 8,
            backgroundColor: colors.primaryOverlaySoft,
            borderRadius: 12,
            padding: 12,
            marginBottom: 4,
          }}
        >
          <Text style={{ fontSize: 12, color: colors.foreground, flex: 1 }}>
            Un representante de la tienda te va a contactar por WhatsApp para coordinar el pago y la entrega. No
            se requiere pago en línea en este momento.
          </Text>
        </View>

        <View style={{ marginTop: 12, marginBottom: 12 }}>
          <CartSummaryCard
            summary={cartSummary}
            exchangeRate={exchangeRate}
            displayCurrency={displayCurrency}
            colors={colors}
          >
            {error && <Text style={{ fontSize: 13, color: colors.danger }}>{error}</Text>}

            <Pressable
              onPress={handleSubmitLite}
              disabled={!liteCanSubmit}
              style={{
                height: 50,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: liteCanSubmit ? colors.primary : colors.border,
              }}
              accessibilityRole="button"
              accessibilityLabel="Confirmar pedido"
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '700',
                    color: liteCanSubmit ? colors.onPrimary : colors.muted,
                  }}
                >
                  Confirmar pedido
                </Text>
              )}
            </Pressable>
          </CartSummaryCard>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

function CheckoutSuccess({
  orderNumber,
  companyPhone,
  colors,
  insets,
}: {
  orderNumber: string;
  companyPhone?: string;
  colors: ThemeColors;
  insets: { top: number; bottom: number };
}) {
  const router = useRouter();
  const phone = companyPhone || '+58 424 0000000';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAwareScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.primaryOverlaySoft,
            marginBottom: 20,
          }}
        >
          <CircleCheck size={44} color={colors.success} strokeWidth={1.6} />
        </View>
        <Text
          style={{ fontSize: 19, fontWeight: '700', color: colors.foreground, textAlign: 'center', marginBottom: 8 }}
        >
          ¡Pedido confirmado!
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: 20 }}>
          Recibimos tu orden. Te contactaremos por WhatsApp para coordinar la entrega.
        </Text>

        <View
          style={{
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: colors.border,
            borderRadius: 999,
            paddingVertical: 10,
            paddingHorizontal: 20,
            marginBottom: 24,
          }}
        >
          <Text style={{ fontSize: 14, color: colors.foreground }}>
            Orden <Text style={{ fontWeight: '700' }}>#{orderNumber}</Text>
          </Text>
        </View>

        <View
          style={{
            width: '100%',
            backgroundColor: colors.section,
            borderRadius: 14,
            padding: 16,
            gap: 12,
            marginBottom: 20,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 0.4 }}>
            QUÉ SIGUE AHORA
          </Text>
          <NextStepRow
            index={1}
            title="Confirmamos tu pago"
            detail="en los próximos 30 minutos."
            colors={colors}
          />
          <NextStepRow
            index={2}
            title="Te contactamos por WhatsApp"
            detail={`al ${phone} para validar la entrega.`}
            colors={colors}
          />
          <NextStepRow
            index={3}
            title="Preparamos tu pedido"
            detail="en la sede seleccionada, listo para retiro o despacho."
            colors={colors}
          />
        </View>

        <Pressable
          onPress={() => router.replace('/orders')}
          style={{
            width: '100%',
            height: 50,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.primary,
            marginBottom: 12,
          }}
          accessibilityRole="button"
          accessibilityLabel="Ver mis órdenes"
        >
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.onPrimary }}>Ver mis órdenes</Text>
        </Pressable>
        <Pressable
          onPress={() => router.replace('/')}
          style={{ marginBottom: 20 }}
          accessibilityRole="button"
          accessibilityLabel="Volver al inicio"
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.muted }}>Volver al inicio</Text>
        </Pressable>

        <Pressable
          onPress={() => Linking.openURL(`https://wa.me/${phone.replace(/\D/g, '')}`)}
          style={{
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: 'rgba(37, 211, 102, 0.12)',
            borderRadius: 12,
            padding: 14,
          }}
          accessibilityRole="button"
          accessibilityLabel="Escribinos por WhatsApp"
        >
          <MessageCircle size={20} color="#25D366" />
          <Text style={{ fontSize: 13, color: colors.foreground, flex: 1 }}>
            ¿Duda sobre tu pedido? Escribinos al <Text style={{ fontWeight: '700' }}>{phone}</Text>
          </Text>
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}

function NextStepRow({
  index,
  title,
  detail,
  colors,
}: {
  index: number;
  title: string;
  detail: string;
  colors: ThemeColors;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: colors.primaryOverlay,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>{index}</Text>
      </View>
      <Text style={{ fontSize: 13, color: colors.foreground, flex: 1, lineHeight: 18 }}>
        <Text style={{ fontWeight: '700' }}>{title}</Text> {detail}
      </Text>
    </View>
  );
}

function CheckoutEmpty({ colors, insets }: { colors: ThemeColors; insets: { top: number } }) {
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <CheckoutBackButton insets={insets} colors={colors} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <Text style={{ fontSize: 15, color: colors.muted, textAlign: 'center', marginBottom: 20 }}>
          Tu carrito está vacío.
        </Text>
        <Pressable onPress={() => router.replace('/')} accessibilityRole="button" accessibilityLabel="Ir a comprar">
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary }}>Ir a comprar</Text>
        </Pressable>
      </View>
    </View>
  );
}

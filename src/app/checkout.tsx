import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, CircleCheck, Info, MessageCircle } from 'lucide-react-native';

import { createOrder } from '@/api/services/orders.services';
import { CartSummaryCard } from '@/components/CartSummaryCard';
import { CartMaintenance } from '@/components/CartMaintenance';
import { CartTimer } from '@/components/CartTimer';
import { CheckoutBackButton } from '@/components/CheckoutPrimitives';
import { CheckoutEntregaStep } from '@/components/CheckoutEntregaStep';
import { CheckoutPagoStep } from '@/components/CheckoutPagoStep';
import { PhoneContactFields } from '@/components/PhoneContactFields';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { useCartTimer } from '@/hooks/useCartTimer';
import { useSafePush } from '@/hooks/useSafePush';
import { selectEffectiveBranchId, useBranchStore } from '@/store/branch.store';
import { useCartStore } from '@/store/cart.store';
import { useCartTimerStore } from '@/store/cartTimer.store';
import { useToastStore } from '@/store/toast.store';
import { useCheckoutStore } from '@/store/checkout.store';
import { isCartModuleEnabled, isConfigFlagTrue, useConfigStore, useThemeColors } from '@/store/config.store';
import { useUserStore } from '@/store/user.store';
import { hexToRgba, type ThemeColors } from '@/theme/colors';
import { isAreaCodeValid, isPhoneNumberValid, VE_AREA_CODES, VE_COUNTRY_CODE } from '@/utils/phone';
import { buildLiteOrderPayload } from '@/utils/orderPayload';
import { hasStockIssue } from '@/utils/cartStock';
import { getCartSummary } from '@/utils/pricing';

/**
 * Envuelve el checkout con el timer de reserva (el mismo del carrito: el
 * `deadline` vive en `useCartTimerStore`, así que sigue corriendo al pasar del
 * carrito acá). Va aparte del flujo para poder superponer la píldora sin tocar
 * el layout de cada paso. Al vencer vuelve al carrito, que se repone del servidor.
 * Se apaga solo cuando el carrito queda vacío (pedido creado).
 */
export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const router = useRouter();
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const branchId = useBranchStore(selectEffectiveBranchId);
  const items = useCartStore((s) => s.items);
  const timerSeconds = useConfigStore((s) => s.appConfig?.qty_cart_seconds ?? 0);
  const hasItems = useMemo(() => items.some((item) => item.branch_id === branchId), [items, branchId]);
  const timerEnabled = isAuthenticated && hasItems && timerSeconds > 0;

  const remainingSeconds = useCartTimer({
    enabled: timerEnabled,
    totalSeconds: timerSeconds,
    onExpire: () => {
      useToastStore.getState().show('Venció el tiempo de reserva. Revisa tu carrito para continuar.');
      router.replace('/cart');
    },
  });

  return (
    <View style={{ flex: 1 }}>
      <CheckoutFlow />
      {timerEnabled && (
        <View pointerEvents="none" style={{ position: 'absolute', top: insets.top + 14, right: 16 }}>
          <CartTimer remainingSeconds={remainingSeconds} totalSeconds={timerSeconds} colors={colors} variant="pill" />
        </View>
      )}
    </View>
  );
}

/**
 * Orquesta los dos modos del checkout (CHECKOUT-FLOW.md), gateado en
 * runtime por `appConfig.is_lite_mode`:
 *  - Lite: un solo paso (teléfono de contacto + aceptar) → éxito. El
 *    cliente no elige entrega ni pago: se manda `fulfillment_type: 'TBD'`
 *    ("Por definir"), `tx_payment_method: 'EXPRESS'`, `is_lite: 1` y el
 *    **teléfono en 3 partes** (`tx_recipient_country_code/area_code/
 *    phone_number`). Con `is_lite_mode = 1` el backend (`OrderController`)
 *    exige el teléfono aun en retiro y responde 400 "El código del país es
 *    requerido." si falta; un asesor llama o escribe por WhatsApp para
 *    coordinar. Ver `docs/mobile/12-checkout-lite.md` de la web.
 *  - Full: 2 pasos locales (Entrega → Pago), con estado compartido en
 *    `useCheckoutStore` — éxito. Sin mapa interactivo para elegir
 *    dirección todavía (MVP, ver `CheckoutEntregaStep`).
 */
function CheckoutFlow() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const appConfig = useConfigStore((s) => s.appConfig);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const branchId = useBranchStore(selectEffectiveBranchId);

  const items = useCartStore((s) => s.items);
  const clearBranchLocal = useCartStore((s) => s.clearBranchLocal);
  const cartItems = useMemo(
    () => items.filter((item) => item.branch_id === branchId),
    [items, branchId]
  );
  const cartSummary = useMemo(() => getCartSummary(cartItems), [cartItems]);
  const refreshCartFromServer = useCartStore((s) => s.refreshFromServer);

  // La orden se arma con el carrito del SERVIDOR: antes de mostrar totales y
  // pedir datos se repone, para no cobrar algo distinto de lo que se ve.
  useEffect(() => {
    if (isAuthenticated && branchId !== null) void refreshCartFromServer(branchId);
  }, [isAuthenticated, branchId, refreshCartFromServer]);
  const { displayCurrency, exchangeRate } = useDisplayCurrency();

  const resetCheckout = useCheckoutStore((s) => s.reset);
  const fulfillment = useCheckoutStore((s) => s.fulfillment);
  const deliveryAddress = useCheckoutStore((s) => s.deliveryAddress);
  const recipientName = useCheckoutStore((s) => s.recipientName);
  const recipientAreaCode = useCheckoutStore((s) => s.recipientAreaCode);
  const recipientPhone = useCheckoutStore((s) => s.recipientPhone);
  const comments = useCheckoutStore((s) => s.comments);
  const paymentMethod = useCheckoutStore((s) => s.paymentMethod);
  const paymentAmount = useCheckoutStore((s) => s.paymentAmount);
  const paymentCurrency = useCheckoutStore((s) => s.paymentCurrency);
  const paymentReference = useCheckoutStore((s) => s.paymentReference);
  const bankOrigin = useCheckoutStore((s) => s.bankOrigin);
  const depositorName = useCheckoutStore((s) => s.depositorName);
  const payerPhone = useCheckoutStore((s) => s.payerPhone);
  const deliveryFee = useCheckoutStore((s) => s.deliveryFee);

  const [fullStep, setFullStep] = useState<'entrega' | 'pago'>('entrega');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  // Modo Lite: no se elige entrega ni se piden datos — el backend ya
  // conoce al usuario autenticado. Solo se pide aceptar que la tienda
  // va a contactarlo para coordinar pago y entrega (CHECKOUT-FLOW.md §12).
  const [acceptContact, setAcceptContact] = useState(false);
  // Teléfono de contacto del modo Lite (obligatorio incluso en retiro).
  const [liteAreaCode, setLiteAreaCode] = useState<string>(VE_AREA_CODES[0]);
  const [litePhone, setLitePhone] = useState('');

  const isLite = isConfigFlagTrue(appConfig?.is_lite_mode);

  const productsPayload = cartItems.map((item) => ({ tx_slug: item.tx_slug, qty_product: item.qty }));

  const handleFinish = async (result: { tx_order_number: string }) => {
    // Bug §20.7 de la web corregido: no avanzar a "éxito" si el backend
    // no mandó un número de orden real.
    if (!result.tx_order_number) {
      setError('No pudimos confirmar tu pedido. Intentá de nuevo.');
      return;
    }
    // El backend ya vació su carrito al crear la orden: se limpia SOLO lo local.
    // Llamar a `remove-product` sobre ítems que ya no existen daría errores.
    if (branchId !== null) clearBranchLocal(branchId);
    resetCheckout();
    useCartTimerStore.getState().reset();
    setOrderNumber(result.tx_order_number);
  };

  const liteCanSubmit =
    acceptContact && isAreaCodeValid(liteAreaCode) && isPhoneNumberValid(litePhone) && !isSubmitting;

  const handleSubmitLite = async () => {
    if (!liteCanSubmit || branchId === null) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await createOrder(
        buildLiteOrderPayload({
          branchId,
          areaCode: liteAreaCode,
          phoneNumber: litePhone,
          products: productsPayload,
        })
      );
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
        // `deliveryFee` es null cuando no se pudo cotizar (sede sin regla
        // de envío, sin coords, error de red) — se manda 0 y el costo
        // real se coordina por WhatsApp, nunca se bloquea el pedido por esto.
        qty_delivery_amount: isDelivery ? (deliveryFee ?? 0) : 0,
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
          tx_recipient_country_code: VE_COUNTRY_CODE,
          tx_recipient_area_code: recipientAreaCode,
          tx_recipient_phone_number: recipientPhone,
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

  if (!isCartModuleEnabled(appConfig?.is_show_cart)) {
    return <CartMaintenance colors={colors} insetsTop={insets.top} />;
  }

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

  // El backend exige sesión para crear la orden (la web deshabilita el botón
  // sin token). El carrito ya redirige a /login, pero acá también se cubre
  // la sesión que expira con el checkout abierto (401 → signOut global).
  if (!isAuthenticated) {
    return <CheckoutLoginRequired colors={colors} insets={insets} />;
  }

  // El stock cambió entre el carrito y acá (o se refrescó desde el servidor): el
  // backend rechazaría la orden con "No tenemos esa cantidad disponible".
  if (cartItems.some(hasStockIssue)) {
    return <CheckoutStockIssue colors={colors} insets={insets} />;
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
        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground, marginBottom: 16 }}>
          Confirmar pedido
        </Text>

        <View
          style={{
            flexDirection: 'row',
            gap: 10,
            backgroundColor: hexToRgba(colors.warning, 0.12),
            borderRadius: 12,
            padding: 14,
            marginBottom: 16,
          }}
        >
          <Info size={16} color={colors.warning} style={{ marginTop: 1 }} />
          <Text style={{ fontSize: 13, color: colors.foreground, flex: 1, lineHeight: 18 }}>
            Al registrar tu pedido, un representante de la tienda te contactará para coordinar el método de pago y
            la entrega. No se requiere pago en línea ni datos de despacho en este momento.
          </Text>
        </View>

        <PhoneContactFields
          label="Teléfono de contacto"
          areaCode={liteAreaCode}
          number={litePhone}
          onChangeAreaCode={setLiteAreaCode}
          onChangeNumber={setLitePhone}
          colors={colors}
        />

        <Pressable
          onPress={() => setAcceptContact((v) => !v)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acceptContact }}
          accessibilityLabel="Acepto que la tienda me contactará para coordinar el pago y la entrega"
        >
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              borderWidth: 1.5,
              borderColor: acceptContact ? colors.primary : colors.border,
              backgroundColor: acceptContact ? colors.primary : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {acceptContact && <Check size={14} color={colors.onPrimary} strokeWidth={3} />}
          </View>
          <Text style={{ fontSize: 13, color: colors.foreground, flex: 1 }}>
            Acepto que la tienda me contactará para coordinar el pago y la entrega.
          </Text>
        </Pressable>
      </KeyboardAwareScrollView>

      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: insets.bottom + 16,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.background,
        }}
      >
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

function CheckoutLoginRequired({ colors, insets }: { colors: ThemeColors; insets: { top: number } }) {
  const push = useSafePush();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <CheckoutBackButton insets={insets} colors={colors} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.foreground, textAlign: 'center', marginBottom: 6 }}>
          Inicia sesión para continuar
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: 24 }}>
          Necesitas una cuenta para registrar tu pedido. Tu carrito se conserva.
        </Text>
        <Pressable
          onPress={() => push('/login')}
          style={{ paddingVertical: 12, paddingHorizontal: 22, borderRadius: 999, backgroundColor: colors.primary }}
          accessibilityRole="button"
          accessibilityLabel="Iniciar sesión"
        >
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.onPrimary }}>Iniciar sesión</Text>
        </Pressable>
      </View>
    </View>
  );
}

function CheckoutStockIssue({ colors, insets }: { colors: ThemeColors; insets: { top: number } }) {
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <CheckoutBackButton insets={insets} colors={colors} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.foreground, textAlign: 'center', marginBottom: 6 }}>
          Revisa tu carrito
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: 24 }}>
          Algunos productos ya no tienen la cantidad que pediste. Ajusta las cantidades para continuar.
        </Text>
        <Pressable
          onPress={() => router.replace('/cart')}
          style={{ paddingVertical: 12, paddingHorizontal: 22, borderRadius: 999, backgroundColor: colors.primary }}
          accessibilityRole="button"
          accessibilityLabel="Volver al carrito"
        >
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.onPrimary }}>Volver al carrito</Text>
        </Pressable>
      </View>
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

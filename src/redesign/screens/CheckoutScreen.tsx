import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ChevronLeft, CircleCheck, Info, MessageCircle, ShoppingBag } from 'lucide-react-native';

import { createOrder } from '@/api/services/orders.services';
import { CheckoutEntregaStep } from '@/components/CheckoutEntregaStep';
import { CheckoutPagoStep } from '@/components/CheckoutPagoStep';
import { ModuleMaintenance } from '@/components/ModuleMaintenance';
import { useCartTimer } from '@/hooks/useCartTimer';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { useSafePush } from '@/hooks/useSafePush';
import { selectEffectiveBranchId, useBranchStore } from '@/store/branch.store';
import { useCartStore } from '@/store/cart.store';
import { useCartTimerStore } from '@/store/cartTimer.store';
import { useCheckoutStore } from '@/store/checkout.store';
import { isConfigFlagTrue, isModuleEnabled, useConfigStore, useThemeColors } from '@/store/config.store';
import { useToastStore } from '@/store/toast.store';
import { useUserStore } from '@/store/user.store';
import { hexToRgba, type ThemeColors } from '@/theme/colors';
import { hasStockIssue } from '@/utils/cartStock';
import { formatDisplayPrice } from '@/utils/currency';
import { buildWhatsAppUrl } from '@/utils/contact';
import { buildLiteOrderPayload } from '@/utils/orderPayload';
import { isAreaCodeValid, isPhoneNumberValid, VE_AREA_CODES, VE_COUNTRY_CODE } from '@/utils/phone';
import { getCartLinePricing, getCartSummary } from '@/utils/pricing';

import { CartSummaryCard } from '../components/CartSummaryCard';
import { CartTimer } from '../components/CartTimer';
import { PhoneContactFields } from '../components/PhoneContactFields';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Surface } from '../ui/Surface';
import { MIN_TOUCH } from '../ui/tokens';
import { Txt } from '../ui/Txt';

type Insets = { top: number; bottom: number };

/**
 * Checkout del rediseño. Envuelve el flujo con el timer de reserva (el mismo del carrito:
 * el `deadline` vive en `useCartTimerStore`, así que sigue corriendo al pasar del carrito
 * acá). Al vencer vuelve al carrito, que se repone del servidor. Se apaga solo cuando el
 * carrito queda vacío (pedido creado). Lógica copiada de `checkout.tsx`.
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
 * Orquesta los dos modos del checkout, gateado en runtime por `appConfig.is_lite_mode`:
 *  - **Lite** (el activo en producción): un solo paso (teléfono de contacto + aceptar) →
 *    éxito. Se manda `fulfillment_type: 'TBD'`, `tx_payment_method: 'EXPRESS'`, `is_lite: 1`
 *    y el teléfono en 3 partes (el backend lo exige aun en retiro: sin él responde 400 "El
 *    código del país es requerido."). Un asesor coordina pago y entrega por WhatsApp.
 *  - **Full**: 2 pasos (Entrega → Pago) con estado en `useCheckoutStore`. **Sus pasos siguen
 *    siendo los de v1** (`CheckoutEntregaStep`/`CheckoutPagoStep`): rediseñarlos es un
 *    subpaso aparte (ver `docs/redesign/MIGRATION.md`, 2.3b).
 */
function CheckoutFlow() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const appConfig = useConfigStore((s) => s.appConfig);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const branchId = useBranchStore(selectEffectiveBranchId);

  const items = useCartStore((s) => s.items);
  const clearBranchLocal = useCartStore((s) => s.clearBranchLocal);
  const cartItems = useMemo(() => items.filter((item) => item.branch_id === branchId), [items, branchId]);
  const cartSummary = useMemo(() => getCartSummary(cartItems), [cartItems]);
  const refreshCartFromServer = useCartStore((s) => s.refreshFromServer);

  // La orden se arma con el carrito del SERVIDOR: antes de mostrar totales y pedir datos se
  // repone, para no cobrar algo distinto de lo que se ve.
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

  // Modo Lite: no se elige entrega ni se piden datos — el backend ya conoce al usuario
  // autenticado. Solo se pide aceptar que la tienda lo contactará para coordinar.
  const [acceptContact, setAcceptContact] = useState(false);
  // Teléfono de contacto del modo Lite (obligatorio incluso en retiro).
  const [liteAreaCode, setLiteAreaCode] = useState<string>(VE_AREA_CODES[0]);
  const [litePhone, setLitePhone] = useState('');

  const isLite = isConfigFlagTrue(appConfig?.is_lite_mode);

  const productsPayload = cartItems.map((item) => ({ tx_slug: item.tx_slug, qty_product: item.qty }));

  const handleFinish = async (result: { tx_order_number: string }) => {
    // No avanzar a "éxito" si el backend no mandó un número de orden real.
    if (!result.tx_order_number) {
      setError('No pudimos confirmar tu pedido. Inténtalo de nuevo.');
      return;
    }
    // El backend ya vació su carrito al crear la orden: se limpia SOLO lo local. Llamar a
    // `remove-product` sobre ítems que ya no existen daría errores.
    if (branchId !== null) clearBranchLocal(branchId);
    resetCheckout();
    useCartTimerStore.getState().reset();
    setOrderNumber(result.tx_order_number);
  };

  const phoneOk = isAreaCodeValid(liteAreaCode) && isPhoneNumberValid(litePhone);
  const liteCanSubmit = acceptContact && phoneOk && !isSubmitting;

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
        // `deliveryFee` es null cuando no se pudo cotizar — se manda 0 y el costo real se
        // coordina por WhatsApp, nunca se bloquea el pedido por esto.
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

  if (!isModuleEnabled(appConfig?.is_show_cart)) {
    return <ModuleMaintenance colors={colors} insetsTop={insets.top} />;
  }

  if (orderNumber) {
    return (
      <CheckoutSuccess orderNumber={orderNumber} companyPhone={appConfig?.tx_company_phone} colors={colors} insets={insets} />
    );
  }

  if (cartItems.length === 0) {
    return (
      <StateScreen
        colors={colors}
        insets={insets}
        title="Tu carrito está vacío"
        message="Agrega productos para poder hacer un pedido."
        action={{ label: 'Ir a comprar', icon: ShoppingBag, to: '/' }}
      />
    );
  }

  // El backend exige sesión para crear la orden. El carrito ya redirige a /login, pero acá
  // también se cubre la sesión que expira con el checkout abierto (401 → signOut global).
  if (!isAuthenticated) {
    return (
      <StateScreen
        colors={colors}
        insets={insets}
        title="Inicia sesión para continuar"
        message="Necesitas una cuenta para registrar tu pedido. Tu carrito se conserva."
        action={{ label: 'Iniciar sesión', push: '/login' }}
      />
    );
  }

  // El stock cambió entre el carrito y acá: el backend rechazaría la orden con "No tenemos
  // esa cantidad disponible".
  if (cartItems.some(hasStockIssue)) {
    return (
      <StateScreen
        colors={colors}
        insets={insets}
        title="Revisa tu carrito"
        message="Algunos productos ya no tienen la cantidad que pediste. Ajusta las cantidades para continuar."
        action={{ label: 'Volver al carrito', to: '/cart' }}
      />
    );
  }

  if (!isLite) {
    if (fullStep === 'entrega') {
      return <CheckoutEntregaStep onNext={() => setFullStep('pago')} insets={insets} colors={colors} />;
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

  // ----- Modo Lite -----
  const fmt = (amount: number) => formatDisplayPrice(amount, exchangeRate, displayCurrency);
  const missing = !phoneOk ? 'Escribe tu teléfono de contacto' : !acceptContact ? 'Acepta ser contactado para continuar' : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAwareScrollView
        bottomOffset={24}
        contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, gap: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <BackButton colors={colors} />
          <Txt variant="title" colors={colors}>
            Confirmar pedido
          </Txt>
        </View>

        <View
          style={{
            flexDirection: 'row',
            gap: 10,
            backgroundColor: hexToRgba(colors.warning, 0.12),
            borderRadius: 12,
            padding: 14,
          }}
        >
          <Info size={18} color={colors.warning} style={{ marginTop: 1 }} />
          <View style={{ flex: 1 }}>
            <Txt variant="label" colors={colors} style={{ fontWeight: '500', lineHeight: 20 }}>
              Al registrar tu pedido, un representante de la tienda te contactará para coordinar el método de pago y
              la entrega. No se requiere pago en línea ni datos de despacho en este momento.
            </Txt>
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Txt variant="section" colors={colors}>
            Tu pedido
          </Txt>
          <Surface colors={colors} padding={0} style={{ overflow: 'hidden' }}>
            {cartItems.map((item, index) => (
              <View
                key={`${item.tx_slug}-${item.branch_id}`}
                style={{
                  flexDirection: 'row',
                  gap: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: colors.border,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Txt variant="label" colors={colors} numberOfLines={2}>
                    {item.nb_product}
                  </Txt>
                  <Txt variant="caption" color="muted" colors={colors}>
                    {item.qty} × {fmt(getCartLinePricing(item).unitPrice)}
                  </Txt>
                </View>
                <Txt variant="label" colors={colors}>
                  {fmt(getCartLinePricing(item).lineTotal)}
                </Txt>
              </View>
            ))}
          </Surface>
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
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acceptContact }}
          accessibilityLabel="Acepto que la tienda me contactará para coordinar el pago y la entrega"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: MIN_TOUCH }}
        >
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              borderWidth: 2,
              borderColor: acceptContact ? colors.primary : colors.muted,
              backgroundColor: acceptContact ? colors.primary : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {acceptContact && <Check size={16} color={colors.onPrimary} strokeWidth={3} />}
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="label" colors={colors} style={{ fontWeight: '500' }}>
              Acepto que la tienda me contactará para coordinar el pago y la entrega.
            </Txt>
          </View>
        </Pressable>
      </KeyboardAwareScrollView>

      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: insets.bottom + 10,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.productCard,
        }}
      >
        <CartSummaryCard
          summary={cartSummary}
          exchangeRate={exchangeRate}
          displayCurrency={displayCurrency}
          colors={colors}
          collapsible
        >
          {error && (
            <Txt variant="label" color="danger" colors={colors} accessibilityRole="alert">
              {error}
            </Txt>
          )}
          {!liteCanSubmit && !isSubmitting && missing && (
            <Txt variant="caption" color="muted" colors={colors} style={{ textAlign: 'center' }}>
              {missing}
            </Txt>
          )}
          <Button
            label="Confirmar pedido"
            onPress={handleSubmitLite}
            loading={isSubmitting}
            disabled={!liteCanSubmit && !isSubmitting}
            colors={colors}
          />
        </CartSummaryCard>
      </View>
    </View>
  );
}

/** Volver: `router.back()` o, si no hay historial, al carrito (igual que el original). */
function BackButton({ colors }: { colors: ThemeColors }) {
  const router = useRouter();
  return (
    <IconButton
      icon={ChevronLeft}
      label="Volver"
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/cart'))}
      colors={colors}
    />
  );
}

/**
 * Pantalla de estado simple (carrito vacío, sesión requerida, stock cambiado): título,
 * mensaje y UNA acción de 48 dp. `to` navega con `replace`; `push` con `useSafePush`.
 */
function StateScreen({
  colors,
  insets,
  title,
  message,
  action,
}: {
  colors: ThemeColors;
  insets: Insets | { top: number };
  title: string;
  message: string;
  action: { label: string; icon?: typeof ShoppingBag; to?: '/' | '/cart'; push?: '/login' };
}) {
  const router = useRouter();
  const push = useSafePush();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 12 }}>
        <BackButton colors={colors} />
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 8 }}>
        <Txt variant="section" colors={colors} style={{ textAlign: 'center' }}>
          {title}
        </Txt>
        <Txt variant="body" color="muted" colors={colors} style={{ textAlign: 'center', marginBottom: 16 }}>
          {message}
        </Txt>
        <Button
          label={action.label}
          icon={action.icon}
          fullWidth={false}
          onPress={() => (action.push ? push(action.push) : action.to && router.replace(action.to))}
          colors={colors}
        />
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
  insets: Insets;
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
          paddingHorizontal: 24,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: hexToRgba(colors.success, 0.12),
            marginBottom: 20,
          }}
        >
          <CircleCheck size={48} color={colors.success} strokeWidth={1.6} />
        </View>
        <Txt variant="title" colors={colors} style={{ textAlign: 'center', marginBottom: 8 }}>
          ¡Pedido confirmado!
        </Txt>
        <Txt variant="body" color="muted" colors={colors} style={{ textAlign: 'center', marginBottom: 20 }}>
          Recibimos tu orden. Te contactaremos por WhatsApp para coordinar la entrega.
        </Txt>

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
          accessible
          accessibilityLabel={`Número de orden ${orderNumber}`}
        >
          <Txt variant="label" colors={colors}>
            Orden <Txt variant="label" colors={colors} style={{ fontWeight: '800' }}>#{orderNumber}</Txt>
          </Txt>
        </View>

        <Surface colors={colors} tone="section" padding={16} style={{ width: '100%', gap: 14, marginBottom: 20 }}>
          <Txt variant="caption" color="muted" colors={colors} style={{ fontWeight: '700', letterSpacing: 0.4 }}>
            QUÉ SIGUE AHORA
          </Txt>
          <NextStepRow index={1} title="Confirmamos tu pago" detail="en los próximos 30 minutos." colors={colors} />
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
        </Surface>

        <View style={{ width: '100%', gap: 10 }}>
          <Button label="Ver mis órdenes" onPress={() => router.replace('/orders')} colors={colors} />
          <Button label="Volver al inicio" variant="ghost" onPress={() => router.replace('/')} colors={colors} />
        </View>

        <Pressable
          onPress={() => {
            // `wa.me` exige el número internacional ("0422…" → "58422…"), ver `utils/contact.ts`.
            const url = buildWhatsAppUrl(phone);
            if (url) Linking.openURL(url).catch(() => undefined);
          }}
          accessibilityRole="button"
          accessibilityLabel="Escríbenos por WhatsApp"
          style={({ pressed }) => ({
            width: '100%',
            minHeight: MIN_TOUCH,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            marginTop: 20,
            backgroundColor: 'rgba(37, 211, 102, 0.12)',
            borderRadius: 12,
            padding: 14,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <MessageCircle size={22} color="#128C7E" />
          <View style={{ flex: 1 }}>
            <Txt variant="label" colors={colors} style={{ fontWeight: '500' }}>
              ¿Dudas sobre tu pedido? Escríbenos al{' '}
              <Txt variant="label" colors={colors} style={{ fontWeight: '800' }}>
                {phone}
              </Txt>
            </Txt>
          </View>
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
}): ReactNode {
  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: colors.primaryOverlay,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Txt variant="caption" color="primary" colors={colors} style={{ fontWeight: '800' }}>
          {index}
        </Txt>
      </View>
      <View style={{ flex: 1 }}>
        <Txt variant="label" colors={colors} style={{ fontWeight: '500', lineHeight: 20 }}>
          <Txt variant="label" colors={colors} style={{ fontWeight: '800' }}>
            {title}
          </Txt>{' '}
          {detail}
        </Txt>
      </View>
    </View>
  );
}

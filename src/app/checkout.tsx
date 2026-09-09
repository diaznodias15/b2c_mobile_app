import { useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircleCheck, ChevronLeft, MapPin, Store } from 'lucide-react-native';

import { createOrder } from '@/api/services/orders.services';
import { CartSummaryCard } from '@/components/CartSummaryCard';
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
 * Checkout modo Lite (2 pasos: confirmar → éxito). El modo Full (4
 * pasos: entrega → pago → confirmar → éxito) queda pendiente — el
 * tenant activo hoy corre en Lite (`is_lite_mode: 1`), así que se
 * construyó ese primero (pedido explícito del usuario, 2026-09-09).
 * Gate en runtime: si `appConfig.is_lite_mode` es falso, se muestra un
 * stub en vez de forzar un flujo que todavía no existe.
 */
export default function CheckoutScreen() {
  const router = useRouter();
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

  const [fulfillment, setFulfillment] = useState<FulfillmentType>('PICKUP');
  const [addressText, setAddressText] = useState('');
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.tx_phone ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const isLite = isConfigFlagTrue(appConfig?.is_lite_mode);

  const canSubmit =
    (fulfillment === 'PICKUP' || addressText.trim().length > 5) &&
    isNameValid(name) &&
    phone.trim().length >= 7 &&
    (email.trim().length === 0 || isEmailValid(email)) &&
    !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit || branchId === null) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await createOrder({
        branch_id: branchId,
        fulfillment_type: fulfillment,
        address: fulfillment === 'DELIVERY' ? addressText.trim() : undefined,
        comments: comments.trim() || undefined,
        products: cartItems.map((item) => ({ tx_slug: item.tx_slug, qty_product: item.qty })),
        contact: {
          tx_name: name.trim(),
          tx_phone: phone.trim(),
          tx_email: email.trim() || undefined,
        },
      });
      cartItems.forEach((item) => removeProduct(item.tx_slug, item.branch_id));
      resetCheckout();
      setOrderNumber(result.tx_order_number);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el pedido');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderNumber) {
    return <CheckoutSuccess orderNumber={orderNumber} colors={colors} insets={insets} />;
  }

  if (cartItems.length === 0) {
    return <CheckoutEmpty colors={colors} insets={insets} />;
  }

  if (!isLite) {
    return <CheckoutFullModeStub colors={colors} insets={insets} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <BackButton insets={insets} colors={colors} />

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

        <FieldLabel colors={colors}>Tipo de entrega</FieldLabel>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          <FulfillmentOption
            label="Retiro en tienda"
            icon={Store}
            active={fulfillment === 'PICKUP'}
            onPress={() => setFulfillment('PICKUP')}
            colors={colors}
          />
          <FulfillmentOption
            label="Delivery"
            icon={MapPin}
            active={fulfillment === 'DELIVERY'}
            onPress={() => setFulfillment('DELIVERY')}
            colors={colors}
          />
        </View>

        {fulfillment === 'DELIVERY' && (
          <Field label="Dirección de entrega" colors={colors}>
            <TextInput
              value={addressText}
              onChangeText={setAddressText}
              placeholder="Calle, edificio, referencia"
              placeholderTextColor={colors.muted}
              style={inputStyle(colors)}
              multiline
            />
          </Field>
        )}

        <Field label="Nombre completo" colors={colors}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Tu nombre y apellido"
            placeholderTextColor={colors.muted}
            style={inputStyle(colors)}
          />
        </Field>

        <Field label="Teléfono" colors={colors}>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+58 0414-1234567"
            placeholderTextColor={colors.muted}
            style={inputStyle(colors)}
            keyboardType="phone-pad"
          />
        </Field>

        <Field label="Email (opcional)" colors={colors}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="tucorreo@ejemplo.com"
            placeholderTextColor={colors.muted}
            style={inputStyle(colors)}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </Field>

        <Field label="Comentarios (opcional)" colors={colors}>
          <TextInput
            value={comments}
            onChangeText={setComments}
            placeholder="Alguna indicación para tu pedido"
            placeholderTextColor={colors.muted}
            style={inputStyle(colors)}
            multiline
          />
        </Field>

        <View style={{ marginTop: 12, marginBottom: 12 }}>
          <CartSummaryCard
            summary={cartSummary}
            exchangeRate={exchangeRate}
            displayCurrency={displayCurrency}
            colors={colors}
          >
            {error && <Text style={{ fontSize: 13, color: colors.danger }}>{error}</Text>}

            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={{
                height: 50,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: canSubmit ? colors.primary : colors.border,
              }}
              accessibilityRole="button"
              accessibilityLabel="Confirmar pedido"
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text
                  style={{ fontSize: 15, fontWeight: '700', color: canSubmit ? colors.onPrimary : colors.muted }}
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

function BackButton({ insets, colors }: { insets: { top: number }; colors: ThemeColors }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/cart'))}
      style={{
        position: 'absolute',
        top: insets.top + 10,
        left: 16,
        zIndex: 1,
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.section,
      }}
      accessibilityRole="button"
      accessibilityLabel="Volver"
      hitSlop={8}
    >
      <ChevronLeft size={22} color={colors.foreground} />
    </Pressable>
  );
}

function FulfillmentOption({
  label,
  icon: Icon,
  active,
  onPress,
  colors,
}: {
  label: string;
  icon: typeof Store;
  active: boolean;
  onPress: () => void;
  colors: ThemeColors;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: active ? colors.primary : colors.section,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
      }}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      <Icon size={18} color={active ? colors.onPrimary : colors.foreground} />
      <Text style={{ fontSize: 14, fontWeight: '600', color: active ? colors.onPrimary : colors.foreground }}>
        {label}
      </Text>
    </Pressable>
  );
}

function Field({ label, colors, children }: { label: string; colors: ThemeColors; children: ReactNode }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <FieldLabel colors={colors}>{label}</FieldLabel>
      {children}
    </View>
  );
}

function FieldLabel({ children, colors }: { children: ReactNode; colors: ThemeColors }) {
  return (
    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 6 }}>{children}</Text>
  );
}

function inputStyle(colors: ThemeColors) {
  return {
    backgroundColor: colors.section,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.foreground,
  };
}

function CheckoutSuccess({
  orderNumber,
  colors,
  insets,
}: {
  orderNumber: string;
  colors: ThemeColors;
  insets: { top: number; bottom: number };
}) {
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
          paddingTop: insets.top,
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
          ¡Pedido creado!
        </Text>
        {orderNumber.length > 0 && (
          <Text style={{ fontSize: 15, color: colors.muted, textAlign: 'center', marginBottom: 28 }}>
            Orden <Text style={{ fontWeight: '700', color: colors.foreground }}>#{orderNumber}</Text>
          </Text>
        )}

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
          accessibilityRole="button"
          accessibilityLabel="Volver al inicio"
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.muted }}>Volver al inicio</Text>
        </Pressable>
      </View>
    </View>
  );
}

function CheckoutEmpty({ colors, insets }: { colors: ThemeColors; insets: { top: number } }) {
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <BackButton insets={insets} colors={colors} />
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

function CheckoutFullModeStub({ colors, insets }: { colors: ThemeColors; insets: { top: number } }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <BackButton insets={insets} colors={colors} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <Text style={{ fontSize: 15, color: colors.muted, textAlign: 'center' }}>
          El checkout con pago todavía no está disponible en este modo. Estamos trabajando en eso.
        </Text>
      </View>
    </View>
  );
}

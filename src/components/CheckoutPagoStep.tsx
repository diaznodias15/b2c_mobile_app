import { useEffect } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useQuery } from '@tanstack/react-query';
import { Banknote, CreditCard, Landmark, Smartphone, TriangleAlert } from 'lucide-react-native';

import { getPaymentMethods } from '@/api/services/payment-methods.services';
import { CartSummaryCard } from '@/components/CartSummaryCard';
import {
  CheckoutBackButton,
  CheckoutField,
  checkoutInputStyle,
} from '@/components/CheckoutPrimitives';
import { CheckoutSelectField } from '@/components/CheckoutSelectField';
import { PaymentMethodCard, paymentMethodColorFor } from '@/components/PaymentMethodCard';
import { useCheckoutStore } from '@/store/checkout.store';
import { hexToRgba, type ThemeColors } from '@/theme/colors';
import { calculateAmountWithIgtf } from '@/utils/igtf';
import { isNameValid } from '@/utils/validations';
import type { CartSummary } from '@/utils/pricing';
import type { DisplayCurrency } from '@/store/currency.store';
import type { FulfillmentType } from '@/types/cart';
import type { PaymentMethodCode } from '@/types/orders';

const METHODS_WITH_FORM: PaymentMethodCode[] = ['EFECTIVO', 'PAGOMOVIL', 'TRANSFERENCIA', 'ZELLE'];
/** Métodos que exigen una referencia de pago (CHECKOUT-FLOW.md §6.1). */
const METHODS_NEEDING_REFERENCE: PaymentMethodCode[] = ['PAGOMOVIL', 'TRANSFERENCIA', 'ZELLE'];

/**
 * Step 2 del checkout Full: método de pago + sub-formulario dinámico
 * (CHECKOUT-FLOW.md §13). A diferencia de la web, acá se corrigen 2
 * bugs conocidos a propósito (§20.1/§20.4): la referencia SÍ se valida
 * como requerida para los métodos que la necesitan, con largo 5-6.
 */
export function CheckoutPagoStep({
  fulfillment,
  cartSummary,
  exchangeRate,
  displayCurrency,
  isSubmitting,
  error,
  onBack,
  onSubmit,
  colors,
  insets,
}: {
  fulfillment: FulfillmentType;
  cartSummary: CartSummary;
  exchangeRate: number | null | undefined;
  displayCurrency: DisplayCurrency;
  isSubmitting: boolean;
  error: string | null;
  onBack: () => void;
  onSubmit: () => void;
  colors: ThemeColors;
  insets: { top: number };
}) {
  const paymentMethod = useCheckoutStore((s) => s.paymentMethod);
  const setPaymentMethod = useCheckoutStore((s) => s.setPaymentMethod);
  const paymentAmount = useCheckoutStore((s) => s.paymentAmount);
  const setPaymentAmount = useCheckoutStore((s) => s.setPaymentAmount);
  const paymentCurrency = useCheckoutStore((s) => s.paymentCurrency);
  const setPaymentCurrency = useCheckoutStore((s) => s.setPaymentCurrency);
  const paymentReference = useCheckoutStore((s) => s.paymentReference);
  const setPaymentReference = useCheckoutStore((s) => s.setPaymentReference);
  const bankOrigin = useCheckoutStore((s) => s.bankOrigin);
  const setBankOrigin = useCheckoutStore((s) => s.setBankOrigin);
  const depositorName = useCheckoutStore((s) => s.depositorName);
  const setDepositorName = useCheckoutStore((s) => s.setDepositorName);
  const payerPhone = useCheckoutStore((s) => s.payerPhone);
  const setPayerPhone = useCheckoutStore((s) => s.setPayerPhone);
  const deliveryFee = useCheckoutStore((s) => s.deliveryFee);

  const { data: methodsConfig, isLoading: isLoadingMethods } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: () => getPaymentMethods(),
  });

  const rate = exchangeRate ?? 0;

  const showPuntoDeVenta = fulfillment === 'PICKUP';
  const showPagoMovil = (methodsConfig?.pago_movil.length ?? 0) > 0;
  const showTransferencia = (methodsConfig?.transferencia_bancaria.length ?? 0) > 0;
  const showZelle = (methodsConfig?.zelle.length ?? 0) > 0;

  // Si el método seleccionado deja de estar disponible (ej. cambió de
  // DELIVERY a estar acá con PUNTODEVENTA ya no visible), lo deselecciona.
  useEffect(() => {
    if (paymentMethod === 'PUNTODEVENTA' && !showPuntoDeVenta) setPaymentMethod(null);
  }, [paymentMethod, showPuntoDeVenta, setPaymentMethod]);

  const handleSelectMethod = (method: PaymentMethodCode) => {
    setPaymentMethod(method);
    if (method === 'ZELLE') {
      setPaymentCurrency('USD.');
      setPaymentAmount(calculateAmountWithIgtf(cartSummary.total, rate));
    } else {
      setPaymentCurrency('Bs.');
      setPaymentAmount(cartSummary.total);
    }
  };

  const handleToggleEfectivoCurrency = (currency: 'Bs.' | 'USD.') => {
    setPaymentCurrency(currency);
    setPaymentAmount(currency === 'USD.' ? calculateAmountWithIgtf(cartSummary.total, rate) : cartSummary.total);
  };

  const needsReference = paymentMethod !== null && METHODS_NEEDING_REFERENCE.includes(paymentMethod);
  const hasForm = paymentMethod !== null && METHODS_WITH_FORM.includes(paymentMethod);

  const canSubmit =
    paymentMethod !== null &&
    paymentAmount !== null &&
    paymentAmount > 0 &&
    (!needsReference || (paymentReference.trim().length >= 5 && paymentReference.trim().length <= 6)) &&
    (paymentMethod !== 'PAGOMOVIL' || (bankOrigin !== '' && payerPhone.trim().length >= 7)) &&
    (paymentMethod !== 'TRANSFERENCIA' || bankOrigin !== '') &&
    (paymentMethod !== 'ZELLE' || isNameValid(depositorName)) &&
    !isSubmitting;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <CheckoutBackButton insets={insets} colors={colors} onPress={onBack} />

      <KeyboardAwareScrollView
        bottomOffset={24}
        contentContainerStyle={{ padding: 24, paddingTop: insets.top + 60 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground, marginBottom: 6 }}>
          ¿Cómo preferís pagar?
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 20 }}>
          Elegí un método. El formulario aparece debajo con los datos que necesitamos.
        </Text>

        {isLoadingMethods ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
            {showPuntoDeVenta && (
              <PaymentMethodCard
                label="Punto de venta"
                subtitle="Tarjeta en tienda"
                icon={CreditCard}
                {...paymentMethodColorFor('PUNTODEVENTA', colors)}
                selected={paymentMethod === 'PUNTODEVENTA'}
                onPress={() => handleSelectMethod('PUNTODEVENTA')}
                colors={colors}
              />
            )}
            <PaymentMethodCard
              label="Efectivo"
              subtitle="Pagás al recibir"
              icon={Banknote}
              {...paymentMethodColorFor('EFECTIVO', colors)}
              selected={paymentMethod === 'EFECTIVO'}
              onPress={() => handleSelectMethod('EFECTIVO')}
              colors={colors}
            />
            {showPagoMovil && (
              <PaymentMethodCard
                label="Pago móvil"
                subtitle="Bs."
                icon={Smartphone}
                {...paymentMethodColorFor('PAGOMOVIL', colors)}
                selected={paymentMethod === 'PAGOMOVIL'}
                onPress={() => handleSelectMethod('PAGOMOVIL')}
                colors={colors}
              />
            )}
            {showTransferencia && (
              <PaymentMethodCard
                label="Transferencia"
                subtitle="Cuenta bancaria"
                icon={Landmark}
                {...paymentMethodColorFor('TRANSFERENCIA', colors)}
                selected={paymentMethod === 'TRANSFERENCIA'}
                onPress={() => handleSelectMethod('TRANSFERENCIA')}
                colors={colors}
              />
            )}
            {showZelle && (
              <PaymentMethodCard
                label="Zelle"
                subtitle="USD · IGTF 3%"
                icon={Banknote}
                {...paymentMethodColorFor('ZELLE', colors)}
                selected={paymentMethod === 'ZELLE'}
                onPress={() => handleSelectMethod('ZELLE')}
                colors={colors}
              />
            )}
          </View>
        )}

        {paymentMethod === 'PUNTODEVENTA' && (
          <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 20 }}>
            Vas a pagar con tarjeta directamente al retirar tu pedido en la sede.
          </Text>
        )}

        {hasForm && (
          <View style={{ backgroundColor: colors.section, borderRadius: 14, padding: 16, gap: 4, marginBottom: 20 }}>
            {paymentMethod === 'EFECTIVO' && (
              <>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                  <CurrencyPill
                    label="Bs."
                    active={paymentCurrency === 'Bs.'}
                    onPress={() => handleToggleEfectivoCurrency('Bs.')}
                    colors={colors}
                  />
                  <CurrencyPill
                    label="USD."
                    active={paymentCurrency === 'USD.'}
                    onPress={() => handleToggleEfectivoCurrency('USD.')}
                    colors={colors}
                  />
                </View>
                <AmountField
                  amount={paymentAmount}
                  onChange={setPaymentAmount}
                  currency={paymentCurrency}
                  colors={colors}
                />
              </>
            )}

            {(paymentMethod === 'PAGOMOVIL' || paymentMethod === 'TRANSFERENCIA') && (
              <>
                <ReceiversList
                  colors={colors}
                  items={
                    paymentMethod === 'PAGOMOVIL'
                      ? (methodsConfig?.pago_movil ?? []).map((r) => [
                          ['Banco', r.tx_bank_description],
                          ['RIF', r.cod_rif],
                          ['Teléfono', r.tx_phone],
                        ])
                      : (methodsConfig?.transferencia_bancaria ?? []).map((r) => [
                          ['Banco', r.tx_bank_description],
                          ['RIF', r.cod_rif],
                          ['N° Cuenta', r.cod_bank_account],
                        ])
                  }
                />
                <CheckoutSelectField
                  label="Banco de origen"
                  placeholder="Seleccioná tu banco"
                  value={bankOrigin}
                  options={methodsConfig?.banks ?? []}
                  onChange={setBankOrigin}
                  colors={colors}
                />
                {paymentMethod === 'PAGOMOVIL' && (
                  <CheckoutField label="Teléfono del pagador" colors={colors}>
                    <TextInput
                      value={payerPhone}
                      onChangeText={setPayerPhone}
                      placeholder="+58 0414-1234567"
                      placeholderTextColor={colors.muted}
                      style={checkoutInputStyle(colors)}
                      keyboardType="phone-pad"
                    />
                  </CheckoutField>
                )}
                <AmountField amount={paymentAmount} onChange={setPaymentAmount} currency="Bs." colors={colors} />
                <ReferenceField
                  value={paymentReference}
                  onChange={setPaymentReference}
                  keyboardType="number-pad"
                  colors={colors}
                />
              </>
            )}

            {paymentMethod === 'ZELLE' && (
              <>
                <ReceiversList
                  colors={colors}
                  items={(methodsConfig?.zelle ?? []).map((r) => [
                    ['Titular', r.tx_bank_description],
                    ['Email', r.tx_email],
                  ])}
                />
                <CheckoutField label="Nombre del titular que envía" colors={colors}>
                  <TextInput
                    value={depositorName}
                    onChangeText={setDepositorName}
                    placeholder="Nombre y apellido"
                    placeholderTextColor={colors.muted}
                    style={checkoutInputStyle(colors)}
                  />
                </CheckoutField>
                <AmountField amount={paymentAmount} onChange={setPaymentAmount} currency="USD." colors={colors} />
                <ReferenceField
                  value={paymentReference}
                  onChange={setPaymentReference}
                  keyboardType="default"
                  colors={colors}
                />
              </>
            )}
          </View>
        )}

        {paymentMethod !== null && (
          <View
            style={{
              flexDirection: 'row',
              gap: 8,
              backgroundColor: hexToRgba(colors.warning, 0.12),
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <TriangleAlert size={16} color={colors.warning} style={{ marginTop: 1 }} />
            <Text style={{ fontSize: 12, color: colors.foreground, flex: 1 }}>
              Recordá reportar el monto exacto de tu pedido para evitar retrasos en la confirmación del pago.
            </Text>
          </View>
        )}

        {paymentCurrency === 'USD.' && paymentMethod !== null && (
          <View
            style={{
              flexDirection: 'row',
              gap: 8,
              backgroundColor: hexToRgba(colors.warning, 0.12),
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <TriangleAlert size={16} color={colors.warning} style={{ marginTop: 1 }} />
            <Text style={{ fontSize: 12, color: colors.foreground, flex: 1 }}>
              Los pagos en divisas aplican un recargo del 3% por concepto de IGTF de ley — ya está incluido en el
              monto de arriba.
            </Text>
          </View>
        )}

        <CartSummaryCard
          summary={cartSummary}
          exchangeRate={exchangeRate}
          displayCurrency={displayCurrency}
          colors={colors}
          deliveryFee={fulfillment === 'DELIVERY' ? deliveryFee : undefined}
        >
          {error && <Text style={{ fontSize: 13, color: colors.danger }}>{error}</Text>}
          <Pressable
            onPress={onSubmit}
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
      </KeyboardAwareScrollView>
    </View>
  );
}

function CurrencyPill({
  label,
  active,
  onPress,
  colors,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: ThemeColors;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
        backgroundColor: active ? colors.primary : colors.background,
      }}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={{ fontSize: 13, fontWeight: '700', color: active ? colors.onPrimary : colors.foreground }}>
        {label}
      </Text>
    </Pressable>
  );
}

function AmountField({
  amount,
  onChange,
  currency,
  colors,
}: {
  amount: number | null;
  onChange: (v: number | null) => void;
  currency: 'Bs.' | 'USD.';
  colors: ThemeColors;
}) {
  return (
    <CheckoutField label={`Monto del pago (${currency})`} colors={colors}>
      <TextInput
        value={amount !== null ? String(amount.toFixed(2)) : ''}
        onChangeText={(text) => {
          const parsed = Number(text.replace(',', '.'));
          onChange(Number.isFinite(parsed) ? parsed : null);
        }}
        placeholder="0.00"
        placeholderTextColor={colors.muted}
        style={checkoutInputStyle(colors)}
        keyboardType="decimal-pad"
      />
    </CheckoutField>
  );
}

function ReferenceField({
  value,
  onChange,
  keyboardType,
  colors,
}: {
  value: string;
  onChange: (v: string) => void;
  keyboardType: 'number-pad' | 'default';
  colors: ThemeColors;
}) {
  return (
    <CheckoutField label="Número de referencia (últimos 5-6 dígitos)" colors={colors}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="123456"
        placeholderTextColor={colors.muted}
        style={checkoutInputStyle(colors)}
        keyboardType={keyboardType}
        maxLength={6}
        autoCapitalize="characters"
      />
    </CheckoutField>
  );
}

function ReceiversList({
  items,
  colors,
}: {
  items: Array<Array<[string, string]>>;
  colors: ThemeColors;
}) {
  if (items.length === 0) return null;
  return (
    <View style={{ gap: 8, marginBottom: 12 }}>
      {items.map((fields, index) => (
        <View
          key={index}
          style={{
            backgroundColor: colors.background,
            borderRadius: 10,
            padding: 12,
            gap: 3,
          }}
        >
          {fields.map(([label, value]) => (
            <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <Text style={{ fontSize: 12, color: colors.muted }}>{label}</Text>
              <Text
                style={{ fontSize: 12, fontWeight: '600', color: colors.foreground, flexShrink: 1 }}
                selectable
                numberOfLines={1}
              >
                {value}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

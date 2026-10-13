import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useQuery } from '@tanstack/react-query';
import { Banknote, CreditCard, Landmark, Smartphone, TriangleAlert } from 'lucide-react-native';

import { getPaymentMethods } from '@/api/services/payment-methods.services';
import { paymentMethodColorFor } from '@/components/PaymentMethodCard';
import { useCheckoutStore } from '@/store/checkout.store';
import type { DisplayCurrency } from '@/store/currency.store';
import { hexToRgba, type ThemeColors } from '@/theme/colors';
import type { FulfillmentType } from '@/types/cart';
import type { PaymentMethodCode } from '@/types/orders';
import { calculateAmountWithIgtf } from '@/utils/igtf';
import type { CartSummary } from '@/utils/pricing';
import { isNameValid } from '@/utils/validations';

import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { SelectField } from '../ui/SelectField';
import { Surface } from '../ui/Surface';
import { TextField } from '../ui/TextField';
import { Txt } from '../ui/Txt';
import { CartSummaryCard } from './CartSummaryCard';
import { CheckoutStepHeader } from './CheckoutStepHeader';
import { PaymentMethodCard } from './PaymentMethodCard';

const METHODS_WITH_FORM: PaymentMethodCode[] = ['EFECTIVO', 'PAGOMOVIL', 'TRANSFERENCIA', 'ZELLE'];
/** Métodos que exigen una referencia de pago. */
const METHODS_NEEDING_REFERENCE: PaymentMethodCode[] = ['PAGOMOVIL', 'TRANSFERENCIA', 'ZELLE'];

/**
 * Paso 2 del checkout Full: método de pago + sub-formulario dinámico. **Mismo contrato que
 * `@/components/CheckoutPagoStep`** (`fulfillment`, `cartSummary`, `exchangeRate`, `displayCurrency`,
 * `isSubmitting`, `error`, `onBack`, `onSubmit`, `colors`, `insets`) y misma lógica, incluidas las
 * dos correcciones de la web que el original ya hacía a propósito: la referencia SÍ es obligatoria
 * (5-6 caracteres) en los métodos que la necesitan, y el monto de Zelle/divisas lleva el IGTF. El
 * método "Punto de venta" solo existe con retiro en tienda, el monto se autocalcula al elegir el
 * método pero es editable, y si el método elegido deja de estar disponible se deselecciona.
 *
 * Qué cambia (solo presentación):
 *  - Cabecera con "Paso 2 de 2" y barra de progreso.
 *  - Campos con `TextField` (etiqueta visible, 48 dp, error junto al campo); el banco de origen con
 *    `SelectField` (hoja con buscador y filas de 56 dp); moneda del efectivo con chips.
 *  - El campo de monto ya no se reformatea en cada tecla (el original mostraba `toFixed(2)` mientras
 *    se escribía): mantiene lo que la persona teclea y se vuelve a calcular al cambiar de método/moneda.
 *  - Datos del receptor ("a quién pagar") en una tarjeta legible, y avisos en 14 px con tuteo
 *    (el original decía "¿Cómo preferís pagar?" y "Recordá").
 *  - Barra inferior fija con el Total y "Confirmar pedido", con el motivo cuando está deshabilitado.
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
  insets: { top: number; bottom: number };
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

  // Si el método seleccionado deja de estar disponible, se deselecciona.
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

  const referenceLength = paymentReference.trim().length;
  const referenceOk = !needsReference || (referenceLength >= 5 && referenceLength <= 6);
  const amountOk = paymentAmount !== null && paymentAmount > 0;
  const payerPhoneOk = payerPhone.trim().length >= 7;
  const bankOk = bankOrigin !== '';

  const canSubmit =
    paymentMethod !== null &&
    amountOk &&
    referenceOk &&
    (paymentMethod !== 'PAGOMOVIL' || (bankOk && payerPhoneOk)) &&
    (paymentMethod !== 'TRANSFERENCIA' || bankOk) &&
    (paymentMethod !== 'ZELLE' || isNameValid(depositorName)) &&
    !isSubmitting;

  const missing =
    paymentMethod === null
      ? 'Elige un método de pago'
      : !amountOk
        ? 'Escribe el monto del pago'
        : (paymentMethod === 'PAGOMOVIL' || paymentMethod === 'TRANSFERENCIA') && !bankOk
          ? 'Elige tu banco de origen'
          : paymentMethod === 'PAGOMOVIL' && !payerPhoneOk
            ? 'Escribe el teléfono del pagador'
            : paymentMethod === 'ZELLE' && !isNameValid(depositorName)
              ? 'Escribe el nombre del titular que envía'
              : !referenceOk
                ? 'Escribe la referencia (5 o 6 caracteres)'
                : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAwareScrollView
        bottomOffset={24}
        contentContainerStyle={{ padding: 16, paddingTop: insets.top + 8, gap: 20, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <CheckoutStepHeader
          step={2}
          totalSteps={2}
          title="¿Cómo prefieres pagar?"
          subtitle="Elige un método. El formulario aparece debajo con los datos que necesitamos."
          onBack={onBack}
          colors={colors}
        />

        {isLoadingMethods ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
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
              subtitle="Pagas al recibir"
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
          <Txt variant="body" color="muted" colors={colors}>
            Vas a pagar con tarjeta directamente al retirar tu pedido en la sede.
          </Txt>
        )}

        {hasForm && (
          <Surface colors={colors} padding={16} style={{ gap: 16 }}>
            {paymentMethod === 'EFECTIVO' && (
              <>
                <View style={{ gap: 8 }}>
                  <Txt variant="label" colors={colors}>
                    Moneda
                  </Txt>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Chip
                      label="Bs."
                      selected={paymentCurrency === 'Bs.'}
                      onPress={() => handleToggleEfectivoCurrency('Bs.')}
                      colors={colors}
                    />
                    <Chip
                      label="USD."
                      selected={paymentCurrency === 'USD.'}
                      onPress={() => handleToggleEfectivoCurrency('USD.')}
                      colors={colors}
                    />
                  </View>
                </View>
                <AmountField
                  key={`${paymentMethod}-${paymentCurrency}`}
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
                <SelectField
                  label="Banco de origen"
                  placeholder="Selecciona tu banco"
                  value={bankOrigin}
                  options={methodsConfig?.banks ?? []}
                  onChange={setBankOrigin}
                  colors={colors}
                />
                {paymentMethod === 'PAGOMOVIL' && (
                  <TextField
                    label="Teléfono del pagador"
                    value={payerPhone}
                    onChangeText={setPayerPhone}
                    placeholder="+58 0414-1234567"
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                    error={payerPhone.length > 0 && !payerPhoneOk ? 'Escribe un teléfono válido.' : null}
                    colors={colors}
                  />
                )}
                <AmountField
                  key={`${paymentMethod}-Bs.`}
                  amount={paymentAmount}
                  onChange={setPaymentAmount}
                  currency="Bs."
                  colors={colors}
                />
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
                <TextField
                  label="Nombre del titular que envía"
                  value={depositorName}
                  onChangeText={setDepositorName}
                  placeholder="Nombre y apellido"
                  autoCapitalize="words"
                  autoComplete="name"
                  error={depositorName.length > 0 && !isNameValid(depositorName) ? 'Escribe el nombre del titular.' : null}
                  colors={colors}
                />
                <AmountField
                  key={`${paymentMethod}-USD.`}
                  amount={paymentAmount}
                  onChange={setPaymentAmount}
                  currency="USD."
                  colors={colors}
                />
                <ReferenceField
                  value={paymentReference}
                  onChange={setPaymentReference}
                  keyboardType="default"
                  colors={colors}
                />
              </>
            )}
          </Surface>
        )}

        {paymentMethod !== null && (
          <Notice colors={colors}>
            Recuerda reportar el monto exacto de tu pedido para evitar retrasos en la confirmación del pago.
          </Notice>
        )}

        {paymentCurrency === 'USD.' && paymentMethod !== null && (
          <Notice colors={colors}>
            Los pagos en divisas aplican un recargo del 3% por concepto de IGTF de ley; ya está incluido en el monto
            de arriba.
          </Notice>
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
        }}
      >
        <CartSummaryCard
          summary={cartSummary}
          exchangeRate={exchangeRate}
          displayCurrency={displayCurrency}
          colors={colors}
          deliveryFee={fulfillment === 'DELIVERY' ? deliveryFee : undefined}
          collapsible
        >
          {error && (
            <Txt variant="label" color="danger" colors={colors} accessibilityRole="alert">
              {error}
            </Txt>
          )}
          {!canSubmit && !isSubmitting && missing ? (
            <Txt variant="caption" color="muted" colors={colors} style={{ textAlign: 'center' }}>
              {missing}
            </Txt>
          ) : null}
          <Button
            label="Confirmar pedido"
            loading={isSubmitting}
            disabled={!canSubmit && !isSubmitting}
            onPress={onSubmit}
            colors={colors}
          />
        </CartSummaryCard>
      </View>
    </View>
  );
}

/** Aviso con icono (advertencia) y texto de 14 px sobre un fondo tenue. */
function Notice({ children, colors }: { children: string; colors: ThemeColors }) {
  return (
    <View
      style={{ flexDirection: 'row', gap: 10, backgroundColor: hexToRgba(colors.warning, 0.12), borderRadius: 12, padding: 14 }}
    >
      <TriangleAlert size={18} color={colors.warning} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Txt variant="label" colors={colors} style={{ fontWeight: '500', lineHeight: 20 }}>
          {children}
        </Txt>
      </View>
    </View>
  );
}

/**
 * Monto del pago. Guarda lo que la persona teclea en un estado local (el original lo reformateaba
 * con `toFixed(2)` en cada tecla, lo que descolocaba el cursor); se reinicia desde el store con un
 * `key` cuando cambia el método o la moneda, que es cuando el monto se recalcula.
 */
export function AmountField({
  amount,
  onChange,
  currency,
  colors,
}: {
  amount: number | null;
  onChange: (value: number | null) => void;
  currency: 'Bs.' | 'USD.';
  colors: ThemeColors;
}) {
  const [text, setText] = useState(amount !== null ? amount.toFixed(2) : '');

  return (
    <TextField
      label={`Monto del pago (${currency})`}
      value={text}
      onChangeText={(next) => {
        setText(next);
        const parsed = Number(next.replace(',', '.'));
        onChange(next.trim() !== '' && Number.isFinite(parsed) ? parsed : null);
      }}
      placeholder="0.00"
      keyboardType="decimal-pad"
      helper="Se calcula solo; puedes editarlo si pagas otro monto."
      colors={colors}
    />
  );
}

function ReferenceField({
  value,
  onChange,
  keyboardType,
  colors,
}: {
  value: string;
  onChange: (value: string) => void;
  keyboardType: 'number-pad' | 'default';
  colors: ThemeColors;
}) {
  const length = value.trim().length;
  return (
    <TextField
      label="Número de referencia (últimos 5-6 dígitos)"
      value={value}
      onChangeText={onChange}
      placeholder="123456"
      keyboardType={keyboardType}
      maxLength={6}
      autoCapitalize="characters"
      error={length > 0 && length < 5 ? 'Escribe entre 5 y 6 caracteres.' : null}
      colors={colors}
    />
  );
}

/** Datos de la cuenta a la que se paga (receptores configurados por el admin). */
export function ReceiversList({ items, colors }: { items: [string, string][][]; colors: ThemeColors }) {
  if (items.length === 0) return null;
  return (
    <View style={{ gap: 8 }}>
      <Txt variant="label" colors={colors}>
        Datos para realizar el pago
      </Txt>
      {items.map((fields, index) => (
        <Surface key={index} colors={colors} tone="section" padding={12} style={{ gap: 6 }}>
          {fields.map(([label, value]) => (
            <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              <Txt variant="label" color="muted" colors={colors} style={{ fontWeight: '500' }}>
                {label}
              </Txt>
              <View style={{ flexShrink: 1 }}>
                <Txt variant="label" colors={colors} selectable style={{ textAlign: 'right' }}>
                  {value}
                </Txt>
              </View>
            </View>
          ))}
        </Surface>
      ))}
    </View>
  );
}

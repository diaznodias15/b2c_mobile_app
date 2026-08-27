import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

import {
  useBranchStore,
  useCartStore,
  useCheckoutStore,
  useConfigStore,
  useUIStore,
} from '@/store';
import { createOrder } from '@/api/services/orders.services';
import { buildOrderPayload } from '@/features/cart/utils/summary';
import { OrderSummary } from '@/features/cart/components/OrderSummary';
import { StepperHeader } from '@/features/cart/components/StepperHeader';

const STEPS_FULL = [
  { id: 'entrega', label: 'Entrega' },
  { id: 'pago', label: 'Pago' },
  { id: 'confirmar', label: 'Confirmar' },
];
const STEPS_LITE = [
  { id: 'entrega', label: 'Entrega' },
  { id: 'confirmar', label: 'Confirmar' },
];

/**
 * Pantalla de revisión final. Muestra el resumen, comentarios,
 * datos de contacto (modo Lite), y dispara POST /api/orders/create.
 *
 * En éxito → /cart/listo con el número de orden.
 * En error → toast con mensaje del backend.
 */
export default function CartConfirmarScreen() {
  const isLite = useConfigStore((s) => String(s.appConfig?.is_lite_mode ?? 0) === '1');
  const showToast = useUIStore((s) => s.showToast);
  const branchId = useBranchStore((s) => s.selectedBranch?.value);
  const allItems = useCartStore((s) => s.items);
  const items = useMemo(
    () => (branchId ? allItems.filter((i) => i.branch_id === branchId) : []),
    [allItems, branchId]
  );
  const clearCart = useCartStore((s) => s.clear);
  const resetCheckout = useCheckoutStore((s) => s.reset);
  const fulfillment = useCheckoutStore((s) => s.fulfillment);
  const deliveryAddress = useCheckoutStore((s) => s.deliveryAddress);
  const paymentMethod = useCheckoutStore((s) => s.paymentMethod);
  const paymentReference = useCheckoutStore((s) => s.paymentReference);
  const comments = useCheckoutStore((s) => s.comments);
  const setComments = useCheckoutStore((s) => s.setComments);
  const contact = useCheckoutStore((s) => s.contact);
  const setContact = useCheckoutStore((s) => s.setContact);

  const [submitting, setSubmitting] = useState(false);
  const [contactName, setContactName] = useState(contact?.tx_name ?? '');
  const [contactPhone, setContactPhone] = useState(contact?.tx_phone ?? '');
  const [contactId, setContactId] = useState(contact?.tx_id_number ?? '');

  const canSubmit = () => {
    if (submitting) return false;
    if (items.length === 0) return false;
    if (!fulfillment) return false;
    if (fulfillment === 'DELIVERY' && !deliveryAddress) return false;
    if (isLite) {
      return contactName.trim().length > 0 && contactPhone.trim().length > 0;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!canSubmit() || !branchId || !fulfillment) return;

    const finalContact = isLite
      ? {
          tx_name: contactName.trim(),
          tx_phone: contactPhone.trim(),
          tx_id_number: contactId.trim() || undefined,
        }
      : undefined;

    let payload;
    try {
      payload = buildOrderPayload({
        branchId,
        items,
        fulfillment,
        deliveryAddress,
        paymentMethod: isLite ? null : paymentMethod,
        paymentReference: isLite ? undefined : paymentReference,
        comments,
        contact: finalContact ?? null,
      });
    } catch (err) {
      showToast({
        title: 'Faltan datos',
        description: err instanceof Error ? err.message : 'Revisá el carrito',
        type: 'error',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await createOrder(payload);
      if (!res.tx_order_number) {
        throw new Error('El backend no devolvió número de orden');
      }
      if (finalContact) setContact(finalContact);
      // Limpiamos cart y checkout ANTES de navegar al éxito.
      clearCart();
      resetCheckout();
      router.replace({
        pathname: '/cart/listo',
        params: { order: res.tx_order_number },
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No pudimos crear la orden';
      showToast({
        title: 'Error al confirmar',
        description: message,
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-4 pt-3 pb-2 flex-row items-center gap-2 border-b border-backgroundElement">
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            className="h-9 w-9 items-center justify-center rounded-full bg-backgroundElement"
            accessibilityLabel="Volver"
          >
            <ArrowLeft size={18} color="#1A1A2E" />
          </Pressable>
          <Text className="text-lg font-bold text-foreground">
            Revisá tu pedido
          </Text>
        </View>

        <StepperHeader
          steps={isLite ? STEPS_LITE : STEPS_FULL}
          current={isLite ? 1 : 2}
        />

        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 120 }}
        >
          {/* Resumen */}
          <View className="bg-backgroundElement rounded-[14px] p-3">
            <Text className="text-sm font-bold text-foreground mb-2">
              Resumen
            </Text>
            <OrderSummary items={items} />
          </View>

          {/* Datos de contacto (solo Lite) */}
          {isLite ? (
            <View className="bg-backgroundElement rounded-[14px] p-3 gap-2">
              <Text className="text-sm font-bold text-foreground">
                Tus datos de contacto
              </Text>
              <TextInput
                value={contactName}
                onChangeText={setContactName}
                placeholder="Nombre completo"
                placeholderTextColor="#60646C"
                className="bg-background rounded-[14px] p-3 text-sm text-foreground"
              />
              <TextInput
                value={contactPhone}
                onChangeText={setContactPhone}
                placeholder="Teléfono (ej. +58414...)"
                placeholderTextColor="#60646C"
                keyboardType="phone-pad"
                className="bg-background rounded-[14px] p-3 text-sm text-foreground"
              />
              <TextInput
                value={contactId}
                onChangeText={setContactId}
                placeholder="Cédula / RIF (opcional)"
                placeholderTextColor="#60646C"
                className="bg-background rounded-[14px] p-3 text-sm text-foreground"
              />
            </View>
          ) : null}

          {/* Comentarios */}
          <View className="gap-2">
            <Text className="text-sm font-bold text-foreground">
              Comentarios (opcional)
            </Text>
            <TextInput
              value={comments}
              onChangeText={setComments}
              placeholder="Indicaciones para la entrega, referencias, etc."
              placeholderTextColor="#60646C"
              multiline
              className="bg-backgroundElement rounded-[14px] p-3 text-sm text-foreground min-h-[80px]"
            />
          </View>
        </ScrollView>

        {/* Footer */}
        <View className="absolute bottom-0 left-0 right-0 bg-background border-t border-backgroundElement px-4 py-3">
          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit()}
            className={`rounded-[14px] py-3 items-center ${
              canSubmit() ? 'bg-primary' : 'bg-backgroundElement'
            }`}
            accessibilityRole="button"
            accessibilityLabel="Confirmar pedido"
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text
                className={
                  canSubmit()
                    ? 'text-sm font-bold text-primary-foreground'
                    : 'text-sm font-bold text-muted'
                }
              >
                Confirmar pedido
              </Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

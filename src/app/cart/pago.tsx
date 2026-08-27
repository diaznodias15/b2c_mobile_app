import { useState } from 'react';
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

import { useCheckoutStore, useUIStore } from '@/store';
import { useQuery } from '@tanstack/react-query';
import { getPaymentMethods } from '@/api/services/payment-methods.services';
import { PaymentMethodCard } from '@/features/cart/components/PaymentMethodCard';
import { StepperHeader } from '@/features/cart/components/StepperHeader';
import type { PaymentMethod } from '@/types/cart';

const STEPS = [
  { id: 'entrega', label: 'Entrega' },
  { id: 'pago', label: 'Pago' },
  { id: 'confirmar', label: 'Confirmar' },
];

/**
 * Pantalla de método de pago (solo modo Full).
 * Si el método requiere referencia, muestra el input.
 */
export default function CartPagoScreen() {
  const paymentMethod = useCheckoutStore((s) => s.paymentMethod);
  const setPaymentMethod = useCheckoutStore((s) => s.setPaymentMethod);
  const paymentReference = useCheckoutStore((s) => s.paymentReference);
  const setPaymentReference = useCheckoutStore((s) => s.setPaymentReference);
  const showToast = useUIStore((s) => s.showToast);

  const { data, isLoading, isError } = useQuery<PaymentMethod[]>({
    queryKey: ['payment-methods'],
    queryFn: ({ signal }) => getPaymentMethods({ signal }),
    staleTime: 5 * 60_000,
  });

  const [refText, setRefText] = useState(paymentReference);

  const selected = paymentMethod;
  const needsRef = Boolean(
    selected?.requires_reference === true || selected?.requires_reference === 1
  );

  const canContinue = () => {
    if (!selected) return false;
    if (needsRef && refText.trim().length === 0) return false;
    return true;
  };

  const handleContinue = () => {
    if (!canContinue()) {
      if (selected && needsRef && refText.trim().length === 0) {
        showToast({
          title: 'Falta la referencia',
          description: `Ingresá el número de ${selected.nb_payment_method}`,
          type: 'error',
        });
      }
      return;
    }
    setPaymentReference(refText.trim());
    router.push('/cart/confirmar');
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
            Método de pago
          </Text>
        </View>

        <StepperHeader steps={STEPS} current={1} />

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#0f766e" />
          </View>
        ) : isError ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-sm text-muted text-center">
              No pudimos cargar los métodos de pago. Probá de nuevo.
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }}
          >
            {(data ?? []).map((m) => (
              <PaymentMethodCard
                key={m.id}
                method={m}
                selected={selected?.id === m.id}
                onSelect={() => setPaymentMethod(m)}
              />
            ))}

            {needsRef ? (
              <View className="mt-3 gap-2">
                <Text className="text-sm font-bold text-foreground">
                  Número de referencia
                </Text>
                <TextInput
                  value={refText}
                  onChangeText={setRefText}
                  placeholder={`Ej: 12345678`}
                  placeholderTextColor="#60646C"
                  className="bg-backgroundElement rounded-[14px] p-3 text-sm text-foreground"
                />
              </View>
            ) : null}
          </ScrollView>
        )}

        <View className="absolute bottom-0 left-0 right-0 bg-background border-t border-backgroundElement px-4 py-3">
          <Pressable
            onPress={handleContinue}
            disabled={!canContinue()}
            className={`rounded-[14px] py-3 items-center ${
              canContinue() ? 'bg-primary' : 'bg-backgroundElement'
            }`}
            accessibilityRole="button"
            accessibilityLabel="Continuar a confirmar"
          >
            <Text
              className={
                canContinue()
                  ? 'text-sm font-bold text-primary-foreground'
                  : 'text-sm font-bold text-muted'
              }
            >
              Continuar
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

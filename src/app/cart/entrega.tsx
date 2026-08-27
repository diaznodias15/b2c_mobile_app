import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, MapPin } from 'lucide-react-native';

import { useConfigStore, useCheckoutStore } from '@/store';
import { FulfillmentCard } from '@/features/cart/components/FulfillmentCard';
import { StepperHeader } from '@/features/cart/components/StepperHeader';
import type { FulfillmentType } from '@/types/cart';

const STEPS = [
  { id: 'entrega', label: 'Entrega' },
  { id: 'pago', label: 'Pago' },
  { id: 'confirmar', label: 'Confirmar' },
];

/**
 * Pantalla de fulfillment. Usuario elige Pickup o Delivery.
 * Si elige Delivery y la app lo permite (appConfig.is_allow_delivery),
 * pide dirección.
 */
export default function CartEntregaScreen() {
  const isLite = useConfigStore((s) => String(s.appConfig?.is_lite_mode ?? 0) === '1');
  const allowDelivery = useConfigStore(
    (s) => String(s.appConfig?.is_allow_delivery ?? 1) === '1'
  );
  const fulfillment = useCheckoutStore((s) => s.fulfillment);
  const setFulfillment = useCheckoutStore((s) => s.setFulfillment);
  const setDeliveryAddress = useCheckoutStore((s) => s.setDeliveryAddress);
  const deliveryAddress = useCheckoutStore((s) => s.deliveryAddress);
  const [addressText, setAddressText] = useState(
    deliveryAddress?.tx_address ?? ''
  );

  const handleSelect = (type: FulfillmentType) => {
    setFulfillment(type);
    if (type === 'PICKUP') setAddressText('');
  };

  const canContinue = () => {
    if (!fulfillment) return false;
    if (fulfillment === 'DELIVERY') return addressText.trim().length > 0;
    return true;
  };

  const handleContinue = () => {
    if (!canContinue() || !fulfillment) return;
    if (fulfillment === 'DELIVERY') {
      setDeliveryAddress({ tx_address: addressText.trim() });
    }
    // Si Lite, saltamos pago.
    if (isLite) {
      router.push('/cart/confirmar');
    } else {
      router.push('/cart/pago');
    }
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
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
            ¿Cómo querés recibirlo?
          </Text>
        </View>

        <StepperHeader steps={STEPS} current={0} />

        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
        >
          <FulfillmentCard
            type="PICKUP"
            selected={fulfillment === 'PICKUP'}
            title="Retiro en tienda"
            description="Pasás a buscar tu pedido por la sede que elegiste."
            onSelect={() => handleSelect('PICKUP')}
          />
          {allowDelivery ? (
            <FulfillmentCard
              type="DELIVERY"
              selected={fulfillment === 'DELIVERY'}
              title="Envío a domicilio"
              description="Te lo llevamos a la dirección que nos indiques."
              onSelect={() => handleSelect('DELIVERY')}
            />
          ) : null}

          {fulfillment === 'DELIVERY' ? (
            <View className="gap-2 mt-2">
              <View className="flex-row items-center gap-1.5">
                <MapPin size={14} color="#0f766e" />
                <Text className="text-sm font-bold text-foreground">
                  Dirección de entrega
                </Text>
              </View>
              <TextInput
                value={addressText}
                onChangeText={setAddressText}
                placeholder="Calle, número, referencia…"
                placeholderTextColor="#60646C"
                multiline
                className="bg-backgroundElement rounded-[14px] p-3 text-sm text-foreground min-h-[80px]"
              />
              <Text className="text-[11px] text-muted">
                En la próxima fase sumamos mapa y autocomplete de direcciones.
              </Text>
            </View>
          ) : null}
        </ScrollView>

        {/* Footer */}
        <View className="absolute bottom-0 left-0 right-0 bg-background border-t border-backgroundElement px-4 py-3">
          <Pressable
            onPress={handleContinue}
            disabled={!canContinue()}
            className={`rounded-[14px] py-3 items-center ${
              canContinue() ? 'bg-primary' : 'bg-backgroundElement'
            }`}
            accessibilityRole="button"
            accessibilityLabel="Continuar al pago"
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

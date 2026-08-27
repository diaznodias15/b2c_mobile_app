import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Check, Copy } from 'lucide-react-native';

import { useUIStore } from '@/store';

/**
 * Pantalla de éxito del checkout. Muestra el número de orden
 * con botón "Copiar" y CTA "Seguir comprando" → /.
 */
export default function CartListoScreen() {
  const params = useLocalSearchParams<{ order?: string }>();
  const order = params.order ?? '';
  const showToast = useUIStore((s) => s.showToast);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!order) return;
    try {
      // Clipboard via expo-clipboard o navigator
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(order);
      }
      setCopied(true);
      showToast({
        title: 'Copiado',
        description: `Número de orden ${order}`,
        type: 'success',
      });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      showToast({
        title: 'No pudimos copiar',
        description: 'Copiá el número manualmente',
        type: 'error',
      });
    }
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-1 items-center justify-center px-8 gap-4">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-success/20">
            <Check size={36} color="#17C964" />
          </View>
          <Text className="text-xl font-bold text-foreground text-center">
            ¡Pedido confirmado!
          </Text>
          <Text className="text-sm text-muted text-center">
            Te enviamos el detalle a tu correo. La farmacia empezará a
            prepararlo en breve.
          </Text>

          {order ? (
            <View className="bg-backgroundElement rounded-[14px] p-4 w-full items-center gap-2">
              <Text className="text-xs text-muted">Número de orden</Text>
              <Text
                className="text-2xl font-bold text-foreground tracking-wider"
                selectable
              >
                {order}
              </Text>
              <Pressable
                onPress={handleCopy}
                className="flex-row items-center gap-1.5 bg-primary rounded-full px-3 py-1.5"
                accessibilityRole="button"
                accessibilityLabel="Copiar número de orden"
              >
                {copied ? (
                  <Check size={14} color="#FFFFFF" />
                ) : (
                  <Copy size={14} color="#FFFFFF" />
                )}
                <Text className="text-xs font-bold text-primary-foreground">
                  {copied ? 'Copiado' : 'Copiar'}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <View className="px-4 pb-2">
          <Pressable
            onPress={() => router.replace('/')}
            className="bg-primary rounded-[14px] py-3 items-center"
            accessibilityRole="button"
            accessibilityLabel="Seguir comprando"
          >
            <Text className="text-sm font-bold text-primary-foreground">
              Seguir comprando
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

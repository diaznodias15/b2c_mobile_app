import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Copy, Check } from 'lucide-react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { AnimatedCheck } from '@/components/AnimatedCheck';
import { useUIStore } from '@/store';

/**
 * Pantalla de éxito del checkout. Animaciones:
 *  1. Check verde con stroke animado (~700ms total)
 *  2. Numero de orden con scale-in + fade-in
 *  3. Boton "Copiar" cambia a check verde 1.5s despues
 */
export default function CartListoScreen() {
  const params = useLocalSearchParams<{ order?: string }>();
  const order = params.order ?? '';
  const showToast = useUIStore((s) => s.showToast);
  const [copied, setCopied] = useState(false);

  const orderScale = useSharedValue(0.95);
  const orderOpacity = useSharedValue(0);
  const ctaOpacity = useSharedValue(0);

  useEffect(() => {
    orderScale.value = withDelay(
      700,
      withTiming(1, {
        duration: 280,
        easing: Easing.out(Easing.cubic),
      })
    );
    orderOpacity.value = withDelay(700, withTiming(1, { duration: 220 }));
    ctaOpacity.value = withDelay(900, withTiming(1, { duration: 220 }));
  }, [orderScale, orderOpacity, ctaOpacity]);

  const orderAnimated = useAnimatedStyle(() => ({
    transform: [{ scale: orderScale.value }],
    opacity: orderOpacity.value,
  }));

  const ctaAnimated = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
  }));

  const handleCopy = async () => {
    if (!order) return;
    try {
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
        <View className="flex-1 items-center justify-center px-8 gap-3">
          <AnimatedCheck size={140} />

          <Text className="text-xl font-bold text-foreground text-center mt-3">
            ¡Pedido confirmado!
          </Text>
          <Text className="text-sm text-muted text-center px-2">
            Empezamos a preparar tu pedido. Te avisamos cuando esté listo
            para retirar o salir a delivery.
          </Text>

          {order ? (
            <Animated.View
              style={orderAnimated}
              className="bg-product-card rounded-[14px] p-4 w-full items-center gap-2 mt-4 border border-border"
            >
              <Text className="text-[10px] text-muted uppercase tracking-widest font-semibold">
                Número de orden
              </Text>
              <Text
                className="text-2xl font-bold text-foreground tracking-wider"
                style={{ fontVariant: ['tabular-nums'] }}
                selectable
              >
                {order}
              </Text>
              <Pressable
                onPress={handleCopy}
                className="flex-row items-center gap-1.5 bg-primary rounded-full px-3 py-1.5 mt-1"
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
            </Animated.View>
          ) : null}
        </View>

        <Animated.View style={ctaAnimated} className="px-4 pb-2">
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
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

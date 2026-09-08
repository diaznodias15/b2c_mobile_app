import { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircleCheck } from 'lucide-react-native';

import { useThemeColors } from '@/store/config.store';
import { useToastStore } from '@/store/toast.store';

const VISIBLE_MS = 1800;
const ANIM_MS = 200;

/**
 * Toast global, montado una sola vez en `Providers.tsx` (por eso no
 * recibe `colors` como prop — así funciona en cualquier pantalla sin
 * que cada una tenga que pasarlo). Guarda el texto en state local
 * (`text`) separado del store: si limpiara `message` de una, la
 * animación de salida no tendría qué mostrar mientras se desvanece.
 */
export function Toast() {
  const colors = useThemeColors();
  const message = useToastStore((s) => s.message);
  const hide = useToastStore((s) => s.hide);
  const insets = useSafeAreaInsets();

  const [text, setText] = useState<string | null>(null);
  const translateY = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) return;

    setText(message);
    translateY.setValue(40);
    opacity.setValue(0);
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: ANIM_MS, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: ANIM_MS, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 40, duration: ANIM_MS, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: ANIM_MS, useNativeDriver: true }),
      ]).start(() => {
        setText(null);
        hide();
      });
    }, VISIBLE_MS);

    return () => clearTimeout(timer);
  }, [message]);

  if (!text) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 20,
        right: 20,
        bottom: insets.bottom + 76,
        opacity,
        transform: [{ translateY }],
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: colors.foreground,
          borderRadius: 12,
          paddingVertical: 12,
          paddingHorizontal: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        }}
      >
        <CircleCheck size={18} color={colors.background} />
        <Text style={{ color: colors.background, fontSize: 14, fontWeight: '600', flexShrink: 1 }}>
          {text}
        </Text>
      </View>
    </Animated.View>
  );
}

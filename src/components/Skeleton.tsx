import { useEffect } from 'react';
import type { DimensionValue, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { isLightColor, type ThemeColors } from '@/theme/colors';

/**
 * Bloque base de skeleton: un rectángulo que pulsa opacidad en loop.
 * Usar como building block para armar skeletons por pantalla/componente
 * (ver `HomeSkeleton` en Providers.tsx, `TopProductsSkeleton`) — no está
 * pensado para usarse suelto salvo casos muy simples.
 *
 * El color base es un gris neutro SÓLIDO (no un token del whitelabel con
 * alpha, como `colors.border`) — si fuera translúcido, animar `opacity`
 * lo dejaría casi invisible sobre fondos claros. Elegimos claro/oscuro
 * por contraste con la superficie real (`colors.section`), igual criterio
 * que el logo de `HomeNavbar`/`Footer`.
 */
export function Skeleton({
  width,
  height,
  borderRadius = 8,
  colors,
  style,
}: {
  width: DimensionValue;
  height: DimensionValue;
  borderRadius?: number;
  colors: ThemeColors;
  style?: ViewStyle;
}) {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const baseColor = isLightColor(colors.section) ? '#E4E4E7' : '#3F3F46';

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseColor,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import type { ThemeColors } from '@/theme/colors';

import { useColors } from './useColors';

/**
 * Superficie plana del rediseño: fondo + borde de 1 px + radio, **sin sombra**
 * (en Android `elevation` varía según el dispositivo). Con `onPress` se vuelve
 * pulsable y atenúa al presionar.
 */
export function Surface({
  tone = 'card',
  radius = 16,
  padding = 12,
  colors,
  onPress,
  accessibilityLabel,
  style,
  children,
}: {
  tone?: 'card' | 'section';
  radius?: number;
  padding?: number;
  colors?: ThemeColors;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  const theme = useColors(colors);
  const base: ViewStyle = {
    backgroundColor: tone === 'card' ? theme.productCard : theme.section,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius,
    padding,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [base, { opacity: pressed ? 0.92 : 1 }, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}

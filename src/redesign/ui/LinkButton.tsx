import { Pressable } from 'react-native';

import type { ThemeColors } from '@/theme/colors';

import { MIN_TOUCH } from './tokens';
import { Txt } from './Txt';

/** Enlace de texto en el color primario con área táctil de 48 dp (para acciones secundarias bajo un botón). */
export function LinkButton({ label, onPress, colors }: { label: string; onPress: () => void; colors?: ThemeColors }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        minHeight: MIN_TOUCH,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Txt variant="label" color="primary" colors={colors}>
        {label}
      </Txt>
    </Pressable>
  );
}

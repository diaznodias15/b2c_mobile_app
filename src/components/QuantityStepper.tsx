import { Pressable, Text, View } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';

import type { ThemeColors } from '@/theme/colors';

/**
 * Stepper +/- de cantidad. Usado en el detalle de producto y en el
 * carrito — mismo control exacto (no solo la misma lógica), a
 * diferencia del caso de `useAddToCartFlight`/`getProductPricing`
 * donde el JSX difería entre call sites.
 */
export function QuantityStepper({
  value,
  max,
  onChange,
  colors,
  disabled = false,
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
  colors: ThemeColors;
  disabled?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: colors.section,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 46,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Pressable
        onPress={() => onChange(Math.max(1, value - 1))}
        disabled={disabled || value <= 1}
        accessibilityRole="button"
        accessibilityLabel="Restar cantidad"
        hitSlop={8}
      >
        <Minus size={16} color={colors.foreground} />
      </Pressable>
      <Text
        style={{
          fontSize: 16,
          fontWeight: '700',
          color: colors.foreground,
          minWidth: 20,
          textAlign: 'center',
        }}
        accessibilityLiveRegion="polite"
      >
        {value}
      </Text>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        accessibilityRole="button"
        accessibilityLabel="Sumar cantidad"
        hitSlop={8}
      >
        <Plus size={16} color={colors.foreground} />
      </Pressable>
    </View>
  );
}

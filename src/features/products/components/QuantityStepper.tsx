import { Pressable, Text, View } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';

type Props = {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
};

/**
 * Stepper -/+ con bounds (default 1-99).
 * El padre controla el valor y se entera via `onChange`.
 */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
}: Props) {
  const dec = () => {
    if (disabled) return;
    if (value > min) onChange(value - 1);
  };
  const inc = () => {
    if (disabled) return;
    if (value < max) onChange(value + 1);
  };

  return (
    <View className="flex-row items-center bg-backgroundElement rounded-full overflow-hidden">
      <Pressable
        onPress={dec}
        disabled={disabled || value <= min}
        className={`h-10 w-10 items-center justify-center ${
          disabled || value <= min ? 'opacity-30' : ''
        }`}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="Disminuir cantidad"
      >
        <Minus size={16} color="#1A1A2E" />
      </Pressable>
      <View className="w-10 items-center">
        <Text className="text-base font-bold text-foreground">{value}</Text>
      </View>
      <Pressable
        onPress={inc}
        disabled={disabled || value >= max}
        className={`h-10 w-10 items-center justify-center ${
          disabled || value >= max ? 'opacity-30' : ''
        }`}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="Aumentar cantidad"
      >
        <Plus size={16} color="#1A1A2E" />
      </Pressable>
    </View>
  );
}

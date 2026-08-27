import { Pressable, Text, View } from 'react-native';
import { Store, Truck, Check } from 'lucide-react-native';

import type { FulfillmentType } from '@/types/cart';

type Props = {
  type: FulfillmentType;
  selected: boolean;
  title: string;
  description: string;
  onSelect: () => void;
};

/**
 * Card seleccionable de método de entrega (Pickup o Delivery).
 * Variante "icon" cambia entre Store y Truck según el type.
 */
export function FulfillmentCard({
  type,
  selected,
  title,
  description,
  onSelect,
}: Props) {
  const Icon = type === 'PICKUP' ? Store : Truck;
  return (
    <Pressable
      onPress={onSelect}
      className={`flex-row items-start gap-3 rounded-[14px] p-4 border ${
        selected
          ? 'bg-primary/5 border-primary'
          : 'bg-backgroundElement border-transparent'
      }`}
      accessibilityRole="button"
      accessibilityLabel={`Seleccionar ${title}`}
    >
      <View
        className={`h-10 w-10 items-center justify-center rounded-full ${
          selected ? 'bg-primary' : 'bg-background'
        }`}
      >
        <Icon size={18} color={selected ? '#FFFFFF' : '#0f766e'} />
      </View>
      <View className="flex-1">
        <Text
          className={
            selected
              ? 'text-sm font-bold text-primary'
              : 'text-sm font-bold text-foreground'
          }
        >
          {title}
        </Text>
        <Text className="text-xs text-muted mt-0.5">{description}</Text>
      </View>
      {selected ? (
        <View className="h-6 w-6 items-center justify-center rounded-full bg-primary">
          <Check size={14} color="#FFFFFF" />
        </View>
      ) : null}
    </Pressable>
  );
}

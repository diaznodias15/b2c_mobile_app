import { Image, Pressable, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';

import type { PaymentMethod } from '@/types/cart';

type Props = {
  method: PaymentMethod;
  selected: boolean;
  onSelect: () => void;
};

/**
 * Card seleccionable de método de pago.
 * Si `requires_reference` es truthy, muestra un hint al usuario
 * de que tendrá que ingresar referencia en el siguiente paso.
 */
export function PaymentMethodCard({ method, selected, onSelect }: Props) {
  const needsRef = Boolean(
    method.requires_reference === true || method.requires_reference === 1
  );

  return (
    <Pressable
      onPress={onSelect}
      className={`flex-row items-center gap-3 rounded-[14px] p-3 border ${
        selected
          ? 'bg-primary/5 border-primary'
          : 'bg-backgroundElement border-transparent'
      }`}
      accessibilityRole="button"
      accessibilityLabel={`Seleccionar ${method.nb_payment_method}`}
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-background overflow-hidden">
        {method.tx_logo_url ? (
          <Image
            source={{ uri: method.tx_logo_url }}
            style={{ width: 28, height: 28 }}
            resizeMode="contain"
          />
        ) : (
          <Text className="text-base font-bold text-primary">
            {method.nb_payment_method.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>
      <View className="flex-1">
        <Text
          className={
            selected
              ? 'text-sm font-bold text-primary'
              : 'text-sm font-bold text-foreground'
          }
        >
          {method.nb_payment_method}
        </Text>
        {needsRef ? (
          <Text className="text-[11px] text-muted">
            Te vamos a pedir el número de referencia
          </Text>
        ) : null}
      </View>
      {selected ? (
        <View className="h-6 w-6 items-center justify-center rounded-full bg-primary">
          <Check size={14} color="#FFFFFF" />
        </View>
      ) : null}
    </Pressable>
  );
}

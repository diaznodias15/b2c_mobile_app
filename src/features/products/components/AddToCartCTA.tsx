import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ShoppingCart, Check } from 'lucide-react-native';

type Props = {
  /** Si true, deshabilita el botón (ej. sin stock). */
  disabled?: boolean;
  /** Si true, no muestra el precio al lado (default true). */
  showPrice?: boolean;
  /** Precio a mostrar (formateado, e.g. "USD 172,67"). */
  priceText?: string;
  /** Etiqueta personalizada (default "Agregar al carrito"). */
  label?: string;
  onPress: () => void | Promise<void>;
};

/**
 * CTA sticky "Agregar al carrito" con feedback visual de "agregado".
 *
 * En Fase 3A solo es visual: el toast/checkmark se muestra al tap,
 * pero el cart real llega en Fase 4 con la integración del endpoint
 * `/api/cart/add-product`.
 */
export function AddToCartCTA({
  disabled,
  showPrice = true,
  priceText,
  label = 'Agregar al carrito',
  onPress,
}: Props) {
  const [justAdded, setJustAdded] = useState(false);

  const handlePress = async () => {
    if (disabled) return;
    try {
      await onPress();
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1500);
    } catch {
      /* silencio — el caller maneja el error */
    }
  };

  return (
    <View className="flex-row items-center gap-3 bg-background border-t border-backgroundElement px-4 py-3">
      {showPrice && priceText ? (
        <View className="flex-1">
          <Text className="text-[10px] text-muted">Precio</Text>
          <Text className="text-base font-bold text-foreground">{priceText}</Text>
        </View>
      ) : (
        <View className="flex-1" />
      )}
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        className={`flex-row items-center gap-2 rounded-[14px] px-5 py-3 ${
          disabled
            ? 'bg-backgroundElement'
            : justAdded
              ? 'bg-success'
              : 'bg-primary'
        }`}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {justAdded ? (
          <>
            <Check size={18} color="#FFFFFF" />
            <Text className="text-sm font-bold text-primary-foreground">
              Agregado
            </Text>
          </>
        ) : (
          <>
            <ShoppingCart size={18} color={disabled ? '#60646C' : '#FFFFFF'} />
            <Text
              className={
                disabled
                  ? 'text-sm font-bold text-muted'
                  : 'text-sm font-bold text-primary-foreground'
              }
            >
              {label}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

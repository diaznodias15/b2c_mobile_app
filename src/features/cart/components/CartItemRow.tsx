import { Image, Pressable, Text, View } from 'react-native';
import { Minus, Plus, Trash2 } from 'lucide-react-native';

import { formatPrice } from '@/utils/currency';
import { QuantityStepper } from '@/features/products/components/QuantityStepper';
import type { CartItem } from '@/types/cart';

type Props = {
  item: CartItem;
  onQtyChange: (qty: number) => void;
  onRemove: () => void;
};

/**
 * Fila del carrito: imagen, nombre, marca, qty stepper, precio,
 * botón eliminar.
 */
export function CartItemRow({ item, onQtyChange, onRemove }: Props) {
  const unitPrice = Number.parseFloat(item.pri_product_final_price) || 0;
  const lineTotal = unitPrice * item.qty;

  return (
    <View className="flex-row gap-3 bg-backgroundElement rounded-[14px] p-3">
      <View className="w-16 h-16 rounded-[10px] bg-white overflow-hidden">
        {item.tx_img_url ? (
          <Image
            source={{ uri: item.tx_img_url }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-[9px] text-muted text-center">Sin{'\n'}imagen</Text>
          </View>
        )}
      </View>
      <View className="flex-1 gap-1">
        <Text className="text-[11px] text-muted" numberOfLines={1}>
          {item.nb_brand}
        </Text>
        <Text
          className="text-sm font-semibold text-foreground"
          numberOfLines={2}
        >
          {item.nb_product}
        </Text>
        <View className="flex-row items-center justify-between mt-1">
          <QuantityStepper value={item.qty} onChange={onQtyChange} />
          <Text className="text-sm font-bold text-foreground">
            {formatPrice(lineTotal, 'USD')}
          </Text>
        </View>
      </View>
      <Pressable
        onPress={onRemove}
        hitSlop={6}
        className="h-8 w-8 items-center justify-center rounded-full bg-background"
        accessibilityLabel="Eliminar del carrito"
      >
        <Trash2 size={14} color="#dc2626" />
      </Pressable>
    </View>
  );
}

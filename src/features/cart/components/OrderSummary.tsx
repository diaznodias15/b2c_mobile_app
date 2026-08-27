import { Text, View } from 'react-native';

import { formatPrice } from '@/utils/currency';
import { buildSummary } from '@/features/cart/utils/summary';
import type { CartItem } from '@/types/cart';

type Props = {
  items: CartItem[];
  /** Si true, oculta el detalle de líneas (default false). */
  compact?: boolean;
};

/**
 * Resumen del pedido: líneas de items (opcional), subtotal,
 * delivery, total.
 */
export function OrderSummary({ items, compact = false }: Props) {
  const s = buildSummary(items);

  return (
    <View className="gap-2">
      {!compact
        ? s.lines > 0
          ? (
            <View className="gap-1">
              {items.map((it) => {
                const unit = Number.parseFloat(it.pri_product_final_price) || 0;
                return (
                  <View
                    key={`${it.tx_slug}-${it.branch_id}`}
                    className="flex-row items-baseline justify-between"
                  >
                    <Text
                      className="text-xs text-foreground flex-1"
                      numberOfLines={1}
                    >
                      {it.qty} × {it.nb_product}
                    </Text>
                    <Text className="text-xs font-medium text-foreground ml-2">
                      {formatPrice(unit * it.qty, 'USD')}
                    </Text>
                  </View>
                );
              })}
              <View className="h-px bg-backgroundElement my-1" />
            </View>
          )
          : null
        : null}

      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-foreground">Subtotal</Text>
        <Text className="text-sm text-foreground">
          {formatPrice(s.subtotal, 'USD')}
        </Text>
      </View>
      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-foreground">Envío</Text>
        <Text className="text-sm text-foreground">
          {s.delivery === 0 ? 'A calcular' : formatPrice(s.delivery, 'USD')}
        </Text>
      </View>
      <View className="h-px bg-backgroundElement" />
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-bold text-foreground">Total</Text>
        <Text className="text-base font-bold text-foreground">
          {formatPrice(s.total, 'USD')}
        </Text>
      </View>
    </View>
  );
}

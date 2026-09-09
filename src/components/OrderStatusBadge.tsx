import { Text, View } from 'react-native';

import { hexToRgba, type ThemeColors } from '@/theme/colors';
import { getOrderStatusConfig } from '@/utils/orderStatus';
import type { OrderStatus } from '@/types/orders';

/** Pill de status de una orden (MY-ORDERS-MODULE.md §10) — usada en `OrderRow`. */
export function OrderStatusBadge({
  status,
  colors,
}: {
  status: OrderStatus;
  colors: ThemeColors;
}) {
  const config = getOrderStatusConfig(status, colors);
  if (!config) return null;

  const Icon = config.icon;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: hexToRgba(config.color, 0.12),
        flexShrink: 0,
      }}
    >
      <Icon size={12} color={config.color} strokeWidth={2.5} />
      <Text
        style={{
          fontSize: 11,
          fontWeight: '700',
          color: config.color,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
        }}
      >
        {config.label}
      </Text>
    </View>
  );
}

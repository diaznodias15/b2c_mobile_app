import { View } from 'react-native';

import { hexToRgba, type ThemeColors } from '@/theme/colors';
import type { OrderStatus } from '@/types/orders';
import { getOrderStatusConfig } from '@/utils/orderStatus';

import { Txt } from '../ui/Txt';

/**
 * Pastilla de estado de una orden. **Mismo contrato que `@/components/OrderStatusBadge`**
 * (`status`, `colors`). El estado se dice con icono + texto (nunca solo con color).
 *
 * Qué cambia: texto de 12 px en minúsculas con mayúscula inicial ("En revisión") en vez de
 * 11 px en versalitas con interletraje, que es más difícil de leer; icono de 14 px.
 */
export function OrderStatusBadge({ status, colors }: { status: OrderStatus; colors: ThemeColors }) {
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
      accessible
      accessibilityLabel={`Estado: ${config.label}`}
    >
      <Icon size={14} color={config.color} strokeWidth={2.5} />
      <Txt variant="caption" colors={colors} style={{ color: config.color, fontWeight: '700' }}>
        {config.label}
      </Txt>
    </View>
  );
}

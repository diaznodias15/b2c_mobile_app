import { Pressable, Text, View } from 'react-native';
import { ChevronRight, FileText } from 'lucide-react-native';

import { OrderStatusBadge } from '@/components/OrderStatusBadge';
import { hexToRgba, type ThemeColors } from '@/theme/colors';
import { formatPrice } from '@/utils/currency';
import { formatOrderListDate } from '@/utils/orderStatus';
import type { Order } from '@/types/orders';

/**
 * Fila de una orden en la lista (MY-ORDERS-MODULE.md §9). La web tiene
 * 2 layouts (desktop 7-col / mobile 2-filas) — acá solo se porta el
 * mobile: icono + id/badge/fecha arriba, sub-grid de 4 datos abajo.
 */
export function OrderRow({
  order,
  index,
  onPress,
  colors,
}: {
  order: Order;
  /** Para el fondo striped — filas pares/impares alternan tinte. */
  index: number;
  onPress: (txOrderNumber: string) => void;
  colors: ThemeColors;
}) {
  const total = Number(order.qty_total_amount);
  const items = Number(order.qty_items);
  const units = Number(order.qty_units);

  return (
    <Pressable
      onPress={() => onPress(order.tx_order_number)}
      style={{
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: index % 2 === 1 ? colors.background : colors.section,
      }}
      accessibilityRole="button"
      accessibilityLabel={`Orden ${order.tx_order_number}`}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: hexToRgba(colors.primary, 0.1),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FileText size={18} color={colors.primary} />
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text
              style={{ fontSize: 13, fontWeight: '600', color: colors.foreground, flexShrink: 1 }}
              numberOfLines={1}
            >
              #{order.tx_order_number}
            </Text>
            <OrderStatusBadge status={order.tx_status} colors={colors} />
          </View>
          {order.dt_created_at && (
            <Text style={{ fontSize: 11, color: colors.muted, marginTop: 3 }}>
              {formatOrderListDate(order.dt_created_at)}
            </Text>
          )}
        </View>

        <ChevronRight size={18} color={colors.muted} />
      </View>

      <View
        style={{
          flexDirection: 'row',
          gap: 8,
          marginTop: 10,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <OrderCol label="Sede" value={order.tx_branch_alias || '—'} colors={colors} />
        <OrderCol label="Productos" value={String(items || 0)} colors={colors} />
        <OrderCol label="Unidades" value={String(units || 0)} colors={colors} />
        <OrderCol label="Total" value={formatPrice(total, 'Bs.')} colors={colors} mono />
      </View>
    </Pressable>
  );
}

function OrderCol({
  label,
  value,
  colors,
  mono = false,
}: {
  label: string;
  value: string;
  colors: ThemeColors;
  mono?: boolean;
}) {
  return (
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text
        style={{
          fontSize: 10,
          fontWeight: '600',
          color: colors.muted,
          textTransform: 'uppercase',
          letterSpacing: 0.3,
          marginBottom: 2,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text
        style={{ fontSize: mono ? 12 : 13, fontWeight: '600', color: colors.foreground }}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

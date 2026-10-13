import { View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { Skeleton } from '@/components/Skeleton';
import type { ThemeColors } from '@/theme/colors';
import type { Order } from '@/types/orders';
import { formatPrice } from '@/utils/currency';
import { formatOrderListDate } from '@/utils/orderStatus';

import { Surface } from '../ui/Surface';
import { Txt } from '../ui/Txt';
import { OrderStatusBadge } from './OrderStatusBadge';

/**
 * Tarjeta de una orden en la lista. Misma información que `@/components/OrderRow`, con otra
 * jerarquía: **número de orden y estado arriba, fecha debajo, total grande a la derecha** y
 * una línea resumen ("2 productos · 4 unidades · Sede").
 *
 * Qué cambia: cada orden es su propia tarjeta (el original era una tabla con filas
 * rayadas), sin etiquetas de 10 px, con el total como dato principal y toda la tarjeta como
 * objetivo táctil. Ya no recibe `index` (no hay fondo alterno).
 */
export function OrderRow({
  order,
  onPress,
  colors,
}: {
  order: Order;
  onPress: (txOrderNumber: string) => void;
  colors: ThemeColors;
}) {
  const total = Number(order.qty_total_amount);
  const items = Number(order.qty_items) || 0;
  const units = Number(order.qty_units) || 0;
  const summary = [
    `${items} ${items === 1 ? 'producto' : 'productos'}`,
    `${units} ${units === 1 ? 'unidad' : 'unidades'}`,
    order.tx_branch_alias || null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Surface
      colors={colors}
      padding={14}
      onPress={() => onPress(order.tx_order_number)}
      accessibilityLabel={`Orden ${order.tx_order_number}, ${formatPrice(total, 'Bs.')}`}
      style={{ gap: 10 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Txt variant="label" colors={colors} numberOfLines={1} style={{ fontWeight: '800' }}>
            #{order.tx_order_number}
          </Txt>
          {order.dt_created_at ? (
            <Txt variant="caption" color="muted" colors={colors}>
              {formatOrderListDate(order.dt_created_at)}
            </Txt>
          ) : null}
        </View>
        <OrderStatusBadge status={order.tx_status} colors={colors} />
      </View>

      <View style={{ height: 1, backgroundColor: colors.border }} />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Txt variant="caption" color="muted" colors={colors} numberOfLines={2}>
            {summary}
          </Txt>
        </View>
        <Txt variant="priceSm" colors={colors}>
          {formatPrice(total, 'Bs.')}
        </Txt>
        <ChevronRight size={18} color={colors.muted} />
      </View>
    </Surface>
  );
}

/** Skeleton con las medidas de `OrderRow`. **Mismo contrato que el original** (`colors`). */
export function OrderRowSkeleton({ colors }: { colors: ThemeColors }) {
  return (
    <Surface colors={colors} padding={14} style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Skeleton width="50%" height={14} colors={colors} />
          <Skeleton width="28%" height={10} colors={colors} />
        </View>
        <Skeleton width={96} height={24} borderRadius={12} colors={colors} />
      </View>
      <View style={{ height: 1, backgroundColor: colors.border }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Skeleton width="65%" height={10} colors={colors} />
        </View>
        <Skeleton width={84} height={16} colors={colors} />
      </View>
    </Surface>
  );
}

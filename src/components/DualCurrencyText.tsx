import { Text, View } from 'react-native';

import { convertPrice, formatPrice } from '@/utils/currency';
import type { ThemeColors } from '@/theme/colors';

/**
 * Monto en Bs. + su equivalente REF lado a lado (MY-ORDERS-MODULE.md
 * §20). A diferencia de `formatDisplayPrice` (que muestra UNA moneda
 * según la preferencia del usuario), acá siempre se muestran las dos —
 * es el comportamiento documentado para el detalle de orden. Usa la
 * tasa de cambio DE LA ORDEN (`amtExchangeRate`), no la tasa live del
 * config — una orden vieja debe mostrar la tasa vigente cuando se
 * compró, no la de hoy.
 */
export function DualCurrencyText({
  value,
  amtExchangeRate,
  colors,
  size = 13,
  altColor,
}: {
  value: number;
  amtExchangeRate: number;
  colors: ThemeColors;
  size?: number;
  /** Color del monto alterno (REF) — success por defecto (igual que la web, que usa verde). */
  altColor?: string;
}) {
  const alt =
    amtExchangeRate > 0 ? convertPrice(value, 'Bs.', 'USD', amtExchangeRate) : 0;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
      <Text style={{ fontSize: size, fontWeight: '600', color: colors.foreground }}>
        {formatPrice(value, 'Bs.')}
      </Text>
      <Text style={{ fontSize: size, color: colors.muted }}>-</Text>
      <Text style={{ fontSize: size, fontWeight: '600', color: altColor ?? colors.success }}>
        {formatPrice(alt, 'REF')}
      </Text>
    </View>
  );
}

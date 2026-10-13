import { View } from 'react-native';

import type { ThemeColors } from '@/theme/colors';
import { convertPrice, formatPrice } from '@/utils/currency';

import { Txt } from '../ui/Txt';

/**
 * Monto en Bs. + su equivalente REF lado a lado (siempre las dos monedas, es el
 * comportamiento documentado para el detalle de orden). **Mismo contrato que
 * `@/components/DualCurrencyText`** (`value`, `amtExchangeRate`, `colors`, `size`, `altColor`).
 * Usa la tasa DE LA ORDEN, no la tasa live: una orden vieja debe mostrar la tasa vigente
 * cuando se compró.
 *
 * Qué cambia: `size` por defecto 14 (era 13) y el REF en negrita con una "/" tenue como
 * separador en vez del guion, que se leía como signo menos.
 */
export function DualCurrencyText({
  value,
  amtExchangeRate,
  colors,
  size = 14,
  altColor,
}: {
  value: number;
  amtExchangeRate: number;
  colors: ThemeColors;
  size?: number;
  /** Color del monto alterno (REF) — `success` por defecto (igual que la web). */
  altColor?: string;
}) {
  const alt = amtExchangeRate > 0 ? convertPrice(value, 'Bs.', 'USD', amtExchangeRate) : 0;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <Txt variant="label" colors={colors} style={{ fontSize: size, fontWeight: '700' }}>
        {formatPrice(value, 'Bs.')}
      </Txt>
      <Txt variant="label" color="muted" colors={colors} style={{ fontSize: size }}>
        /
      </Txt>
      <Txt variant="label" colors={colors} style={{ fontSize: size, fontWeight: '700', color: altColor ?? colors.success }}>
        {formatPrice(alt, 'REF')}
      </Txt>
    </View>
  );
}

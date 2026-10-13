import { View } from 'react-native';
import { Timer } from 'lucide-react-native';

import { hexToRgba, type ThemeColors } from '@/theme/colors';
import { formatMmSs, getTimerProgress, isTimerWarning } from '@/utils/cartTimer';

import { Txt } from '../ui/Txt';

/**
 * Cuenta regresiva de reserva del rediseño. **Mismo contrato que `@/components/CartTimer`**
 * (`remainingSeconds`, `totalSeconds`, `colors`, `variant`). Pasa a color de peligro con 60 s
 * o menos (ver `utils/cartTimer.ts`).
 *
 * Qué cambia: textos de 14 px (eran 12) y la barra queda en una sola fila compacta: es un
 * aviso, no debe competir con el CTA de pago. El tiempo restante se anuncia al lector de
 * pantalla con `accessibilityRole="timer"`, como antes.
 */
export function CartTimer({
  remainingSeconds,
  totalSeconds,
  colors,
  variant = 'bar',
}: {
  remainingSeconds: number;
  totalSeconds: number;
  colors: ThemeColors;
  variant?: 'bar' | 'pill';
}) {
  const accent = isTimerWarning(remainingSeconds) ? colors.danger : colors.primary;
  const time = formatMmSs(remainingSeconds);

  if (variant === 'pill') {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: 999,
          backgroundColor: hexToRgba(accent, 0.12),
        }}
        accessibilityRole="timer"
        accessibilityLabel={`Tiempo disponible para completar la compra: ${time}`}
      >
        <Timer size={14} color={accent} />
        <Txt variant="caption" colors={colors} style={{ color: accent, fontWeight: '700' }}>
          {time}
        </Txt>
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: hexToRgba(accent, 0.1),
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        gap: 8,
      }}
      accessibilityRole="timer"
      accessibilityLabel={`Tiempo disponible para completar la transacción: ${time}`}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Timer size={18} color={accent} />
        <View style={{ flex: 1 }}>
          <Txt variant="caption" colors={colors} style={{ fontWeight: '500' }}>
            Tiempo para completar la compra
          </Txt>
        </View>
        <Txt variant="label" colors={colors} style={{ color: accent, fontWeight: '800', fontSize: 16 }}>
          {time}
        </Txt>
      </View>
      <View style={{ height: 4, borderRadius: 2, backgroundColor: hexToRgba(accent, 0.18), overflow: 'hidden' }}>
        <View
          style={{
            height: '100%',
            width: `${Math.round(getTimerProgress(remainingSeconds, totalSeconds) * 100)}%`,
            backgroundColor: accent,
          }}
        />
      </View>
    </View>
  );
}

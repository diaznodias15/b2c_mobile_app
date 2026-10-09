import { Text, View } from 'react-native';
import { Timer } from 'lucide-react-native';

import { formatMmSs, getTimerProgress, isTimerWarning } from '@/utils/cartTimer';
import { hexToRgba, type ThemeColors } from '@/theme/colors';

/**
 * Cuenta regresiva de reserva (ver `utils/cartTimer.ts`). Pasa a color de
 * peligro cuando quedan 60 s o menos.
 *  - `bar`: barra completa con texto y progreso, para la pantalla del carrito.
 *  - `pill`: solo ícono + mm:ss, para flotar en la esquina del checkout sin
 *    tocar el layout de cada paso.
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
          paddingVertical: 5,
          paddingHorizontal: 10,
          borderRadius: 999,
          backgroundColor: hexToRgba(accent, 0.12),
        }}
        accessibilityRole="timer"
        accessibilityLabel={`Tiempo disponible para completar la compra: ${time}`}
      >
        <Timer size={13} color={accent} />
        <Text style={{ fontSize: 12, fontWeight: '700', color: accent }}>{time}</Text>
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
        <Timer size={16} color={accent} />
        <Text style={{ flex: 1, fontSize: 12, color: colors.foreground }}>
          Tiempo disponible para completar la transacción
        </Text>
        <Text style={{ fontSize: 15, fontWeight: '700', color: accent }}>{time}</Text>
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

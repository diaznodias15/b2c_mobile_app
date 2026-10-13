import { View } from 'react-native';

import type { ThemeColors } from '@/theme/colors';
import type { StockLevel } from '@/types/whitelabel';
import { STOCK_META } from '@/utils/stock';

import { Txt } from './Txt';
import { useColors } from './useColors';

/**
 * Estado de disponibilidad: punto de color + texto. El estado nunca depende solo del
 * color (el texto lo dice) y el texto va en `muted`/`foreground`, no en el color de
 * estado, porque el amarillo de `warning` no alcanza contraste sobre blanco.
 */
export function StockPill({
  level,
  colors,
}: {
  level: StockLevel;
  colors?: ThemeColors;
}) {
  const theme = useColors(colors);
  const meta = STOCK_META[level];

  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
      accessible
      accessibilityLabel={`Disponibilidad: ${meta.label}`}
    >
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: theme[meta.colorKey],
        }}
      />
      <Txt variant="caption" color={level === 0 ? 'foreground' : 'muted'} colors={theme} numberOfLines={1}>
        {meta.label}
      </Txt>
    </View>
  );
}

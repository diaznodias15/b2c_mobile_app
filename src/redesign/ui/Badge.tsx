import { View } from 'react-native';

import type { ThemeColors } from '@/theme/colors';

import { Txt } from './Txt';
import { useColors } from './useColors';

/** Pastilla corta ("-15%", "Nuevo"). 12 px como mínimo y texto blanco sobre el color de estado. */
export function Badge({
  label,
  tone = 'danger',
  colors,
}: {
  label: string;
  tone?: 'danger' | 'success' | 'primary';
  colors?: ThemeColors;
}) {
  const theme = useColors(colors);
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: theme[tone],
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
      }}
    >
      <Txt variant="caption" colors={theme} style={{ fontWeight: '700', color: '#FFFFFF' }}>
        {label}
      </Txt>
    </View>
  );
}

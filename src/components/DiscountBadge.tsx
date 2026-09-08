import { Text, View } from 'react-native';

import type { ThemeColors } from '@/theme/colors';

const SIZES = {
  sm: { fontSize: 10, paddingHorizontal: 6, paddingVertical: 2, radius: 6 },
  lg: { fontSize: 13, paddingHorizontal: 10, paddingVertical: 4, radius: 8 },
} as const;

/**
 * Pill "-N% de descuento" — la misma `View`/`Text` se repetía con
 * tamaños ligeramente distintos (10/13px) en ProductCard, ProductListItem
 * y product/[slug].tsx. `size` cubre esos dos casos; `suffix` es lo único
 * que cambiaba en el texto ("%" en las cards, "% de descuento" en el
 * detalle).
 */
export function DiscountBadge({
  percent,
  colors,
  size = 'sm',
  suffix = '%',
}: {
  percent: number | string;
  colors: ThemeColors;
  size?: 'sm' | 'lg';
  suffix?: string;
}) {
  const { fontSize, paddingHorizontal, paddingVertical, radius } = SIZES[size];

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: colors.danger,
        borderRadius: radius,
        paddingHorizontal,
        paddingVertical,
      }}
    >
      <Text style={{ fontSize, fontWeight: '700', color: '#FFFFFF' }}>
        -{percent}
        {suffix}
      </Text>
    </View>
  );
}

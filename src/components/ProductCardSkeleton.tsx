import { View } from 'react-native';

import { PRODUCT_CARD_WIDTH } from '@/components/ProductCard';
import { Skeleton } from '@/components/Skeleton';
import type { ThemeColors } from '@/theme/colors';

/**
 * Mismas medidas/espaciado que `ProductCard` — así el reemplazo skeleton
 * → card real no "salta" el layout de la fila de `TopProducts`.
 */
export function ProductCardSkeleton({ colors }: { colors: ThemeColors }) {
  return (
    <View
      style={{
        width: PRODUCT_CARD_WIDTH,
        backgroundColor: colors.productCard,
        borderRadius: 16,
        padding: 10,
      }}
    >
      <Skeleton
        width="100%"
        height={PRODUCT_CARD_WIDTH - 20}
        borderRadius={12}
        colors={colors}
        style={{ marginBottom: 8 }}
      />
      <Skeleton width="60%" height={10} colors={colors} style={{ marginBottom: 6 }} />
      <Skeleton width="90%" height={12} colors={colors} style={{ marginBottom: 4 }} />
      <Skeleton width="70%" height={12} colors={colors} style={{ marginBottom: 8 }} />
      <Skeleton width="50%" height={14} colors={colors} />
    </View>
  );
}

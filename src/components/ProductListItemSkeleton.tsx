import { View } from 'react-native';

import { PRODUCT_LIST_ITEM_IMAGE_SIZE } from '@/components/ProductListItem';
import { Skeleton } from '@/components/Skeleton';
import type { ThemeColors } from '@/theme/colors';

/** Mismas medidas/espaciado que `ProductListItem`. */
export function ProductListItemSkeleton({ colors }: { colors: ThemeColors }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: colors.productCard,
        borderRadius: 14,
        padding: 10,
      }}
    >
      <Skeleton
        width={PRODUCT_LIST_ITEM_IMAGE_SIZE}
        height={PRODUCT_LIST_ITEM_IMAGE_SIZE}
        borderRadius={10}
        colors={colors}
      />
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton width="40%" height={10} colors={colors} />
        <Skeleton width="90%" height={13} colors={colors} />
        <Skeleton width="60%" height={13} colors={colors} />
        <Skeleton width="35%" height={14} colors={colors} style={{ marginTop: 2 }} />
      </View>
      <Skeleton width={32} height={32} borderRadius={16} colors={colors} />
    </View>
  );
}

import { View } from 'react-native';

import { Skeleton } from '@/components/Skeleton';
import type { ThemeColors } from '@/theme/colors';

import { PRODUCT_LIST_ITEM_IMAGE_SIZE } from './ProductListItem';

/**
 * Skeleton de `ProductListItem` v2. Supone un nombre de 2 líneas (el caso común en este
 * catálogo) y la fila de precio + botón de 48. **Mismo contrato que el original.**
 */
export function ProductListItemSkeleton({ colors }: { colors: ThemeColors }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: colors.productCard,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 12,
      }}
    >
      <Skeleton
        width={PRODUCT_LIST_ITEM_IMAGE_SIZE}
        height={PRODUCT_LIST_ITEM_IMAGE_SIZE}
        borderRadius={12}
        colors={colors}
      />
      <View style={{ flex: 1 }}>
        <View style={{ height: 16, justifyContent: 'center' }}>
          <Skeleton width="40%" height={10} colors={colors} />
        </View>
        <View style={{ marginTop: 2, gap: 6, paddingTop: 4, height: 40 }}>
          <Skeleton width="90%" height={12} colors={colors} />
          <Skeleton width="60%" height={12} colors={colors} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 6, minHeight: 48 }}>
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <Skeleton width="50%" height={16} colors={colors} />
          </View>
          <Skeleton width={48} height={48} borderRadius={24} colors={colors} />
        </View>
      </View>
    </View>
  );
}

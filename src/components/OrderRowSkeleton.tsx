import { View } from 'react-native';

import { Skeleton } from '@/components/Skeleton';
import type { ThemeColors } from '@/theme/colors';

/** Replica el layout de `OrderRow` (MY-ORDERS-MODULE.md §11). */
export function OrderRowSkeleton({ colors }: { colors: ThemeColors }) {
  return (
    <View
      style={{
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Skeleton width={40} height={40} borderRadius={10} colors={colors} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton width="70%" height={14} colors={colors} />
          <Skeleton width="35%" height={10} colors={colors} />
        </View>
      </View>
      <View
        style={{
          flexDirection: 'row',
          gap: 8,
          marginTop: 10,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ flex: 1, gap: 4 }}>
            <Skeleton width="60%" height={10} colors={colors} />
            <Skeleton width="80%" height={13} colors={colors} />
          </View>
        ))}
      </View>
    </View>
  );
}

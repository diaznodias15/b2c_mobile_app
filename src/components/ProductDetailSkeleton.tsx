import { Dimensions, View } from 'react-native';

import { Skeleton } from '@/components/Skeleton';
import type { ThemeColors } from '@/theme/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;
const IMAGE_HEIGHT = SCREEN_WIDTH;

/** Skeleton de carga inicial (mientras `isLoading`, no en re-fetches por cambio de sede). */
export function ProductDetailSkeleton({ colors }: { colors: ThemeColors }) {
  return (
    <View style={{ paddingBottom: 24 }}>
      <Skeleton width="100%" height={IMAGE_HEIGHT} borderRadius={0} colors={colors} />

      <View style={{ paddingHorizontal: 24, marginTop: 20, gap: 10 }}>
        <Skeleton width="35%" height={14} colors={colors} />
        <Skeleton width="80%" height={22} colors={colors} />
        <Skeleton width="60%" height={14} colors={colors} />

        <View style={{ marginTop: 12 }}>
          <Skeleton width="50%" height={16} colors={colors} />
        </View>

        <View style={{ marginTop: 8, gap: 6 }}>
          <Skeleton width="45%" height={26} colors={colors} />
        </View>

        <View style={{ marginTop: 16, flexDirection: 'row', gap: 12 }}>
          <Skeleton width={110} height={44} borderRadius={12} colors={colors} />
          <Skeleton width="100%" height={44} borderRadius={12} colors={colors} style={{ flex: 1 }} />
        </View>
      </View>
    </View>
  );
}

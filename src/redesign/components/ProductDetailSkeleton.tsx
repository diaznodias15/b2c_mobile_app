import { Dimensions, View } from 'react-native';

import { Skeleton } from '@/components/Skeleton';
import type { ThemeColors } from '@/theme/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;

/** Alto de la galería del detalle v2 (algo menos que cuadrada para ver el precio sin hacer scroll). */
export const PRODUCT_DETAIL_IMAGE_HEIGHT = Math.round(SCREEN_WIDTH * 0.9);

/**
 * Skeleton del detalle v2: galería, bloque de título y tarjeta de precio, con las
 * mismas medidas que la pantalla real. **Mismo contrato que el original.**
 */
export function ProductDetailSkeleton({ colors }: { colors: ThemeColors }) {
  return (
    <View style={{ paddingBottom: 24 }}>
      <Skeleton width="100%" height={PRODUCT_DETAIL_IMAGE_HEIGHT} borderRadius={0} colors={colors} />

      <View style={{ paddingHorizontal: 16, marginTop: 16, gap: 10 }}>
        <Skeleton width="30%" height={12} colors={colors} />
        <Skeleton width="85%" height={22} colors={colors} />
        <Skeleton width="60%" height={22} colors={colors} />

        <View
          style={{
            marginTop: 8,
            padding: 16,
            gap: 10,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.productCard,
          }}
        >
          <Skeleton width="55%" height={28} colors={colors} />
          <Skeleton width="35%" height={12} colors={colors} />
          <Skeleton width="30%" height={14} colors={colors} />
        </View>
      </View>
    </View>
  );
}

import { View } from 'react-native';

import { Skeleton } from '@/components/Skeleton';
import type { ThemeColors } from '@/theme/colors';

import { PRODUCT_CARD_WIDTH } from './ProductCard';

/**
 * Skeleton de `ProductCard` v2, con las mismas medidas verticales (imagen cuadrada,
 * marca, 2 líneas de nombre, bloque de precio de 40, stock y CTA de 48) para que el
 * reemplazo skeleton → card real no "salte". **Mismo contrato que el original.**
 */
export function ProductCardSkeleton({ colors }: { colors: ThemeColors }) {
  return (
    <View
      style={{
        width: PRODUCT_CARD_WIDTH,
        backgroundColor: colors.productCard,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 12,
      }}
    >
      <Skeleton
        width="100%"
        height={PRODUCT_CARD_WIDTH - 2 - 24}
        borderRadius={12}
        colors={colors}
        style={{ marginBottom: 10 }}
      />
      {/* marca: línea de 16 */}
      <View style={{ height: 16, justifyContent: 'center' }}>
        <Skeleton width="45%" height={10} colors={colors} />
      </View>
      {/* nombre: 2 líneas (minHeight 40) + márgenes 2/6 */}
      <View style={{ minHeight: 40, marginTop: 2, marginBottom: 6, gap: 6, paddingTop: 4 }}>
        <Skeleton width="90%" height={12} colors={colors} />
        <Skeleton width="65%" height={12} colors={colors} />
      </View>
      {/* precio: bloque de 40 alineado abajo */}
      <View style={{ height: 40, justifyContent: 'flex-end' }}>
        <Skeleton width="55%" height={18} colors={colors} />
      </View>
      {/* stock: 16 + márgenes 6/10 */}
      <View style={{ height: 16, marginTop: 6, marginBottom: 10, justifyContent: 'center' }}>
        <Skeleton width="40%" height={10} colors={colors} />
      </View>
      <Skeleton width="100%" height={48} borderRadius={12} colors={colors} />
    </View>
  );
}

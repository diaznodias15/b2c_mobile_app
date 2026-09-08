import { useEffect, useState } from 'react';
import { Dimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { Building2 } from 'lucide-react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { SectionHeader } from '@/components/SectionHeader';
import { useBrandsStore } from '@/store/brands.store';
import type { ThemeColors } from '@/theme/colors';
import type { Brand } from '@/types/whitelabel';

const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_WIDTH = 100;
const ITEM_HEIGHT = 64;
const ITEM_GAP = 14;
const ITEM_STRIDE = ITEM_WIDTH + ITEM_GAP;
/** px/seg — mientras más grande, más rápido desliza. */
const SPEED = 40;

export function BrandsMarquee({ colors }: { colors: ThemeColors }) {
  const brands = useBrandsStore((s) => s.brands);
  if (brands.length === 0) return null;

  const mid = Math.ceil(brands.length / 2);
  const rowTop = brands;
  // Segunda fila arranca desde la mitad de la lista — visualmente no se ve
  // como una copia idéntica de la primera (igual que la referencia).
  const rowBottom = [...brands.slice(mid), ...brands.slice(0, mid)];

  return (
    <View style={{ marginTop: 24 }}>
      <View style={{ paddingHorizontal: 24 }}>
        <SectionHeader
          title="Marcas con las que trabajamos"
          subtitle="Encuentra tus marcas favoritas en un solo lugar."
          colors={colors}
        />
      </View>

      <View style={{ gap: 12 }}>
        <MarqueeRow brands={rowTop} colors={colors} direction="left" />
        <MarqueeRow brands={rowBottom} colors={colors} direction="right" />
      </View>
    </View>
  );
}

function MarqueeRow({
  brands,
  colors,
  direction,
}: {
  brands: Brand[];
  colors: ThemeColors;
  direction: 'left' | 'right';
}) {
  const translateX = useSharedValue(0);
  const setWidth = brands.length * ITEM_STRIDE;
  // Duplicamos la fila una vez: mientras se anima exactamente el ancho de
  // un set completo, el segundo set queda pegado justo donde termina el
  // primero → el loop es indistinguible al ojo.
  const looped = [...brands, ...brands];

  useEffect(() => {
    if (setWidth === 0) return;
    const from = direction === 'left' ? 0 : -setWidth;
    const to = direction === 'left' ? -setWidth : 0;
    translateX.value = from;
    translateX.value = withRepeat(
      withTiming(to, { duration: (setWidth / SPEED) * 1000, easing: Easing.linear }),
      -1,
      false
    );
  }, [setWidth, direction, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={{ height: ITEM_HEIGHT, overflow: 'hidden', width: SCREEN_WIDTH }}>
      <Animated.View style={[{ flexDirection: 'row', gap: ITEM_GAP }, animatedStyle]}>
        {looped.map((brand, index) => (
          <BrandLogo key={`${brand.nb_brand}-${index}`} brand={brand} colors={colors} />
        ))}
      </Animated.View>
    </View>
  );
}

function BrandLogo({ brand, colors }: { brand: Brand; colors: ThemeColors }) {
  const [failed, setFailed] = useState(false);
  const showFallback = !brand.tx_img_url || failed;

  return (
    <View
      style={{
        width: ITEM_WIDTH,
        height: ITEM_HEIGHT,
        borderRadius: 12,
        backgroundColor: colors.section,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
      }}
    >
      {showFallback ? (
        <Building2 size={22} color={colors.muted} strokeWidth={1.6} />
      ) : (
        <Image
          source={{ uri: brand.tx_img_url }}
          style={{ width: '100%', height: '100%' }}
          contentFit="contain"
          onError={() => setFailed(true)}
        />
      )}
    </View>
  );
}

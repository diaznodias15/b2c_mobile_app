import { useEffect, useState } from 'react';
import { Dimensions, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { Building2 } from 'lucide-react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { Skeleton } from '@/components/Skeleton';
import { useBrandsStore } from '@/store/brands.store';
import type { ThemeColors } from '@/theme/colors';
import type { Brand } from '@/types/whitelabel';

import { Surface } from '../ui/Surface';
import { useReduceMotion } from '../ui/useReduceMotion';
import { SectionHeader } from './SectionHeader';

const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_WIDTH = 100;
const ITEM_HEIGHT = 64;
const ITEM_GAP = 14;
const ITEM_STRIDE = ITEM_WIDTH + ITEM_GAP;
/** px/seg — mientras más grande, más rápido desliza. */
const SPEED = 40;

/**
 * "Marcas con las que trabajamos". **Mismo contrato que `@/components/BrandsMarquee`**
 * (`colors`).
 *
 * Qué cambia: respeta "reducir movimiento" del sistema. Con la preferencia activa no hay
 * animación: se muestra una sola fila que se desliza con el dedo. Sin ella, el marquee de dos
 * filas es el de siempre. En ambos casos cada logo lleva el nombre de la marca como etiqueta
 * accesible (antes los logos eran imágenes mudas para el lector de pantalla), y el marquee
 * animado se marca como decorativo para que el lector no recorra la lista dos veces.
 */
export function BrandsMarquee({ colors }: { colors: ThemeColors }) {
  const brands = useBrandsStore((s) => s.brands);
  const reduceMotion = useReduceMotion();
  if (brands.length === 0) return null;

  const mid = Math.ceil(brands.length / 2);
  // Segunda fila arranca desde la mitad de la lista — visualmente no es una copia de la primera.
  const rowBottom = [...brands.slice(mid), ...brands.slice(0, mid)];

  return (
    <View style={{ marginTop: 28 }}>
      <View style={{ paddingHorizontal: 16 }}>
        <SectionHeader
          title="Marcas con las que trabajamos"
          subtitle="Encuentra tus marcas favoritas en un solo lugar."
          colors={colors}
        />
      </View>

      {reduceMotion ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: ITEM_GAP }}
        >
          {brands.map((brand, index) => (
            <BrandLogo key={`${brand.nb_brand}-${index}`} brand={brand} colors={colors} />
          ))}
        </ScrollView>
      ) : (
        <View style={{ gap: 12 }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <MarqueeRow brands={brands} colors={colors} direction="left" />
          <MarqueeRow brands={rowBottom} colors={colors} direction="right" />
        </View>
      )}
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
  // Duplicamos la fila una vez: mientras se anima exactamente el ancho de un set completo, el
  // segundo set queda pegado justo donde termina el primero → el loop es indistinguible al ojo.
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
  const [loaded, setLoaded] = useState(false);
  const showFallback = !brand.tx_img_url || failed;

  return (
    <Surface
      colors={colors}
      radius={12}
      padding={0}
      style={{ width: ITEM_WIDTH, height: ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }}
      accessibilityLabel={brand.nb_brand ? `Marca ${brand.nb_brand}` : undefined}
    >
      {showFallback ? (
        <Building2 size={22} color={colors.muted} strokeWidth={1.6} />
      ) : (
        <>
          {!loaded && (
            <Skeleton
              width={ITEM_WIDTH}
              height={ITEM_HEIGHT}
              borderRadius={12}
              colors={colors}
              style={{ position: 'absolute' }}
            />
          )}
          <Image
            source={{ uri: brand.tx_img_url }}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
        </>
      )}
    </Surface>
  );
}

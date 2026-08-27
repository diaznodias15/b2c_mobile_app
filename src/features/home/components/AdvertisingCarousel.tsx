import { useMemo } from 'react';
import { Dimensions, Image, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { Carousel } from 'react-native-reanimated-carousel';

import { useAdvertisingStore } from '@/store';
import {
  advertisingImageUrl,
  sortAdvertising,
} from '@/features/home/utils/adapters';
import type { Advertising } from '@/types/whitelabel';

/**
 * Carrusel de publicidad del Home.
 *
 * Usa `react-native-reanimated-carousel` v4 con la API nueva
 * (`style` en vez de `width`/`height`, `autoplay` en vez de
 * `autoPlay`). Si no hay publicidad, no se renderiza.
 */
export function AdvertisingCarousel() {
  const advertising = useAdvertisingStore((s) => s.advertising);
  const sorted = useMemo(() => sortAdvertising(advertising), [advertising]);
  const width = Dimensions.get('window').width;
  const height = width * 0.42;
  const progress = useSharedValue(0);

  if (sorted.length === 0) return null;

  return (
    <View className="mt-1">
      <Carousel<Advertising>
        data={sorted}
        autoplay
        autoplayInterval={5000}
        loop
        style={{ width, height }}
        onProgressChange={(absoluteProgress: number) => {
          progress.value = absoluteProgress;
        }}
        renderItem={({ item }) => (
          <View className="flex-1 px-4">
            <Image
              source={{ uri: advertisingImageUrl(item) }}
              style={{
                width: width - 32,
                height: height - 8,
                borderRadius: 14,
              }}
              resizeMode="cover"
              accessibilityLabel={item.nb_advertising}
            />
          </View>
        )}
      />
    </View>
  );
}

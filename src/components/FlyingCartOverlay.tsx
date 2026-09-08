import { useEffect } from 'react';
import { Image } from 'expo-image';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useFlyingCartStore } from '@/store/flyingCart.store';

const DURATION = 550;

/**
 * "Flying to cart": la imagen del producto vuela desde donde se tocó
 * "Agregar" hasta el ícono del carrito en BottomTabs. Montado una sola
 * vez en Providers.tsx — lee `flight`/`cartIconPosition` de
 * `useFlyingCartStore`, así que cualquier pantalla puede dispararla sin
 * conocer este componente.
 */
export function FlyingCartOverlay() {
  const flight = useFlyingCartStore((s) => s.flight);
  const cartIconPosition = useFlyingCartStore((s) => s.cartIconPosition);
  const clearFly = useFlyingCartStore((s) => s.clearFly);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (!flight || !cartIconPosition) return;

    const originCenterX = flight.rect.x + flight.rect.width / 2;
    const originCenterY = flight.rect.y + flight.rect.height / 2;
    const dx = cartIconPosition.x - originCenterX;
    const dy = cartIconPosition.y - originCenterY;

    translateX.value = 0;
    translateY.value = 0;
    scale.value = 1;
    opacity.value = 1;

    const easing = Easing.in(Easing.cubic);
    translateX.value = withTiming(dx, { duration: DURATION, easing });
    translateY.value = withTiming(dy, { duration: DURATION, easing });
    scale.value = withTiming(0.15, { duration: DURATION, easing });
    opacity.value = withTiming(0, { duration: DURATION }, (finished) => {
      if (finished) runOnJS(clearFly)();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flight, cartIconPosition]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  if (!flight) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: flight.rect.x,
          top: flight.rect.y,
          width: flight.rect.width,
          height: flight.rect.height,
        },
        animatedStyle,
      ]}
    >
      <Image
        source={flight.source}
        style={{ width: '100%', height: '100%', borderRadius: 12 }}
        contentFit="cover"
      />
    </Animated.View>
  );
}

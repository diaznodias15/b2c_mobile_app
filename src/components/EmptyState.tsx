import * as React from 'react';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

type IllustrationKey = 'cart' | 'search' | 'department';

type Props = {
  illustration: IllustrationKey;
  title: string;
  description?: string;
  cta?: { label: string; onPress: () => void };
  secondaryCta?: { label: string; onPress: () => void };
};

const ILLUSTRATION_LOADERS: Record<
  IllustrationKey,
  () => Promise<React.ComponentType<{ width?: number; height?: number }>>
> = {
  cart: () =>
    import('@/components/illustrations').then((m) => m.EmptyCartIllustration),
  search: () =>
    import('@/components/illustrations').then((m) => m.EmptySearchIllustration),
  department: () =>
    import('@/components/illustrations').then(
      (m) => m.EmptyDepartmentIllustration
    ),
};

/**
 * Empty state con ilustracion SVG, copy calido y CTA opcional.
 *
 * Anima la ilustracion con un scale-in sutil al montar (220ms).
 * El copy va en es-VE directo (sin "oops", "no se encontraron", etc).
 */
export function EmptyState({
  illustration,
  title,
  description,
  cta,
  secondaryCta,
}: Props) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withTiming(1, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
    opacity.value = withDelay(40, withTiming(1, { duration: 200 }));
  }, [scale, opacity]);

  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const [Illustration, setIllustration] =
    React.useState<React.ComponentType<{ width?: number; height?: number }> | null>(
      null
    );

  React.useEffect(() => {
    let cancelled = false;
    ILLUSTRATION_LOADERS[illustration]().then((mod) => {
      if (!cancelled) setIllustration(() => mod);
    });
    return () => {
      cancelled = true;
    };
  }, [illustration]);

  return (
    <View className="flex-1 items-center justify-center px-8 gap-3">
      <Animated.View style={animated}>
        {Illustration ? <Illustration width={140} height={140} /> : null}
      </Animated.View>
      <Text className="text-base font-bold text-foreground text-center">
        {title}
      </Text>
      {description ? (
        <Text className="text-xs text-muted text-center leading-5 max-w-[280px]">
          {description}
        </Text>
      ) : null}
      {cta ? (
        <Pressable
          onPress={cta.onPress}
          className="mt-3 bg-primary rounded-[14px] py-3 px-6"
          accessibilityRole="button"
          accessibilityLabel={cta.label}
        >
          <Text className="text-sm font-bold text-primary-foreground">
            {cta.label}
          </Text>
        </Pressable>
      ) : null}
      {secondaryCta ? (
        <Pressable
          onPress={secondaryCta.onPress}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={secondaryCta.label}
        >
          <Text className="text-xs font-medium text-muted mt-1">
            {secondaryCta.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

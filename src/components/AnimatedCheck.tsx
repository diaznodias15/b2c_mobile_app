import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  size?: number;
  color?: string;
};

/**
 * Check animado: el circulo se dibuja primero (scale + opacity),
 * despues el tick (stroke-dashoffset) se traza con un spring suave.
 * Duracion total ~700ms.
 */
export function AnimatedCheck({ size = 140, color = '#17C964' }: Props) {
  const progress = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, {
      damping: 12,
      stiffness: 180,
      mass: 0.8,
    });
    progress.value = withDelay(
      250,
      withTiming(1, {
        duration: 420,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [progress, scale]);

  // Path length del check (empieza en M0 0 y se extiende).
  // Para el trazo, definimos un path con strokeDasharray grande
  // y animamos el offset desde el max hasta 0.
  const checkLength = 70; // longitud aproximada del check (M30,50 L45,65 L72,35)

  const circleProps = useAnimatedProps(() => ({
    opacity: scale.value === 0 ? 0 : 0.18 * scale.value,
    transform: `scale(${scale.value})`,
  }));

  const checkProps = useAnimatedProps(() => ({
    strokeDashoffset: checkLength * (1 - progress.value),
  }));

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <AnimatedCircle
        cx="50"
        cy="50"
        r="45"
        fill={color}
        animatedProps={circleProps}
      />
      <AnimatedPath
        d="M30 50 L45 65 L72 35"
        stroke={color}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray={checkLength}
        animatedProps={checkProps}
      />
    </Svg>
  );
}

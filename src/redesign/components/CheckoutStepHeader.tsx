import { View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import type { ThemeColors } from '@/theme/colors';

import { IconButton } from '../ui/IconButton';
import { Txt } from '../ui/Txt';

/**
 * Cabecera de un paso del checkout Full: botón de volver de 48 dp, el título del paso y "Paso N de
 * M" con una barra de progreso de segmentos (anunciada como un solo elemento). `onBack` se usa para
 * volver al paso anterior; si no se pasa, vuelve atrás o al carrito (igual que el checkout Lite).
 */
export function CheckoutStepHeader({
  title,
  subtitle,
  step,
  totalSteps,
  onBack,
  colors,
}: {
  title: string;
  subtitle?: string;
  step: number;
  totalSteps: number;
  onBack?: () => void;
  colors: ThemeColors;
}) {
  const router = useRouter();
  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <IconButton
          icon={ChevronLeft}
          label="Volver"
          onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/cart')))}
          colors={colors}
        />
        <View style={{ flex: 1 }}>
          <Txt variant="caption" color="muted" colors={colors}>
            Paso {step} de {totalSteps}
          </Txt>
        </View>
      </View>

      <View
        style={{ flexDirection: 'row', gap: 4 }}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={`Paso ${step} de ${totalSteps}`}
      >
        {Array.from({ length: totalSteps }, (_, i) => (
          <View
            key={i}
            style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i < step ? colors.primary : colors.border }}
          />
        ))}
      </View>

      <View style={{ gap: 4 }}>
        <Txt variant="title" colors={colors} accessibilityRole="header">
          {title}
        </Txt>
        {subtitle ? (
          <Txt variant="body" color="muted" colors={colors}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
    </View>
  );
}

import { Pressable, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import type { ThemeColors } from '@/theme/colors';

import { MIN_TOUCH } from '../ui/tokens';
import { Txt } from '../ui/Txt';

/**
 * Encabezado de sección del rediseño. **Mismo contrato que `@/components/SectionHeader`**
 * (`title`, `subtitle`, `colors`) más una acción opcional ("Ver todo").
 *
 * Qué cambia: alineado a la izquierda (en e-commerce se escanea por el borde izquierdo; el título
 * centrado obligaba a buscar dónde empieza cada bloque), subtítulo de 14 px (era 13) y, cuando hay
 * una vista a la que llevar, una acción de 48 dp a la derecha.
 */
export function SectionHeader({
  title,
  subtitle,
  colors,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle?: string;
  colors: ThemeColors;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Txt variant="section" colors={colors} accessibilityRole="header">
            {title}
          </Txt>
        </View>
        {actionLabel && onAction ? (
          <Pressable
            onPress={onAction}
            accessibilityRole="button"
            accessibilityLabel={`${actionLabel}: ${title}`}
            style={{ minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: 2 }}
          >
            <Txt variant="label" color="primary" colors={colors}>
              {actionLabel}
            </Txt>
            <ChevronRight size={16} color={colors.primary} strokeWidth={2.5} />
          </Pressable>
        ) : null}
      </View>
      {subtitle ? (
        <Txt variant="label" color="muted" colors={colors} style={{ fontWeight: '400', marginTop: 2 }}>
          {subtitle}
        </Txt>
      ) : null}
    </View>
  );
}

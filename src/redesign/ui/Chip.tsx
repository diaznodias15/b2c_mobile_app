import { Pressable, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import type { ThemeColors } from '@/theme/colors';

import { Txt } from './Txt';
import { useColors } from './useColors';

/**
 * Chip de filtro/estado. Seleccionado = relleno suave del primario + borde primario
 * (no depende solo del color: el texto pasa a `primary` y el borde se engrosa).
 * Alto visual 40 + `hitSlop` vertical = 48 de área táctil.
 */
export function Chip({
  label,
  selected = false,
  onPress,
  icon: Icon,
  count,
  colors,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: LucideIcon;
  /** Número opcional (p. ej. filtros activos); se anuncia junto al texto. */
  count?: number;
  colors?: ThemeColors;
}) {
  const theme = useColors(colors);
  const fg = selected ? theme.primary : theme.foreground;

  const content = (
    <View
      style={{
        height: 40,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        borderRadius: 999,
        borderWidth: selected ? 1.5 : 1,
        borderColor: selected ? theme.primary : theme.border,
        backgroundColor: selected ? theme.primaryOverlay : theme.productCard,
      }}
    >
      {Icon && <Icon size={16} color={fg} />}
      <Txt variant="label" color={selected ? 'primary' : 'foreground'} colors={theme} numberOfLines={1}>
        {label}
        {count != null && count > 0 ? ` (${count})` : ''}
      </Txt>
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={{ top: 4, bottom: 4 }}
      accessibilityRole="button"
      accessibilityLabel={count ? `${label}, ${count} activos` : label}
      accessibilityState={{ selected }}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      {content}
    </Pressable>
  );
}

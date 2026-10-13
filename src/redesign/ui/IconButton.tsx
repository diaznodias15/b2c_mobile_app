import { Pressable } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import type { ThemeColors } from '@/theme/colors';

import { MIN_TOUCH } from './tokens';
import { useColors } from './useColors';

/**
 * Botón de solo icono. El área táctil es siempre ≥48 aunque el icono sea pequeño,
 * y `label` es obligatorio: un control sin texto necesita nombre accesible.
 */
export function IconButton({
  icon: Icon,
  label,
  onPress,
  variant = 'soft',
  iconSize = 22,
  disabled = false,
  colors,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  variant?: 'soft' | 'filled' | 'plain';
  iconSize?: number;
  disabled?: boolean;
  colors?: ThemeColors;
}) {
  const theme = useColors(colors);
  const bg = variant === 'filled' ? theme.primary : variant === 'soft' ? theme.section : 'transparent';
  const fg = variant === 'filled' ? theme.onPrimary : theme.foreground;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => ({
        width: MIN_TOUCH,
        height: MIN_TOUCH,
        borderRadius: MIN_TOUCH / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bg,
        opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
      })}
    >
      <Icon size={iconSize} color={fg} />
    </Pressable>
  );
}

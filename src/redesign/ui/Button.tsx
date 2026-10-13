import { ActivityIndicator, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import type { ThemeColors } from '@/theme/colors';

import { MIN_TOUCH, type TextColor } from './tokens';
import { Txt } from './Txt';
import { useColors } from './useColors';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

/**
 * Botón del rediseño: alto ≥48, estados `pressed`/`disabled`/`loading` y semántica
 * de accesibilidad. Un solo CTA `primary` por pantalla; el resto `secondary`/`ghost`.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  icon: Icon,
  loading = false,
  disabled = false,
  fullWidth = true,
  height = MIN_TOUCH,
  colors,
  accessibilityLabel,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  height?: number;
  colors?: ThemeColors;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useColors(colors);
  const inactive = disabled || loading;

  const palette = {
    primary: { bg: theme.primary, fg: theme.onPrimary, border: theme.primary },
    secondary: { bg: theme.primaryOverlay, fg: theme.primary, border: 'transparent' },
    ghost: { bg: 'transparent', fg: theme.foreground, border: theme.border },
    // Texto blanco fijo: el rojo de estado es siempre lo bastante oscuro para llevarlo.
    danger: { bg: theme.danger, fg: '#FFFFFF', border: theme.danger },
  }[variant];

  const fgRole: TextColor =
    variant === 'primary' ? 'onPrimary' : variant === 'secondary' ? 'primary' : 'foreground';

  return (
    <Pressable
      onPress={inactive ? undefined : onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        {
          minHeight: height,
          alignSelf: fullWidth ? 'stretch' : 'center',
          borderRadius: 12,
          borderWidth: variant === 'ghost' ? 1 : 0,
          borderColor: palette.border,
          backgroundColor: palette.bg,
          paddingHorizontal: 16,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {loading ? (
          <ActivityIndicator size="small" color={palette.fg} />
        ) : Icon ? (
          <Icon size={18} color={palette.fg} strokeWidth={2.5} />
        ) : null}
        <Txt
          variant="label"
          color={fgRole}
          colors={theme}
          numberOfLines={1}
          style={variant === 'danger' ? { color: palette.fg } : undefined}
        >
          {label}
        </Txt>
      </View>
    </Pressable>
  );
}

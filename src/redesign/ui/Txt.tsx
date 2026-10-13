import type { ReactNode } from 'react';
import { Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';

import type { ThemeColors } from '@/theme/colors';

import { MAX_FONT_SCALE, TYPE, textColor, type TextColor, type TypeVariant } from './tokens';
import { useColors } from './useColors';

/**
 * Texto con la escala del rediseño. Estilos inline (no `className`, ver AGENTS.md).
 * `maxFontSizeMultiplier` acota el crecimiento con "texto grande" del sistema para
 * que precios y botones no se rompan, sin ignorar la preferencia del usuario.
 */
export function Txt({
  variant = 'body',
  color = 'foreground',
  colors,
  style,
  children,
  ...rest
}: Omit<TextProps, 'style'> & {
  variant?: TypeVariant;
  color?: TextColor;
  colors?: ThemeColors;
  style?: StyleProp<TextStyle>;
  children?: ReactNode;
}) {
  const theme = useColors(colors);
  return (
    <Text
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      {...rest}
      style={[TYPE[variant], { color: textColor(theme, color) }, style]}
    >
      {children}
    </Text>
  );
}

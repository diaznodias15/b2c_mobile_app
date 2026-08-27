import { Platform, type TextStyle } from 'react-native';

/**
 * Familia tipográfica del rediseño Soft.
 * Spline Sans es la fuente principal de la web; en móvil usamos
 * system-ui (San Francisco en iOS, Roboto en Android) hasta que
 * se decida cargar Spline Sans vía expo-font.
 */
const family = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

const familyMedium = Platform.select({
  ios: 'System',
  android: 'sans-serif-medium',
  default: 'System',
});

const familySemibold = Platform.select({
  ios: 'System',
  android: 'sans-serif-medium',
  default: 'System',
});

const familyBold = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

function make(
  familyName: string,
  size: number,
  lineHeight: number,
  weight: TextStyle['fontWeight']
): TextStyle {
  return { fontFamily: familyName, fontSize: size, lineHeight, fontWeight: weight };
}

/** Escala tipográfica alineada con la web Soft. */
export const Typography = {
  display: make(familyBold, 32, 40, '700'),
  h1: make(familyBold, 28, 36, '700'),
  h2: make(familySemibold, 24, 32, '600'),
  h3: make(familySemibold, 20, 28, '600'),
  h4: make(familySemibold, 18, 26, '600'),
  bodyLg: make(family, 17, 26, '400'),
  body: make(family, 15, 22, '400'),
  bodySm: make(family, 14, 20, '400'),
  label: make(familyMedium, 14, 20, '500'),
  caption: make(family, 12, 18, '400'),
  code: make('monospace', 14, 20, '400'),
} as const;

export type TypographyKey = keyof typeof Typography;

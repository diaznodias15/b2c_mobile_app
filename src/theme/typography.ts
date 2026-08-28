import { Platform, type TextStyle } from 'react-native';

/**
 * Familias tipograficas del rediseño.
 *
 * - Heading: **Plus Jakarta Sans** (sans moderna, ligeramente calida,
 *   bien legible a tamaños grandes). Default 600/700.
 * - Body: **Inter** (sans neutra, la mejor legibilidad a 14-16px).
 *
 * En WEB los nombres matchean el `@import` de Google Fonts en
 * `src/global.css` (con espacios). En NATIVE hay que cargar los .ttf
 * via `expo-font` con los mismos nombres (sin espacios es la
 * convencion de expo-font, asi que el root layout mapea).
 *
 * Mientras no esten cargadas, caen a la font del sistema via la cadena
 * CSS sin layout shift perceptible.
 */

export const FontFamily = {
  heading: 'Plus Jakarta Sans',
  body: 'Inter',
  /** Code / mono. */
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }) as string,
} as const;

const headingFamily = FontFamily.heading;
const bodyFamily = FontFamily.body;

function make(
  family: string,
  size: number,
  lineHeight: number,
  weight: TextStyle['fontWeight']
): TextStyle {
  return { fontFamily: family, fontSize: size, lineHeight, fontWeight: weight };
}

/** Escala tipografica. Headings usan Plus Jakarta Sans, body Inter. */
export const Typography = {
  display: make(headingFamily, 32, 40, '700'),
  h1: make(headingFamily, 28, 36, '700'),
  h2: make(headingFamily, 24, 32, '700'),
  h3: make(headingFamily, 20, 28, '600'),
  h4: make(headingFamily, 18, 26, '600'),

  bodyLg: make(bodyFamily, 17, 26, '400'),
  body: make(bodyFamily, 15, 22, '400'),
  bodySm: make(bodyFamily, 14, 20, '400'),

  label: make(bodyFamily, 14, 20, '500'),
  caption: make(bodyFamily, 12, 18, '400'),

  code: make(FontFamily.mono, 13, 20, '400'),
} as const;

export type TypographyKey = keyof typeof Typography;

/**
 * Familias para `<Text style={{ fontFamily }}>`. Alias de FontFamily
 * para que el codigo de UI importe un solo nombre.
 */
export const Fonts = FontFamily;

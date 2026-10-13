import type { TextStyle } from 'react-native';

import type { ThemeColors } from '@/theme/colors';

/**
 * Escala tipográfica del rediseño (ver `docs/redesign/DESIGN-SYSTEM.md` §3).
 * Fuente del sistema (las fuentes personalizadas son un paso aparte) y
 * **mínimo 12 px** en todo el texto.
 */
export const TYPE = {
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  section: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  price: { fontSize: 18, lineHeight: 24, fontWeight: '800' },
  priceSm: { fontSize: 15, lineHeight: 20, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
} as const satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof TYPE;

/** Roles de color de texto disponibles (todos son strings de `ThemeColors`). */
export type TextColor =
  | 'foreground'
  | 'muted'
  | 'primary'
  | 'onPrimary'
  | 'success'
  | 'warning'
  | 'danger';

export const textColor = (colors: ThemeColors, role: TextColor): string => colors[role];

/** Mínimo táctil (dp) — ver `DESIGN-SYSTEM.md` §7. */
export const MIN_TOUCH = 48;

/** Tope al que escala el texto con la configuración de accesibilidad del sistema. */
export const MAX_FONT_SCALE = 1.3;

/**
 * Escala de espaciado — equivalente a Mantine `xs/sm/md/lg/xl`.
 * Mobile-first: arranca en 4px, escala hacia arriba.
 *
 * Usar siempre `Spacing.x`, nunca valores hardcodeados en componentes.
 */
export const Spacing = {
  px: 1,
  '0_5': 2,
  '1': 4,
  '1_5': 6,
  '2': 8,
  '3': 12,
  '4': 16,
  '5': 20,
  '6': 24,
  '8': 32,
  '10': 40,
  '12': 48,
  '16': 64,
  '20': 80,
  '24': 96,
} as const;

export type SpacingKey = keyof typeof Spacing;

/** Radio por defecto del rediseño Soft. Sobrescribible desde config. */
export const DEFAULT_RADIUS = 14;

export const Radius = {
  default: DEFAULT_RADIUS,
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  full: 9999,
} as const;

export type RadiusKey = keyof typeof Radius;

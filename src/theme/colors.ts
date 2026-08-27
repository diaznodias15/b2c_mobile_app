/**
 * Tokens de color del rediseño "Soft" (Farmacia El Samán de Perijá).
 *
 * Estos son los valores por defecto. Los colores reales vienen del
 * endpoint /api/config/get (whitelabel). Cuando se carga la config,
 * `applyConfigColorsToTheme()` sobrescribe estas variables en runtime.
 *
 * Las claves coinciden con las CSS variables definidas en src/global.css.
 */

export type ThemeColors = {
  background: string;
  foreground: string;
  section: string;
  surface: string;
  muted: string;
  border: string;
  primary: string;
  primaryForeground: string;
  success: string;
  danger: string;
  warning: string;
  navbar: string;
  navbarForeground: string;
  bottomNavbar: string;
  footer: string;
};

/** Fallback Soft (verde teal suave sobre blanco). */
export const SOFT_COLORS: ThemeColors = {
  background: '#ffffff',
  foreground: '#111827',
  section: '#f8f9fb',
  surface: '#ffffff',
  muted: '#6b7280',
  border: '#e5e7eb',
  primary: '#0f766e',
  primaryForeground: '#ffffff',
  success: '#16a34a',
  danger: '#dc2626',
  warning: '#f59e0b',
  navbar: '#ffffff',
  navbarForeground: '#111827',
  bottomNavbar: '#ffffff',
  footer: '#f8f9fb',
};

/** Forma esperada del campo `config_colors` que llega del backend. */
export type ConfigColors = {
  tx_background_color?: string;
  tx_section_color?: string;
  tx_surface_color?: string;
  tx_text_color?: string;
  tx_muted_color?: string;
  tx_border_color?: string;
  tx_primary_color?: string;
  tx_primary_foreground_color?: string;
  tx_success_color?: string;
  tx_danger_color?: string;
  tx_warning_color?: string;
  tx_navbar_color?: string;
  tx_navbar_text_color?: string;
  tx_bottom_navbar_color?: string;
  tx_footer_color?: string;
  tx_default_radius?: string | number;
};

/**
 * Construye los tokens del tema a partir de la config del backend.
 * Si la config está vacía o parcial, mantiene los defaults Soft.
 */
export function buildThemeColors(
  configColors: ConfigColors | null | undefined
): ThemeColors {
  if (!configColors) return SOFT_COLORS;
  return {
    background: configColors.tx_background_color ?? SOFT_COLORS.background,
    foreground: configColors.tx_text_color ?? SOFT_COLORS.foreground,
    section: configColors.tx_section_color ?? SOFT_COLORS.section,
    surface: configColors.tx_surface_color ?? SOFT_COLORS.surface,
    muted: configColors.tx_muted_color ?? SOFT_COLORS.muted,
    border: configColors.tx_border_color ?? SOFT_COLORS.border,
    primary: configColors.tx_primary_color ?? SOFT_COLORS.primary,
    primaryForeground:
      configColors.tx_primary_foreground_color ?? SOFT_COLORS.primaryForeground,
    success: configColors.tx_success_color ?? SOFT_COLORS.success,
    danger: configColors.tx_danger_color ?? SOFT_COLORS.danger,
    warning: configColors.tx_warning_color ?? SOFT_COLORS.warning,
    navbar: configColors.tx_navbar_color ?? SOFT_COLORS.navbar,
    navbarForeground:
      configColors.tx_navbar_text_color ?? SOFT_COLORS.navbarForeground,
    bottomNavbar:
      configColors.tx_bottom_navbar_color ?? SOFT_COLORS.bottomNavbar,
    footer: configColors.tx_footer_color ?? SOFT_COLORS.footer,
  };
}

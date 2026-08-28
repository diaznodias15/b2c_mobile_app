/**
 * Tokens de color del whitelabel.
 *
 * El backend (`/api/config/get`) devuelve `config_colors` con **30+ keys**
 * con prefijo `col_*` y `tx_default_radius`. Esos nombres vienen DIRECTOS
 * del iCommerce360 backend (no son una decision nuestra). El admin del
 * panel los cambia desde su dashboard.
 *
 * En runtime, `buildThemeColors(configColors)` mapea los 30 keys del
 * backend a un objeto `ThemeColors` curado que consume el resto de la
 * app. Si la config llega vacia, cae a `SOFT_COLORS` (los mismos valores
 * que el backend trae por defecto hoy: verde #008000 + off-white #F5F4F0).
 *
 * Ademas derivamos tokens secundarios (overlay, shadow) a partir de los
 * primarios para que toda la UI sea coherente sin tener que duplicar
 * definiciones de color en cada componente.
 */

// ============================================================
// FORMA DEL WHITELABEL (lo que llega del backend)
// ============================================================

export type ConfigColors = {
  // Superficies
  col_background?: string;
  col_background_dark?: string;
  col_section?: string;
  col_section_dark?: string;
  col_footer?: string;
  col_footer_dark?: string;
  col_navbar?: string;
  col_navbar_dark?: string;
  col_navbar_departments?: string;
  col_navbar_departments_dark?: string;
  col_background_bottom_navbar?: string;
  col_background_bottom_navbar_dark?: string;
  col_product_card?: string;
  col_product_card_dark?: string;
  // Brand
  col_primary?: string;
  col_primary_dark?: string;
  col_secondary_bottom_navbar?: string;
  col_secondary_bottom_navbar_dark?: string;
  col_primary_bottom_navbar?: string;
  col_primary_bottom_navbar_dark?: string;
  // Status
  col_success?: string;
  col_success_dark?: string;
  col_danger?: string;
  col_danger_dark?: string;
  col_warning?: string;
  col_warning_dark?: string;
  // Texto sobre cada superficie
  col_text_for_background?: string;
  col_text_for_background_dark?: string;
  col_text_for_section?: string;
  col_text_for_section_dark?: string;
  col_text_for_footer?: string;
  col_text_for_footer_dark?: string;
  col_text_for_navbar?: string;
  col_text_for_navbar_dark?: string;
  col_text_for_navbar_departments?: string;
  col_text_for_navbar_departments_dark?: string;
  col_text_for_product_card?: string;
  col_text_for_product_card_dark?: string;
  col_text_for_primary?: string;
  col_text_for_primary_dark?: string;
  col_text_for_success?: string;
  col_text_for_success_dark?: string;
  col_text_for_danger?: string;
  col_text_for_danger_dark?: string;
  col_text_for_warning?: string;
  col_text_for_warning_dark?: string;
  // Tokens no-color
  tx_default_radius?: string;
};

// ============================================================
// TOKENS INTERNOS (lo que consume la app)
// ============================================================

export type ThemeColors = {
  // Surfaces
  background: string;
  section: string;
  surface: string;
  navbar: string;
  /** Strip de departamentos (color secundario destacado). */
  navbarDepartments: string;
  bottomNavbar: string;
  footer: string;
  /** Card de producto (fondo blanco puro por default). */
  productCard: string;

  // Foreground / texto
  foreground: string;
  /** Texto secundario / muted. */
  muted: string;
  /** Borde sutil (1px con 20% opacity del foreground). */
  border: string;

  // Brand
  primary: string;
  primaryForeground: string;
  /** Color secundario del bottom navbar (gris/azul). */
  secondary: string;

  // Status
  success: string;
  danger: string;
  warning: string;

  // Derivados (computados a partir de los primarios)
  /** Primary con 10% opacity. Sirve para highlights suaves. */
  primaryOverlay: string;
  /** Primary con 8% opacity. Para el background del active state. */
  primaryOverlaySoft: string;
  /** Color base para sombras (negro con baja opacidad). */
  shadowColor: string;
  /** Texto sobre el primary (casi siempre blanco, pero el admin lo puede cambiar). */
  onPrimary: string;
};

/** Fallback cuando el backend no devuelve `config_colors`. */
export const SOFT_COLORS: ThemeColors = {
  background: '#F5F4F0',
  section: '#FEFFFE',
  surface: '#FEFFFE',
  navbar: '#FEFFFE',
  navbarDepartments: '#1014C5',
  bottomNavbar: '#FEFFFE',
  footer: '#FEFFFE',
  productCard: '#FEFFFE',

  foreground: '#1A1A2E',
  muted: '#60646C',
  border: 'rgba(26, 26, 46, 0.10)',

  primary: '#008000',
  primaryForeground: '#FFFFFF',
  secondary: '#757575',

  success: '#17C964',
  danger: '#F87171',
  warning: '#F5A524',

  primaryOverlay: 'rgba(0, 128, 0, 0.10)',
  primaryOverlaySoft: 'rgba(0, 128, 0, 0.05)',
  shadowColor: 'rgba(0, 0, 0, 0.08)',
  onPrimary: '#FFFFFF',
};

// ============================================================
// UTILIDADES
// ============================================================

/**
 * Convierte un hex `#RRGGBB` a `rgba(r, g, b, alpha)`. Si el input
 * no es hex valido, devuelve el input original.
 */
function hexToRgba(hex: string | undefined, alpha: number): string {
  if (!hex || !hex.startsWith('#') || hex.length < 7) {
    return hex ?? 'transparent';
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if ([r, g, b].some(Number.isNaN)) return hex;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Mapea los 30+ keys del whitelabel al set curado de tokens que
 * consume la app. Deriva overlay/shadow de los primarios.
 *
 * Si `configColors` es null, devuelve los SOFT_COLORS (los mismos
 * valores que el backend trae por defecto).
 */
export function buildThemeColors(
  configColors: ConfigColors | null | undefined
): ThemeColors {
  if (!configColors) return SOFT_COLORS;

  const c = configColors;

  return {
    // Surfaces
    background: c.col_background ?? SOFT_COLORS.background,
    section: c.col_section ?? SOFT_COLORS.section,
    surface: c.col_section ?? SOFT_COLORS.surface,
    navbar: c.col_navbar ?? SOFT_COLORS.navbar,
    navbarDepartments:
      c.col_navbar_departments ?? SOFT_COLORS.navbarDepartments,
    bottomNavbar:
      c.col_background_bottom_navbar ?? SOFT_COLORS.bottomNavbar,
    footer: c.col_footer ?? SOFT_COLORS.footer,
    productCard: c.col_product_card ?? SOFT_COLORS.productCard,

    // Foreground
    foreground:
      c.col_text_for_background ??
      c.col_text_for_section ??
      SOFT_COLORS.foreground,
    muted: SOFT_COLORS.muted, // El whitelabel no lo define, derivado
    border: hexToRgba(
      c.col_text_for_section ?? c.col_text_for_background,
      0.12
    ),

    // Brand
    primary: c.col_primary ?? SOFT_COLORS.primary,
    primaryForeground:
      c.col_text_for_primary ?? SOFT_COLORS.primaryForeground,
    secondary:
      c.col_secondary_bottom_navbar ?? SOFT_COLORS.secondary,

    // Status
    success: c.col_success ?? SOFT_COLORS.success,
    danger: c.col_danger ?? SOFT_COLORS.danger,
    warning: c.col_warning ?? SOFT_COLORS.warning,

    // Derivados
    primaryOverlay: hexToRgba(c.col_primary, 0.10),
    primaryOverlaySoft: hexToRgba(c.col_primary, 0.05),
    shadowColor: SOFT_COLORS.shadowColor,
    onPrimary: c.col_text_for_primary ?? SOFT_COLORS.onPrimary,
  };
}

import type { ConfigColors, ThemeColors } from './colors';

/**
 * Mapea los tokens internos del tema a CSS variables que viven en :root.
 * Se llama cada vez que llega config nueva del backend.
 *
 * En React Native, las CSS variables se setean en un View root vía
 * `style={{ ['--color-primary' as any]: value }}`. Este helper devuelve
 * un objeto de estilos listo para pasar al provider.
 *
 * Mantenemos solo los tokens que la UI consume directo via CSS vars.
 * Los derivados (overlay, shadow color) se calculan dentro de
 * `buildThemeColors` y se exponen como `className` de Tailwind via
 * `themeColorsToCssVars` + `bg-primary/10` etc.
 */
export function themeColorsToCssVars(colors: ThemeColors): Record<string, string> {
  return {
    // Surfaces
    '--color-background': colors.background,
    '--color-section': colors.section,
    '--color-surface': colors.surface,
    '--color-navbar': colors.navbar,
    '--color-navbar-departments': colors.navbarDepartments,
    '--color-bottom-navbar': colors.bottomNavbar,
    '--color-footer': colors.footer,
    '--color-product-card': colors.productCard,

    // Foreground
    '--color-foreground': colors.foreground,
    '--color-muted': colors.muted,
    '--color-border': colors.border,

    // Brand
    '--color-primary': colors.primary,
    '--color-primary-foreground': colors.primaryForeground,
    '--color-on-primary': colors.onPrimary,
    '--color-secondary': colors.secondary,

    // Status
    '--color-success': colors.success,
    '--color-danger': colors.danger,
    '--color-warning': colors.warning,

    // Derivados
    '--color-primary-overlay': colors.primaryOverlay,
    '--color-primary-overlay-soft': colors.primaryOverlaySoft,
    '--color-shadow': colors.shadowColor,
  };
}

/** Devuelve la lista de keys que cambiaron entre dos configs. Útil para logging. */
export function diffConfigColors(
  prev: ConfigColors | null | undefined,
  next: ConfigColors | null | undefined
): string[] {
  if (!next) return [];
  const prevRecord = (prev ?? {}) as Record<string, unknown>;
  const nextRecord = next as Record<string, unknown>;
  return Object.keys(nextRecord).filter(
    (k) => prevRecord[k] !== nextRecord[k]
  );
}

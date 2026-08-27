import type { ConfigColors, ThemeColors } from './colors';

/**
 * Mapea tokens del tema a CSS variables que viven en :root.
 * Se llama cada vez que llega config nueva del backend.
 *
 * En React Native, las CSS variables se setean en un View root
 * vía `style={{ ['--color-primary' as any]: value }}`. Este helper
 * devuelve un objeto de estilos listo para pasar al provider.
 */
export function themeColorsToCssVars(colors: ThemeColors): Record<string, string> {
  return {
    '--color-background': colors.background,
    '--color-foreground': colors.foreground,
    '--color-section': colors.section,
    '--color-surface': colors.surface,
    '--color-muted': colors.muted,
    '--color-border': colors.border,
    '--color-primary': colors.primary,
    '--color-primary-foreground': colors.primaryForeground,
    '--color-success': colors.success,
    '--color-danger': colors.danger,
    '--color-warning': colors.warning,
    '--color-navbar': colors.navbar,
    '--color-navbar-foreground': colors.navbarForeground,
    '--color-bottom-navbar': colors.bottomNavbar,
    '--color-footer': colors.footer,
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

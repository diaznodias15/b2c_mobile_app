import { describe, it, expect } from 'vitest';
import { themeColorsToCssVars, diffConfigColors } from './applyConfigColors';
import { SOFT_COLORS, type ConfigColors } from './colors';

describe('themeColorsToCssVars', () => {
  it('convierte todos los tokens del theme a CSS custom properties', () => {
    const vars = themeColorsToCssVars(SOFT_COLORS);
    expect(vars['--color-background']).toBe(SOFT_COLORS.background);
    expect(vars['--color-primary']).toBe(SOFT_COLORS.primary);
    expect(vars['--color-primary-foreground']).toBe(SOFT_COLORS.primaryForeground);
    expect(vars['--color-on-primary']).toBe(SOFT_COLORS.onPrimary);
    expect(vars['--color-success']).toBe(SOFT_COLORS.success);
    expect(vars['--color-danger']).toBe(SOFT_COLORS.danger);
    expect(vars['--color-warning']).toBe(SOFT_COLORS.warning);
    expect(vars['--color-navbar']).toBe(SOFT_COLORS.navbar);
    expect(vars['--color-navbar-departments']).toBe(SOFT_COLORS.navbarDepartments);
    expect(vars['--color-bottom-navbar']).toBe(SOFT_COLORS.bottomNavbar);
    expect(vars['--color-footer']).toBe(SOFT_COLORS.footer);
    expect(vars['--color-product-card']).toBe(SOFT_COLORS.productCard);
    expect(vars['--color-secondary']).toBe(SOFT_COLORS.secondary);
    expect(vars['--color-primary-overlay']).toBe(SOFT_COLORS.primaryOverlay);
    expect(vars['--color-primary-overlay-soft']).toBe(SOFT_COLORS.primaryOverlaySoft);
    expect(vars['--color-shadow']).toBe(SOFT_COLORS.shadowColor);
    expect(vars['--color-border']).toBe(SOFT_COLORS.border);
  });

  it('devuelve todos los valores como strings de color validos (hex, rgb, rgba)', () => {
    const vars = themeColorsToCssVars(SOFT_COLORS);
    for (const value of Object.values(vars)) {
      expect(value).toMatch(/^(#[0-9a-fA-F]{3,8}|rgb|rgba|hsl|hsla)/);
    }
  });
});

describe('diffConfigColors', () => {
  it('devuelve [] cuando next es null', () => {
    expect(diffConfigColors({ col_primary: '#000' }, null)).toEqual([]);
  });

  it('devuelve todas las keys cuando previous es null', () => {
    const next: ConfigColors = { col_primary: '#000', col_danger: '#f00' };
    const result = diffConfigColors(null, next);
    expect(result).toContain('col_primary');
    expect(result).toContain('col_danger');
    expect(result).toHaveLength(2);
  });

  it('devuelve solo las keys que cambiaron', () => {
    const prev: ConfigColors = { col_primary: '#000', col_danger: '#aaa' };
    const next: ConfigColors = { col_primary: '#000', col_danger: '#f00' };
    const result = diffConfigColors(prev, next);
    expect(result).toEqual(['col_danger']);
  });

  it('devuelve [] cuando las configs son iguales', () => {
    const cfg: ConfigColors = { col_primary: '#000' };
    expect(diffConfigColors(cfg, cfg)).toEqual([]);
  });
});

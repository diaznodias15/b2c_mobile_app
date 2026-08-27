import { describe, it, expect } from 'vitest';
import { themeColorsToCssVars, diffConfigColors } from './applyConfigColors';
import { SOFT_COLORS, type ConfigColors } from './colors';

describe('themeColorsToCssVars', () => {
  it('converts every theme key to a CSS custom property', () => {
    const vars = themeColorsToCssVars(SOFT_COLORS);
    expect(vars['--color-background']).toBe(SOFT_COLORS.background);
    expect(vars['--color-foreground']).toBe(SOFT_COLORS.foreground);
    expect(vars['--color-primary']).toBe(SOFT_COLORS.primary);
    expect(vars['--color-success']).toBe(SOFT_COLORS.success);
    expect(vars['--color-danger']).toBe(SOFT_COLORS.danger);
    expect(vars['--color-warning']).toBe(SOFT_COLORS.warning);
    expect(vars['--color-navbar']).toBe(SOFT_COLORS.navbar);
    expect(vars['--color-navbar-foreground']).toBe(SOFT_COLORS.navbarForeground);
    expect(vars['--color-bottom-navbar']).toBe(SOFT_COLORS.bottomNavbar);
    expect(vars['--color-footer']).toBe(SOFT_COLORS.footer);
  });

  it('returns all values as valid CSS color strings', () => {
    const vars = themeColorsToCssVars(SOFT_COLORS);
    for (const value of Object.values(vars)) {
      // Cada valor debe empezar con # (hex) o rgb/hsl.
      expect(value).toMatch(/^(#[0-9a-fA-F]{3,8}|rgb|rgba|hsl|hsla)/);
    }
  });
});

describe('diffConfigColors', () => {
  it('returns empty array when next is null', () => {
    expect(diffConfigColors({ tx_primary_color: '#000' }, null)).toEqual([]);
  });

  it('returns all keys when previous is null', () => {
    const next: ConfigColors = { tx_primary_color: '#000', tx_danger_color: '#f00' };
    const result = diffConfigColors(null, next);
    expect(result).toContain('tx_primary_color');
    expect(result).toContain('tx_danger_color');
    expect(result).toHaveLength(2);
  });

  it('returns only the keys that changed', () => {
    const prev: ConfigColors = {
      tx_primary_color: '#000',
      tx_danger_color: '#aaa',
    };
    const next: ConfigColors = {
      tx_primary_color: '#000',
      tx_danger_color: '#f00',
    };
    const result = diffConfigColors(prev, next);
    expect(result).toEqual(['tx_danger_color']);
  });

  it('returns empty when configs are equal', () => {
    const cfg: ConfigColors = { tx_primary_color: '#000' };
    expect(diffConfigColors(cfg, cfg)).toEqual([]);
  });
});

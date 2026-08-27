import { describe, it, expect } from 'vitest';
import { buildThemeColors, SOFT_COLORS, type ConfigColors } from './colors';

describe('buildThemeColors', () => {
  it('returns SOFT defaults when config is null', () => {
    expect(buildThemeColors(null)).toEqual(SOFT_COLORS);
  });

  it('returns SOFT defaults when config is undefined', () => {
    expect(buildThemeColors(undefined)).toEqual(SOFT_COLORS);
  });

  it('returns SOFT defaults when config is empty object', () => {
    expect(buildThemeColors({})).toEqual(SOFT_COLORS);
  });

  it('uses backend values when provided', () => {
    const cfg: ConfigColors = {
      tx_primary_color: '#ff0000',
      tx_background_color: '#000000',
      tx_text_color: '#ffffff',
    };
    const result = buildThemeColors(cfg);
    expect(result.primary).toBe('#ff0000');
    expect(result.background).toBe('#000000');
    expect(result.foreground).toBe('#ffffff');
  });

  it('preserves SOFT defaults for fields not provided by backend', () => {
    const cfg: ConfigColors = { tx_primary_color: '#ff0000' };
    const result = buildThemeColors(cfg);
    expect(result.primary).toBe('#ff0000');
    // No provistos → caen al default Soft
    expect(result.background).toBe(SOFT_COLORS.background);
    expect(result.success).toBe(SOFT_COLORS.success);
    expect(result.danger).toBe(SOFT_COLORS.danger);
  });

  it('handles partial config without losing other overrides', () => {
    const cfg: ConfigColors = {
      tx_primary_color: '#0f766e',
      tx_navbar_color: '#1e293b',
      tx_navbar_text_color: '#f8fafc',
    };
    const result = buildThemeColors(cfg);
    expect(result.primary).toBe('#0f766e');
    expect(result.navbar).toBe('#1e293b');
    expect(result.navbarForeground).toBe('#f8fafc');
    // El resto sigue en Soft
    expect(result.section).toBe(SOFT_COLORS.section);
  });
});

describe('SOFT_COLORS', () => {
  it('has all required keys', () => {
    const required: (keyof typeof SOFT_COLORS)[] = [
      'background',
      'foreground',
      'section',
      'surface',
      'muted',
      'border',
      'primary',
      'primaryForeground',
      'success',
      'danger',
      'warning',
      'navbar',
      'navbarForeground',
      'bottomNavbar',
      'footer',
    ];
    for (const key of required) {
      expect(SOFT_COLORS).toHaveProperty(key);
      expect(typeof SOFT_COLORS[key]).toBe('string');
    }
  });
});

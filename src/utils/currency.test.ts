import { describe, it, expect } from 'vitest';
import { roundTo, convertPrice, formatPrice } from './currency';

describe('roundTo', () => {
  it('rounds to 2 decimals by default', () => {
    expect(roundTo(1.005)).toBeCloseTo(1.01, 2);
    expect(roundTo(1.234)).toBe(1.23);
  });

  it('rounds to N decimals when specified', () => {
    expect(roundTo(1.23456, 3)).toBe(1.235);
    expect(roundTo(1.23456, 0)).toBe(1);
  });

  it('handles negative values', () => {
    expect(roundTo(-1.235, 2)).toBe(-1.24);
  });

  it('passes through integers unchanged', () => {
    expect(roundTo(5)).toBe(5);
  });
});

describe('convertPrice', () => {
  const rate = 36.5; // 1 USD = 36.5 Bs.

  it('returns same value when currencies match', () => {
    expect(convertPrice(100, 'Bs.', 'Bs.', rate)).toBe(100);
    expect(convertPrice(5, 'USD', 'USD', rate)).toBe(5);
  });

  it('converts Bs. → USD by dividing by rate', () => {
    expect(convertPrice(365, 'Bs.', 'USD', rate)).toBe(10);
    expect(convertPrice(36.5, 'Bs.', 'USD', rate)).toBe(1);
  });

  it('converts USD → Bs. by multiplying by rate', () => {
    expect(convertPrice(10, 'USD', 'Bs.', rate)).toBe(365);
    expect(convertPrice(1, 'USD', 'Bs.', rate)).toBe(36.5);
  });

  it('rounds to 2 decimals', () => {
    // 100 / 3 = 33.333... → 33.33
    expect(convertPrice(100, 'Bs.', 'USD', 3)).toBe(33.33);
  });
});

describe('formatPrice', () => {
  it('formats with es-VE locale (comma decimal separator)', () => {
    const result = formatPrice(1234.5, 'Bs.');
    // toLocaleString('es-VE') usa coma para decimales
    expect(result).toMatch(/Bs\.\s*1\.234,50/);
  });

  it('handles small values without leading zeros weirdness', () => {
    const result = formatPrice(0.5, 'USD');
    expect(result).toMatch(/USD\s*0,50/);
  });

  it('rounds before formatting', () => {
    const result = formatPrice(1.005, 'Bs.');
    expect(result).toMatch(/1,01/);
  });
});

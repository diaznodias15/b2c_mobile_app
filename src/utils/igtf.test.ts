import { describe, it, expect } from 'vitest';
import { calculateAmountWithIgtf, IGTF_RATE } from './igtf';

describe('calculateAmountWithIgtf', () => {
  it('aplica 3% de recargo y convierte a la tasa', () => {
    // 1000 Bs. * 1.03 / 36 = 28.6111...
    expect(calculateAmountWithIgtf(1000, 36)).toBeCloseTo(28.6111, 3);
  });

  it('IGTF_RATE es 3%', () => {
    expect(IGTF_RATE).toBe(0.03);
  });

  it('devuelve 0 si la tasa es 0 o negativa (evita Infinity/NaN)', () => {
    expect(calculateAmountWithIgtf(1000, 0)).toBe(0);
    expect(calculateAmountWithIgtf(1000, -1)).toBe(0);
  });

  it('monto 0 da 0 sin importar la tasa', () => {
    expect(calculateAmountWithIgtf(0, 36)).toBe(0);
  });
});

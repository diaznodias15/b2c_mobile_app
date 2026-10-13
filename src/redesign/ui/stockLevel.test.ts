import { describe, it, expect } from 'vitest';
import { getStockLevel } from './stockLevel';

describe('getStockLevel', () => {
  it('≤0 → sin stock (también con strings)', () => {
    expect(getStockLevel(0)).toBe(0);
    expect(getStockLevel('0')).toBe(0);
    expect(getStockLevel(-2)).toBe(0);
  });

  it('1–3 → pocas unidades', () => {
    expect(getStockLevel(1)).toBe(1);
    expect(getStockLevel('3')).toBe(1);
  });

  it('>3 → en stock', () => {
    expect(getStockLevel(4)).toBe(2);
    expect(getStockLevel('96642.00')).toBe(2);
  });

  it('dato no usable → undefined', () => {
    expect(getStockLevel(undefined)).toBeUndefined();
    expect(getStockLevel(null)).toBeUndefined();
    expect(getStockLevel('')).toBeUndefined();
    expect(getStockLevel('abc')).toBeUndefined();
  });
});

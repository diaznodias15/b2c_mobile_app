import { describe, expect, it } from 'vitest';

import {
  clampToAvailability,
  getAvailableUnits,
  getMaxQuantity,
  hasStockIssue,
  toAvailability,
} from './cartStock';

describe('getAvailableUnits', () => {
  it('devuelve null cuando no se conoce el stock', () => {
    expect(getAvailableUnits({})).toBeNull();
    expect(getAvailableUnits({ qty_availability: undefined })).toBeNull();
  });

  it('devuelve el stock y nunca un negativo', () => {
    expect(getAvailableUnits({ qty_availability: 7 })).toBe(7);
    expect(getAvailableUnits({ qty_availability: -3 })).toBe(0);
  });
});

describe('hasStockIssue', () => {
  it('es true solo si se pidió más de lo disponible', () => {
    expect(hasStockIssue({ qty: 5, qty_availability: 3 })).toBe(true);
    expect(hasStockIssue({ qty: 3, qty_availability: 3 })).toBe(false);
    expect(hasStockIssue({ qty: 1, qty_availability: 10 })).toBe(false);
  });

  it('sin dato de stock no bloquea', () => {
    expect(hasStockIssue({ qty: 50 })).toBe(false);
  });

  it('stock 0 con al menos una unidad en el carrito es un problema', () => {
    expect(hasStockIssue({ qty: 1, qty_availability: 0 })).toBe(true);
  });
});

describe('getMaxQuantity', () => {
  it('usa el stock cuando se conoce y el fallback cuando no', () => {
    expect(getMaxQuantity({ qty_availability: 4 }, 99)).toBe(4);
    expect(getMaxQuantity({}, 99)).toBe(99);
  });

  it('nunca baja de 1 (el stepper no admite 0)', () => {
    expect(getMaxQuantity({ qty_availability: 0 }, 99)).toBe(1);
  });
});

describe('clampToAvailability', () => {
  it('suma normal cuando alcanza el stock', () => {
    expect(clampToAvailability(2, 1, 10)).toEqual({ qty: 3, capped: false });
  });

  it('topa en el stock cuando se pasaría', () => {
    expect(clampToAvailability(9, 5, 10)).toEqual({ qty: 10, capped: true });
  });

  it('no reduce lo que ya había si ya estaba por encima del stock', () => {
    expect(clampToAvailability(12, 1, 10)).toEqual({ qty: 12, capped: true });
  });

  it('sin stock conocido no limita', () => {
    expect(clampToAvailability(2, 100, undefined)).toEqual({ qty: 102, capped: false });
    expect(clampToAvailability(2, 100, null)).toEqual({ qty: 102, capped: false });
  });
});

describe('toAvailability', () => {
  it('convierte strings y números válidos', () => {
    expect(toAvailability('12')).toBe(12);
    expect(toAvailability(7)).toBe(7);
    expect(toAvailability('0')).toBe(0);
  });

  it('devuelve undefined si no es un número usable', () => {
    expect(toAvailability(undefined)).toBeUndefined();
    expect(toAvailability(null)).toBeUndefined();
    expect(toAvailability('')).toBeUndefined();
    expect(toAvailability('abc')).toBeUndefined();
  });
});

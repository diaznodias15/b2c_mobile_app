import { describe, expect, it } from 'vitest';

import type { CartBulkLine, CartBulkResult } from '@/api/services/cart.services';

import { summarizeBulkResult } from './cartBulkResult';

const line = (over: Partial<CartBulkLine>): CartBulkLine => ({
  tx_slug: 's',
  nb_product: 'Producto',
  qty_requested: 1,
  qty_added: 1,
  status: 'ADDED',
  reason: null,
  ...over,
});
const result = (items: CartBulkLine[]): CartBulkResult => ({
  added: items.filter((i) => i.status === 'ADDED').length,
  adjusted: items.filter((i) => i.status === 'ADJUSTED').length,
  skipped: items.filter((i) => i.status === 'SKIPPED').length,
  cart_items: 5,
  items,
});

describe('summarizeBulkResult', () => {
  it('todo agregado: sin avisos', () => {
    const s = summarizeBulkResult(result([line({}), line({ tx_slug: 'b' })]));
    expect(s).toMatchObject({ anyAdded: true, hasIssues: false, title: '2 productos agregados al carrito', lines: [] });
  });

  it('un solo producto usa el singular', () => {
    expect(summarizeBulkResult(result([line({})])).title).toBe('Producto agregado al carrito');
  });

  it('lista los recortados y los omitidos con su motivo', () => {
    const s = summarizeBulkResult(
      result([
        line({ nb_product: 'A', qty_requested: 8, qty_added: 4, status: 'ADJUSTED' }),
        line({ nb_product: 'B', qty_added: 0, status: 'SKIPPED', reason: 'OUT_OF_STOCK' }),
        line({ nb_product: 'C', qty_added: 0, status: 'SKIPPED', reason: 'PRODUCT_UNAVAILABLE' }),
      ])
    );
    expect(s.hasIssues).toBe(true);
    expect(s.anyAdded).toBe(true);
    expect(s.lines).toEqual([
      'A: se agregaron 4 de 8 (por el stock disponible)',
      'B: sin stock',
      'C: no está disponible en esta sede',
    ]);
  });

  it('nada agregado', () => {
    const s = summarizeBulkResult(
      result([line({ qty_added: 0, status: 'SKIPPED', reason: 'ALREADY_MAX_IN_CART' })])
    );
    expect(s.anyAdded).toBe(false);
    expect(s.title).toBe('No se pudo agregar ningún producto');
  });
});

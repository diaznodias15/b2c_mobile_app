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
  it('todo agregado: sin avisos y con el título del doc', () => {
    const s = summarizeBulkResult(result([line({}), line({ tx_slug: 'b' })]));
    expect(s).toMatchObject({
      anyAdded: true,
      hasIssues: false,
      title: 'Productos agregados al carrito',
      detail: null,
      lines: [],
    });
  });

  it('lista los recortados y los omitidos con su motivo', () => {
    const s = summarizeBulkResult(
      result([
        line({ nb_product: 'A', qty_requested: 8, qty_added: 4, status: 'ADJUSTED' }),
        line({ nb_product: 'B', qty_added: 0, status: 'SKIPPED', reason: 'OUT_OF_STOCK' }),
        line({ nb_product: 'C', qty_added: 0, status: 'SKIPPED', reason: 'PRODUCT_UNAVAILABLE' }),
        line({ nb_product: 'D', qty_added: 0, status: 'SKIPPED', reason: 'ALREADY_MAX_IN_CART' }),
        line({ nb_product: 'E', qty_added: 0, status: 'SKIPPED', reason: 'INVALID_QUANTITY' }),
      ])
    );
    expect(s.title).toBe('Algunos productos quedaron incompletos');
    expect(s.hasIssues).toBe(true);
    expect(s.anyAdded).toBe(true);
    expect(s.lines).toEqual([
      'A: se agregaron 4 de 8 unidades',
      'B: Sin stock',
      'C: No disponible en esta sede',
      'D: Ya tienes todo lo disponible en el carrito',
      'E: Cantidad inválida en el pedido original',
    ]);
  });

  it('usa el singular cuando se pidió 1 unidad', () => {
    const s = summarizeBulkResult(result([line({ qty_requested: 1, qty_added: 0, status: 'ADJUSTED' })]));
    expect(s.lines[0]).toBe('Producto: se agregaron 0 de 1 unidad');
  });

  it('nada agregado: usa el message del backend', () => {
    const s = summarizeBulkResult(
      result([line({ qty_added: 0, status: 'SKIPPED', reason: 'ALREADY_MAX_IN_CART' })]),
      { message: 'Ninguno de los productos de la orden está disponible en esta sede.', emptyMessage: 'por defecto' }
    );
    expect(s.anyAdded).toBe(false);
    expect(s.title).toBe('No se agregó ningún producto');
    expect(s.detail).toBe('Ninguno de los productos de la orden está disponible en esta sede.');
  });

  it('nada agregado y sin message: usa el texto por defecto', () => {
    const s = summarizeBulkResult(result([]), { emptyMessage: 'Ninguno de tus favoritos está disponible en esta sede.' });
    expect(s.detail).toBe('Ninguno de tus favoritos está disponible en esta sede.');
  });

  it('si se agregó algo no hay detail', () => {
    expect(summarizeBulkResult(result([line({})]), { message: 'x', emptyMessage: 'y' }).detail).toBeNull();
  });
});

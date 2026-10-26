import { describe, expect, it } from 'vitest';

import { toMergeItems } from './cartMerge';

describe('toMergeItems', () => {
  it('mapea qty a qty_product', () => {
    expect(toMergeItems([{ tx_slug: 'a', qty: 2 }])).toEqual([{ tx_slug: 'a', qty_product: 2 }]);
  });

  it('descarta líneas sin slug, con cantidad < 1 o no entera', () => {
    expect(
      toMergeItems([
        { tx_slug: '', qty: 1 },
        { tx_slug: 'b', qty: 0 },
        { tx_slug: 'c', qty: 1.5 },
        { tx_slug: 'd', qty: NaN },
        { tx_slug: 'e', qty: 3 },
      ])
    ).toEqual([{ tx_slug: 'e', qty_product: 3 }]);
  });

  it('devuelve [] si ninguna es válida', () => {
    expect(toMergeItems([{ tx_slug: 'x', qty: -1 }])).toEqual([]);
  });
});

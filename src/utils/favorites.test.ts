import { describe, expect, it } from 'vitest';

import type { FavoriteProduct } from '@/api/services/favorites.services';

import { favoriteToProduct, isFavoriteAddable } from './favorites';

const fav = (over: Partial<FavoriteProduct> = {}): FavoriteProduct => ({
  id: 12,
  nb_product: 'Acetaminofén 500 mg',
  nb_brand: 'Genven',
  tx_slug: 'acetaminofen-500',
  is_in_branch: true,
  qty_availability: 6,
  pri_product_price: 10,
  pri_product_final_price: 11.6,
  qty_discount: 0,
  qty_tax: 16,
  tx_img_url: null,
  ...over,
});

describe('favoriteToProduct', () => {
  it('mapea los campos y deja los precios como string', () => {
    const p = favoriteToProduct(fav());
    expect(p).toMatchObject({
      id: 12,
      tx_slug: 'acetaminofen-500',
      qty_product: 6,
      pri_product_price: '10',
      pri_product_final_price: '11.6',
      cod_barcode: '',
    });
  });

  it('un producto que la sede no maneja queda sin stock', () => {
    const p = favoriteToProduct(fav({ is_in_branch: false, qty_availability: 0, pri_product_final_price: 0 }));
    expect(p.qty_product).toBe(0);
    expect(p.pri_product_final_price).toBe('0');
  });
});

describe('isFavoriteAddable', () => {
  it('requiere que la sede lo maneje y haya stock', () => {
    expect(isFavoriteAddable(fav())).toBe(true);
    expect(isFavoriteAddable(fav({ qty_availability: 0 }))).toBe(false);
    expect(isFavoriteAddable(fav({ is_in_branch: false }))).toBe(false);
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import {
  useCartStore,
  selectCartCount,
  selectItemsByBranch,
} from './cart.store';
import type { CartItem } from '@/types/cart';

const item = (over: Partial<CartItem> = {}): CartItem => ({
  tx_slug: 'a',
  product_id: 1,
  branch_id: 1,
  nb_product: 'A',
  nb_brand: 'X',
  tx_img_url: null,
  pri_product_final_price: '100',
  qty: 1,
  added_at: 0,
  ...over,
});

describe('useCartStore', () => {
  beforeEach(() => {
    useCartStore.getState().reset();
  });

  it('starts empty', () => {
    expect(useCartStore.getState().items).toEqual([]);
  });

  it('addProduct agrega item nuevo', () => {
    useCartStore.getState().addProduct(item());
    expect(useCartStore.getState().items).toHaveLength(1);
  });

  it('addProduct suma qty si ya existe (mismo slug + branch)', () => {
    useCartStore.getState().addProduct(item({ qty: 1 }));
    useCartStore.getState().addProduct(item({ qty: 2 }));
    const it = useCartStore.getState().items[0];
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(it.qty).toBe(3);
  });

  it('addProduct: items con mismo slug pero distinta branch son distintos', () => {
    useCartStore.getState().addProduct(item({ branch_id: 1 }));
    useCartStore.getState().addProduct(item({ branch_id: 2 }));
    expect(useCartStore.getState().items).toHaveLength(2);
  });

  it('updateQuantity cambia la qty', () => {
    useCartStore.getState().addProduct(item());
    useCartStore.getState().updateQuantity('a', 1, 5);
    expect(useCartStore.getState().items[0].qty).toBe(5);
  });

  it('updateQuantity: qty mínima 1 (no permite 0 o negativo)', () => {
    useCartStore.getState().addProduct(item());
    useCartStore.getState().updateQuantity('a', 1, 0);
    expect(useCartStore.getState().items[0].qty).toBe(1);
    useCartStore.getState().updateQuantity('a', 1, -3);
    expect(useCartStore.getState().items[0].qty).toBe(1);
  });

  it('removeProduct borra el item correcto', () => {
    useCartStore.getState().addProduct(item({ tx_slug: 'a' }));
    useCartStore.getState().addProduct(item({ tx_slug: 'b' }));
    useCartStore.getState().removeProduct('a', 1);
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].tx_slug).toBe('b');
  });

  it('clear vacía todo', () => {
    useCartStore.getState().addProduct(item());
    useCartStore.getState().addProduct(item({ tx_slug: 'b' }));
    useCartStore.getState().clear();
    expect(useCartStore.getState().items).toEqual([]);
  });

  it('setRemoteCart reemplaza items', () => {
    useCartStore.getState().addProduct(item());
    useCartStore.getState().setRemoteCart([item({ tx_slug: 'remote' })]);
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].tx_slug).toBe('remote');
  });
});

describe('selectCartCount', () => {
  it('suma las qty de todos los items', () => {
    const s = {
      items: [
        item({ qty: 2 }),
        item({ tx_slug: 'b', qty: 3 }),
        item({ tx_slug: 'c', qty: 1 }),
      ],
    };
    expect(selectCartCount(s)).toBe(6);
  });

  it('0 si está vacío', () => {
    expect(selectCartCount({ items: [] })).toBe(0);
  });
});

describe('selectItemsByBranch', () => {
  it('filtra por branch_id', () => {
    const s = {
      items: [
        item({ tx_slug: 'a', branch_id: 1 }),
        item({ tx_slug: 'b', branch_id: 2 }),
        item({ tx_slug: 'c', branch_id: 1 }),
      ],
    };
    expect(selectItemsByBranch(s, 1)).toHaveLength(2);
    expect(selectItemsByBranch(s, 2)).toHaveLength(1);
    expect(selectItemsByBranch(s, 99)).toHaveLength(0);
  });
});

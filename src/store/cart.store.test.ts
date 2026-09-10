import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/services/cart.services', () => ({
  addProduct: vi.fn().mockResolvedValue(undefined),
  updateQuantity: vi.fn().mockResolvedValue(undefined),
  removeProduct: vi.fn().mockResolvedValue(undefined),
  mergeLocalCart: vi.fn().mockResolvedValue(undefined),
  getCartItems: vi.fn().mockResolvedValue([]),
}));

// eslint-disable-next-line import/first
import * as cartApi from '@/api/services/cart.services';
// eslint-disable-next-line import/first
import {
  useCartStore,
  selectCartCount,
  selectItemsByBranch,
  selectCartTotal,
} from './cart.store';
// eslint-disable-next-line import/first
import type { CartItem } from '@/types/cart';

const mockedCartApi = vi.mocked(cartApi);

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
    vi.clearAllMocks();
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

  it('sin sesión (isSyncEnabled=false): las mutaciones NO llaman al backend', () => {
    useCartStore.getState().addProduct(item());
    useCartStore.getState().updateQuantity('a', 1, 3);
    useCartStore.getState().removeProduct('a', 1);
    expect(mockedCartApi.addProduct).not.toHaveBeenCalled();
    expect(mockedCartApi.updateQuantity).not.toHaveBeenCalled();
    expect(mockedCartApi.removeProduct).not.toHaveBeenCalled();
  });

  it('con sesión (isSyncEnabled=true): addProduct también sincroniza al backend', () => {
    useCartStore.getState().setSyncEnabled(true);
    useCartStore.getState().addProduct(item({ qty: 2 }));
    expect(mockedCartApi.addProduct).toHaveBeenCalledWith({
      branch_id: 1,
      tx_slug: 'a',
      qty_product: 2,
    });
  });

  it('con sesión: addProduct que suma qty a un item existente manda la qty total', () => {
    useCartStore.getState().setSyncEnabled(true);
    useCartStore.getState().addProduct(item({ qty: 1 }));
    useCartStore.getState().addProduct(item({ qty: 2 }));
    expect(mockedCartApi.addProduct).toHaveBeenLastCalledWith({
      branch_id: 1,
      tx_slug: 'a',
      qty_product: 3,
    });
  });

  it('con sesión: updateQuantity y removeProduct sincronizan al backend', () => {
    useCartStore.getState().setSyncEnabled(true);
    useCartStore.getState().addProduct(item());
    useCartStore.getState().updateQuantity('a', 1, 5);
    expect(mockedCartApi.updateQuantity).toHaveBeenCalledWith({
      branch_id: 1,
      tx_slug: 'a',
      qty_product: 5,
    });
    useCartStore.getState().removeProduct('a', 1);
    expect(mockedCartApi.removeProduct).toHaveBeenCalledWith('a', 1);
  });

  it('syncOnLogin: mergea por sede y reemplaza con la respuesta del backend', async () => {
    useCartStore.getState().addProduct(item({ tx_slug: 'a', branch_id: 1, qty: 2 }));
    useCartStore.getState().addProduct(item({ tx_slug: 'b', branch_id: 2, qty: 1 }));
    mockedCartApi.getCartItems.mockImplementation(async (branchId: number) =>
      branchId === 1
        ? [
            {
              id: 10,
              nb_brand: 'X',
              cod_barcode: '123',
              nb_product: 'A remoto',
              tx_slug: 'a',
              qty_product: 4,
              pri_product_price: '50',
              pri_product_final_price: '45',
            },
          ]
        : []
    );

    await useCartStore.getState().syncOnLogin();

    expect(mockedCartApi.mergeLocalCart).toHaveBeenCalledWith(1, [{ tx_slug: 'a', qty_product: 2 }]);
    expect(mockedCartApi.mergeLocalCart).toHaveBeenCalledWith(2, [{ tx_slug: 'b', qty_product: 1 }]);

    const items = useCartStore.getState().items;
    const branch1Item = items.find((i) => i.branch_id === 1);
    expect(branch1Item?.qty).toBe(4);
    expect(branch1Item?.nb_product).toBe('A remoto');
    // La sede 2 no tenía respuesta remota — sus items quedan vacíos tras el merge.
    expect(items.filter((i) => i.branch_id === 2)).toHaveLength(0);
  });

  it('syncOnLogin: si mergeLocalCart falla para una sede, no rompe y sigue con las demás', async () => {
    useCartStore.getState().addProduct(item({ tx_slug: 'a', branch_id: 1 }));
    mockedCartApi.mergeLocalCart.mockRejectedValueOnce(new Error('network error'));

    await expect(useCartStore.getState().syncOnLogin()).resolves.toBeUndefined();
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

describe('selectCartTotal', () => {
  it('suma qty * pri_product_final_price de todos los items', () => {
    const s = {
      items: [
        item({ pri_product_final_price: '10.00', qty: 2 }),
        item({ tx_slug: 'b', pri_product_final_price: '5.50', qty: 3 }),
      ],
    };
    // 10*2 + 5.5*3 = 20 + 16.5 = 36.5
    expect(selectCartTotal(s)).toBe(36.5);
  });

  it('0 si está vacío', () => {
    expect(selectCartTotal({ items: [] })).toBe(0);
  });
});

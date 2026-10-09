import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/services/cart.services', () => ({
  addProduct: vi.fn().mockResolvedValue(undefined),
  updateQuantity: vi.fn().mockResolvedValue(undefined),
  removeProduct: vi.fn().mockResolvedValue(undefined),
  mergeLocalCart: vi.fn().mockResolvedValue(undefined),
  getCartItems: vi.fn().mockResolvedValue([]),
  clearCart: vi.fn().mockResolvedValue(undefined),
}));

// eslint-disable-next-line import/first
import * as cartApi from '@/api/services/cart.services';
// eslint-disable-next-line import/first
import { useToastStore } from '@/store/toast.store';
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
    useToastStore.getState().hide();
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

  describe('con sesión: se espera la respuesta de la API antes de cambiar nada', () => {
    /** Promesa que se resuelve/rechaza a mano, para congelar una petición "en vuelo". */
    const deferred = () => {
      let resolve: () => void = () => {};
      let reject: (e: Error) => void = () => {};
      const promise = new Promise<never>((res, rej) => {
        resolve = () => res({} as never);
        reject = rej;
      });
      return { promise, resolve, reject };
    };
    const synced = (...items: CartItem[]) => {
      useCartStore.getState().setSyncEnabled(true);
      useCartStore.getState().setRemoteCart(items);
    };
    const flush = () => new Promise((r) => setTimeout(r, 0));
    /** Lo que devuelve el servidor tras una operación rechazada: el ítem sigue igual. */
    const serverItem = (qty: number) => ({
      id: 10,
      nb_brand: 'X',
      cod_barcode: '1',
      nb_product: 'A',
      tx_slug: 'a',
      qty_product: qty,
      pri_product_price: '100',
      pri_product_final_price: '100',
    });

    it('addProduct: no cambia nada hasta que responde la API y marca la línea como pendiente', async () => {
      synced();
      const d = deferred();
      mockedCartApi.addProduct.mockReturnValueOnce(d.promise);

      const pending = useCartStore.getState().addProduct(item({ qty: 2 }));
      expect(useCartStore.getState().items).toHaveLength(0);
      expect(useCartStore.getState().pendingKeys).toEqual(['1:a']);

      d.resolve();
      expect(await pending).toBe(true);
      expect(useCartStore.getState().items[0].qty).toBe(2);
      expect(useCartStore.getState().pendingKeys).toEqual([]);
    });

    it('addProduct a un ítem existente manda solo lo agregado (el backend SUMA)', async () => {
      // `POST /api/cart/add-product` hace `qty_product += request.qty_product`: mandar el
      // total (3) dejaba el servidor con 1 + 3 = 4 mientras la UI mostraba 3.
      synced(item({ qty: 1 }));
      expect(await useCartStore.getState().addProduct(item({ qty: 2 }))).toBe(true);
      expect(mockedCartApi.addProduct).toHaveBeenLastCalledWith({ branch_id: 1, tx_slug: 'a', qty_product: 2 });
      expect(useCartStore.getState().items[0].qty).toBe(3);
    });

    it('addProduct rechazado: no cambia el carrito, avisa con el mensaje del backend y re-lee el servidor', async () => {
      synced(item({ qty: 1 }));
      mockedCartApi.addProduct.mockRejectedValueOnce(new Error('No tenemos esa cantidad disponible en estos momentos.'));
      mockedCartApi.getCartItems.mockResolvedValueOnce([
        {
          id: 10,
          nb_brand: 'X',
          cod_barcode: '1',
          nb_product: 'A',
          tx_slug: 'a',
          qty_product: 1,
          qty_availability: 1,
          pri_product_price: '100',
          pri_product_final_price: '100',
        },
      ]);

      expect(await useCartStore.getState().addProduct(item({ qty: 3 }))).toBe(false);

      expect(useCartStore.getState().items[0].qty).toBe(1);
      expect(useToastStore.getState().message).toBe('No tenemos esa cantidad disponible en estos momentos.');
      expect(mockedCartApi.getCartItems).toHaveBeenCalledWith(1);
      // El refresh trajo el stock real: ahora la línea sabe que solo hay 1.
      expect(useCartStore.getState().items[0].qty_availability).toBe(1);
      expect(useCartStore.getState().pendingKeys).toEqual([]);
    });

    it('updateQuantity: la cantidad no cambia hasta que responde la API', async () => {
      synced(item({ qty: 1 }));
      const d = deferred();
      mockedCartApi.updateQuantity.mockReturnValueOnce(d.promise);

      const pending = useCartStore.getState().updateQuantity('a', 1, 5);
      expect(useCartStore.getState().items[0].qty).toBe(1);
      expect(useCartStore.getState().pendingKeys).toEqual(['1:a']);

      d.resolve();
      expect(await pending).toBe(true);
      expect(useCartStore.getState().items[0].qty).toBe(5);
      expect(mockedCartApi.updateQuantity).toHaveBeenCalledWith({ branch_id: 1, tx_slug: 'a', qty_product: 5 });
    });

    it('updateQuantity rechazado: conserva la cantidad y avisa', async () => {
      synced(item({ qty: 2 }));
      mockedCartApi.updateQuantity.mockRejectedValueOnce(new Error('Sin stock'));
      mockedCartApi.getCartItems.mockResolvedValueOnce([serverItem(2)]);
      expect(await useCartStore.getState().updateQuantity('a', 1, 9)).toBe(false);
      expect(useCartStore.getState().items[0].qty).toBe(2);
      expect(useToastStore.getState().message).toBe('Sin stock');
    });

    it('removeProduct: el ítem sigue hasta que responde la API', async () => {
      synced(item());
      const d = deferred();
      mockedCartApi.removeProduct.mockReturnValueOnce(d.promise);

      const pending = useCartStore.getState().removeProduct('a', 1);
      expect(useCartStore.getState().items).toHaveLength(1);
      expect(useCartStore.getState().pendingKeys).toEqual(['1:a']);

      d.resolve();
      expect(await pending).toBe(true);
      expect(useCartStore.getState().items).toHaveLength(0);
      expect(mockedCartApi.removeProduct).toHaveBeenCalledWith('a', 1);
    });

    it('removeProduct rechazado: el ítem se queda', async () => {
      synced(item());
      mockedCartApi.removeProduct.mockRejectedValueOnce(new Error('El producto no existe en el carrito.'));
      mockedCartApi.getCartItems.mockResolvedValueOnce([serverItem(1)]);
      expect(await useCartStore.getState().removeProduct('a', 1)).toBe(false);
      expect(useCartStore.getState().items).toHaveLength(1);
    });

    it('clearBranch: vacía solo esa sede, pero solo cuando responde la API', async () => {
      synced(item({ tx_slug: 'a', branch_id: 1 }), item({ tx_slug: 'b', branch_id: 1 }), item({ tx_slug: 'c', branch_id: 2 }));
      const d = deferred();
      mockedCartApi.clearCart.mockReturnValueOnce(d.promise);

      const pending = useCartStore.getState().clearBranch(1);
      expect(useCartStore.getState().items).toHaveLength(3);
      expect(useCartStore.getState().pendingKeys).toEqual(['clear:1']);

      d.resolve();
      expect(await pending).toBe(true);
      expect(useCartStore.getState().items.map((i) => i.tx_slug)).toEqual(['c']);
      expect(mockedCartApi.clearCart).toHaveBeenCalledWith(1);
    });

    it('una segunda operación sobre la MISMA línea mientras hay una en curso se ignora', async () => {
      synced(item({ qty: 1 }));
      const d = deferred();
      mockedCartApi.updateQuantity.mockReturnValueOnce(d.promise);

      const first = useCartStore.getState().updateQuantity('a', 1, 2);
      const second = await useCartStore.getState().updateQuantity('a', 1, 7);
      expect(second).toBe(false);
      expect(mockedCartApi.updateQuantity).toHaveBeenCalledTimes(1);

      d.resolve();
      await first;
      expect(useCartStore.getState().items[0].qty).toBe(2);
    });

    it('líneas distintas pueden ir en paralelo', async () => {
      synced(item({ tx_slug: 'a', qty: 1 }), item({ tx_slug: 'b', qty: 1 }));
      const da = deferred();
      const db = deferred();
      mockedCartApi.updateQuantity.mockReturnValueOnce(da.promise).mockReturnValueOnce(db.promise);

      const pa = useCartStore.getState().updateQuantity('a', 1, 2);
      const pb = useCartStore.getState().updateQuantity('b', 1, 3);
      expect(useCartStore.getState().pendingKeys).toEqual(['1:a', '1:b']);

      da.resolve();
      db.resolve();
      await Promise.all([pa, pb]);
      expect(useCartStore.getState().items.map((i) => i.qty)).toEqual([2, 3]);
      expect(useCartStore.getState().pendingKeys).toEqual([]);
    });

    it('no se re-lee el servidor mientras hay una operación en curso (evita que la UI salte hacia atrás)', async () => {
      synced(item({ qty: 1 }));
      const d = deferred();
      mockedCartApi.updateQuantity.mockReturnValueOnce(d.promise);

      const pending = useCartStore.getState().updateQuantity('a', 1, 4);
      await useCartStore.getState().refreshFromServer(1);
      expect(mockedCartApi.getCartItems).not.toHaveBeenCalled();

      d.resolve();
      await pending;
      await flush();
      await useCartStore.getState().refreshFromServer(1);
      expect(mockedCartApi.getCartItems).toHaveBeenCalledTimes(1);
    });

    it('clearBranchLocal vacía la sede sin llamar al backend (post-orden: el servidor ya lo vació)', () => {
      synced(item({ tx_slug: 'a', branch_id: 1 }), item({ tx_slug: 'c', branch_id: 2 }));
      useCartStore.getState().clearBranchLocal(1);
      expect(useCartStore.getState().items.map((i) => i.tx_slug)).toEqual(['c']);
      expect(mockedCartApi.clearCart).not.toHaveBeenCalled();
      expect(mockedCartApi.removeProduct).not.toHaveBeenCalled();
    });
  });

  describe('sin sesión: instantáneo, sin API ni estado pendiente', () => {
    it('resuelve true, aplica el cambio en el acto y no marca nada como pendiente', async () => {
      const pending = useCartStore.getState().addProduct(item({ qty: 2 }));
      expect(useCartStore.getState().items[0].qty).toBe(2);
      expect(useCartStore.getState().pendingKeys).toEqual([]);
      expect(await pending).toBe(true);
      expect(mockedCartApi.addProduct).not.toHaveBeenCalled();
    });

    it('clearBranch vacía la sede localmente', async () => {
      useCartStore.getState().setRemoteCart([item({ branch_id: 1 }), item({ tx_slug: 'c', branch_id: 2 })]);
      expect(await useCartStore.getState().clearBranch(1)).toBe(true);
      expect(useCartStore.getState().items.map((i) => i.tx_slug)).toEqual(['c']);
      expect(mockedCartApi.clearCart).not.toHaveBeenCalled();
    });
  });

  describe('stock', () => {
    it('addProduct no pasa del stock disponible y avisa con un toast', async () => {
      useCartStore.getState().setSyncEnabled(true);
      await useCartStore.getState().addProduct(item({ qty: 2, qty_availability: 3 }));
      await useCartStore.getState().addProduct(item({ qty: 2, qty_availability: 3 }));
      expect(useCartStore.getState().items[0].qty).toBe(3);
      expect(useToastStore.getState().message).toContain('Solo hay 3 unidades');
      // Al servidor solo se mandó lo realmente agregado: 2 y luego 1.
      expect(mockedCartApi.addProduct).toHaveBeenNthCalledWith(1, { branch_id: 1, tx_slug: 'a', qty_product: 2 });
      expect(mockedCartApi.addProduct).toHaveBeenNthCalledWith(2, { branch_id: 1, tx_slug: 'a', qty_product: 1 });
    });

    it('addProduct en el tope no cambia nada ni llama al backend', async () => {
      useCartStore.getState().setSyncEnabled(true);
      await useCartStore.getState().addProduct(item({ qty: 3, qty_availability: 3 }));
      mockedCartApi.addProduct.mockClear();
      expect(await useCartStore.getState().addProduct(item({ qty: 1, qty_availability: 3 }))).toBe(false);
      expect(useCartStore.getState().items[0].qty).toBe(3);
      expect(mockedCartApi.addProduct).not.toHaveBeenCalled();
    });

    it('updateQuantity no deja subir por encima del stock, pero sí bajar', async () => {
      useCartStore.getState().setSyncEnabled(true);
      useCartStore.getState().setRemoteCart([item({ qty: 5, qty_availability: 3 })]);
      expect(await useCartStore.getState().updateQuantity('a', 1, 6)).toBe(false);
      expect(useCartStore.getState().items[0].qty).toBe(5);
      expect(mockedCartApi.updateQuantity).not.toHaveBeenCalled();
      expect(await useCartStore.getState().updateQuantity('a', 1, 4)).toBe(true);
      expect(useCartStore.getState().items[0].qty).toBe(4);
      expect(mockedCartApi.updateQuantity).toHaveBeenCalledWith({ branch_id: 1, tx_slug: 'a', qty_product: 4 });
    });

    it('sin dato de stock no limita (carritos viejos)', () => {
      useCartStore.getState().addProduct(item({ qty: 50 }));
      expect(useCartStore.getState().items[0].qty).toBe(50);
    });
  });

  describe('refreshFromServer', () => {
    const remote = (over = {}) => ({
      id: 10,
      nb_brand: 'X',
      cod_barcode: '123',
      nb_product: 'A remoto',
      tx_slug: 'a',
      qty_product: 4,
      qty_availability: 6,
      pri_product_price: '50',
      pri_product_final_price: '45',
      ...over,
    });

    it('reemplaza los ítems de la sede (con su stock) y conserva los de otras sedes', async () => {
      useCartStore.getState().setSyncEnabled(true);
      useCartStore.getState().setRemoteCart([
        item({ tx_slug: 'a', branch_id: 1, qty: 1 }),
        item({ tx_slug: 'z', branch_id: 2, qty: 7 }),
      ]);
      mockedCartApi.getCartItems.mockResolvedValueOnce([remote()]);

      await useCartStore.getState().refreshFromServer(1);

      const items = useCartStore.getState().items;
      const mine = items.find((i) => i.branch_id === 1);
      expect(mine?.qty).toBe(4);
      expect(mine?.qty_availability).toBe(6);
      expect(mine?.nb_product).toBe('A remoto');
      expect(items.find((i) => i.branch_id === 2)?.qty).toBe(7);
    });

    it('sin sesión no pide nada al servidor', async () => {
      useCartStore.getState().addProduct(item());
      await useCartStore.getState().refreshFromServer(1);
      expect(mockedCartApi.getCartItems).not.toHaveBeenCalled();
      expect(useCartStore.getState().items).toHaveLength(1);
    });

    it('si falla la red conserva el carrito local', async () => {
      useCartStore.getState().setSyncEnabled(true);
      useCartStore.getState().setRemoteCart([item({ qty: 2 })]);
      mockedCartApi.getCartItems.mockRejectedValueOnce(new Error('sin red'));
      await useCartStore.getState().refreshFromServer(1);
      expect(useCartStore.getState().items[0].qty).toBe(2);
    });
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

  it('syncOnLogin: bloquea refreshFromServer mientras corre y libera al terminar', async () => {
    useCartStore.getState().addProduct(item({ tx_slug: 'a', branch_id: 1, qty: 2 }));
    useCartStore.getState().setSyncEnabled(true);
    let releaseMerge: () => void = () => {};
    mockedCartApi.mergeLocalCart.mockImplementation(
      () => new Promise((resolve) => { releaseMerge = () => resolve({} as never); })
    );
    mockedCartApi.getCartItems.mockClear();

    const sync = useCartStore.getState().syncOnLogin();
    expect(useCartStore.getState().isSyncingLogin).toBe(true);

    // Un refresh en pleno merge leería el servidor vacío y borraría el carrito local.
    await useCartStore.getState().refreshFromServer(1);
    expect(mockedCartApi.getCartItems).not.toHaveBeenCalled();
    expect(useCartStore.getState().items).toHaveLength(1);

    releaseMerge();
    await sync;
    expect(useCartStore.getState().isSyncingLogin).toBe(false);
    expect(mockedCartApi.getCartItems).toHaveBeenCalledTimes(1);
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

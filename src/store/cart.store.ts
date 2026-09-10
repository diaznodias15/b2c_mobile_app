import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import * as cartApi from '@/api/services/cart.services';
import type { CartItemFromBackend } from '@/api/services/cart.services';
import type { CartItem } from '@/types/cart';

/**
 * Carrito OFFLINE-FIRST, con sync opcional al backend.
 *
 *  - Sin sesión: vive en Zustand+AsyncStorage, no requiere token —
 *    igual que antes.
 *  - Con sesión (`isSyncEnabled`, lo prende/apaga `useUserStore` en
 *    `signIn`/`signOut`/`rehydrateAuth`): cada mutación (`addProduct`,
 *    `updateQuantity`, `removeProduct`) además dispara la llamada
 *    equivalente en `/api/cart/*` — fire-and-forget, sin rollback si
 *    falla (mismo criterio que la web: solo se loguea, no se bloquea
 *    la UI, ver CHECKOUT-API.md §4.3).
 *  - `syncOnLogin()` sube el carrito local a la nube (`mergeLocalCart`,
 *    por sede) justo después de loguearse, y reemplaza el estado local
 *    de cada sede con la versión autoritativa que devuelve el backend
 *    — una vez hay sesión, el backend es la fuente de verdad
 *    (CHECKOUT-API.md §12.7).
 *  - `reset` vacía todo (post-orden).
 *
 * `cart.store` NO importa `user.store` (evita el ciclo user→cart→user):
 * es `user.store` quien conoce `isAuthenticated` y llama
 * `setSyncEnabled`/`syncOnLogin` desde `signIn`/`signOut`/`rehydrateAuth`.
 */

type CartState = {
  items: CartItem[];
  isSyncEnabled: boolean;

  addProduct: (item: Omit<CartItem, 'added_at'>) => void;
  updateQuantity: (tx_slug: string, branch_id: number, qty: number) => void;
  removeProduct: (tx_slug: string, branch_id: number) => void;
  clear: () => void;
  setRemoteCart: (items: CartItem[]) => void;
  setSyncEnabled: (enabled: boolean) => void;
  syncOnLogin: () => Promise<void>;
  reset: () => void;
};

const initialState: Pick<CartState, 'items' | 'isSyncEnabled'> = {
  items: [],
  isSyncEnabled: false,
};

function mapBackendItem(branchId: number, item: CartItemFromBackend): CartItem {
  return {
    tx_slug: item.tx_slug,
    product_id: item.id,
    branch_id: branchId,
    nb_product: item.nb_product,
    nb_brand: item.nb_brand,
    tx_img_url: item.tx_img_url,
    pri_product_final_price: item.pri_product_final_price,
    pri_product_price: item.pri_product_price,
    qty_discount: item.qty_discount,
    qty_tax: item.qty_tax,
    qty: Number(item.qty_product) || 1,
    added_at: Date.now(),
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      ...initialState,
      addProduct: (item) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.tx_slug === item.tx_slug && i.branch_id === item.branch_id
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.tx_slug === item.tx_slug && i.branch_id === item.branch_id
                  ? { ...i, qty: i.qty + item.qty, added_at: Date.now() }
                  : i
              ),
            };
          }
          return {
            items: [
              ...state.items,
              { ...item, added_at: Date.now() },
            ],
          };
        });
        if (get().isSyncEnabled) {
          const updated = get().items.find(
            (i) => i.tx_slug === item.tx_slug && i.branch_id === item.branch_id
          );
          cartApi
            .addProduct({
              branch_id: item.branch_id,
              tx_slug: item.tx_slug,
              qty_product: updated?.qty ?? item.qty,
            })
            .catch((err) => console.warn('[cart.store] addProduct backend sync failed:', err));
        }
      },
      updateQuantity: (tx_slug, branch_id, qty) => {
        const safeQty = Math.max(1, qty);
        set((state) => ({
          items: state.items.map((i) =>
            i.tx_slug === tx_slug && i.branch_id === branch_id ? { ...i, qty: safeQty } : i
          ),
        }));
        if (get().isSyncEnabled) {
          cartApi
            .updateQuantity({ branch_id, tx_slug, qty_product: safeQty })
            .catch((err) => console.warn('[cart.store] updateQuantity backend sync failed:', err));
        }
      },
      removeProduct: (tx_slug, branch_id) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.tx_slug === tx_slug && i.branch_id === branch_id)
          ),
        }));
        if (get().isSyncEnabled) {
          cartApi
            .removeProduct(tx_slug, branch_id)
            .catch((err) => console.warn('[cart.store] removeProduct backend sync failed:', err));
        }
      },
      clear: () => set({ items: [] }),
      setRemoteCart: (items) => set({ items }),
      setSyncEnabled: (enabled) => set({ isSyncEnabled: enabled }),
      syncOnLogin: async () => {
        const localItems = get().items;
        const branchIds = [...new Set(localItems.map((i) => i.branch_id))];
        for (const branchId of branchIds) {
          const itemsForBranch = localItems.filter((i) => i.branch_id === branchId);
          try {
            await cartApi.mergeLocalCart(
              branchId,
              itemsForBranch.map((i) => ({ tx_slug: i.tx_slug, qty_product: i.qty }))
            );
            const remoteItems = await cartApi.getCartItems(branchId);
            const otherBranchesItems = get().items.filter((i) => i.branch_id !== branchId);
            set({
              items: [...otherBranchesItems, ...remoteItems.map((item) => mapBackendItem(branchId, item))],
            });
          } catch (err) {
            console.warn(`[cart.store] No se pudo sincronizar el carrito de la sede ${branchId}:`, err);
          }
        }
      },
      reset: () => set(initialState),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // `isSyncEnabled` no se persiste: cada boot arranca en `false`
      // hasta que `rehydrateAuth`/`signIn` de `user.store` lo confirme.
      partialize: (state) => ({ items: state.items }),
    }
  )
);

/* ============================================================
 * Selectors / helpers (pure, no Zustand hooks)
 * ============================================================ */

/** Cantidad total de items (suma de qty, no de líneas). */
export function selectCartCount(s: { items: CartItem[] }): number {
  return s.items.reduce((acc, it) => acc + it.qty, 0);
}

/** Items del carrito de una sede específica. */
export function selectItemsByBranch(
  s: { items: CartItem[] },
  branchId: number
): CartItem[] {
  return s.items.filter((i) => i.branch_id === branchId);
}

/** Total del carrito en Bs. (base), suma de `qty * pri_product_final_price`. */
export function selectCartTotal(s: { items: CartItem[] }): number {
  return s.items.reduce(
    (acc, it) => acc + it.qty * Number(it.pri_product_final_price),
    0
  );
}

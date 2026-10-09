import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import * as cartApi from '@/api/services/cart.services';
import type { CartItemFromBackend } from '@/api/services/cart.services';
import { useToastStore } from '@/store/toast.store';
import type { CartItem } from '@/types/cart';
import { clampToAvailability, getAvailableUnits } from '@/utils/cartStock';

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
 * EL BACKEND ARMA LA ORDEN CON EL CARRITO DEL SERVIDOR (`OrderController`:
 * `ShoppingCartItem` del usuario + sede), no con los `products` del payload. Por
 * eso, con sesión, el carrito local tiene que ser un espejo fiel del remoto:
 *  - `add-product` SUMA `qty_product` a lo que ya hay → se manda lo agregado
 *    (delta), no el total nuevo (antes se mandaba el total y el servidor
 *    terminaba con más unidades que las mostradas).
 *  - Si una operación falla (ej. sin stock), se avisa con un toast y se vuelve
 *    a leer el carrito del servidor para no dejar la UI desfasada.
 *  - `refreshFromServer` repone precios, stock y cantidades al entrar al
 *    carrito/checkout, al cambiar de sede y con pull-to-refresh.
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
  /** Reemplaza los ítems de la sede por los del servidor (solo con sesión). */
  refreshFromServer: (branchId: number) => Promise<void>;
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
    qty_availability: typeof item.qty_availability === 'number' ? item.qty_availability : undefined,
    added_at: Date.now(),
  };
}

/**
 * Operaciones al backend en vuelo. Mientras haya alguna no se re-lee el carrito
 * remoto: la respuesta traería la cantidad vieja y la UI "saltaría" hacia atrás.
 */
let pendingSyncs = 0;
/** Una operación falló: re-leer el carrito en cuanto no quede ninguna en vuelo. */
let needsRefresh = false;

async function syncWithServer(
  request: Promise<unknown>,
  branchId: number,
  refresh: (branchId: number) => Promise<void>
): Promise<void> {
  pendingSyncs += 1;
  try {
    await request;
  } catch (err) {
    needsRefresh = true;
    console.warn('[cart.store] la operación con el backend falló:', err);
    useToastStore
      .getState()
      .show(err instanceof Error && err.message ? err.message : 'No se pudo actualizar el carrito.');
  } finally {
    pendingSyncs -= 1;
  }
  if (needsRefresh && pendingSyncs === 0) {
    needsRefresh = false;
    await refresh(branchId);
  }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      ...initialState,
      addProduct: (item) => {
        const existing = get().items.find(
          (i) => i.tx_slug === item.tx_slug && i.branch_id === item.branch_id
        );
        const availability = item.qty_availability ?? existing?.qty_availability;
        const { qty, capped } = clampToAvailability(existing?.qty ?? 0, item.qty, availability);
        if (capped) {
          useToastStore
            .getState()
            .show(`Solo hay ${availability} unidades disponibles de este producto.`);
          // Ya estaba en el tope: no hay nada que agregar ni que sincronizar.
          if (existing && qty === existing.qty) return;
        }
        // Unidades realmente agregadas (puede ser menos que `item.qty` si se topó).
        const added = qty - (existing?.qty ?? 0);

        set((state) => ({
          items: existing
            ? state.items.map((i) =>
                i.tx_slug === item.tx_slug && i.branch_id === item.branch_id
                  ? {
                      ...i,
                      qty,
                      qty_availability: availability ?? i.qty_availability,
                      added_at: Date.now(),
                    }
                  : i
              )
            : [...state.items, { ...item, qty, added_at: Date.now() }],
        }));

        if (get().isSyncEnabled && added > 0) {
          void syncWithServer(
            // `add-product` SUMA al ítem del servidor: se manda lo agregado, no el total.
            cartApi.addProduct({
              branch_id: item.branch_id,
              tx_slug: item.tx_slug,
              qty_product: added,
            }),
            item.branch_id,
            get().refreshFromServer
          );
        }
      },
      updateQuantity: (tx_slug, branch_id, qty) => {
        const current = get().items.find((i) => i.tx_slug === tx_slug && i.branch_id === branch_id);
        const available = current ? getAvailableUnits(current) : null;
        // Subir por encima del stock no se permite; bajar siempre (aunque siga
        // pasado, para que el cliente pueda ir corrigiendo hasta el tope).
        if (current && available !== null && qty > available && qty > current.qty) {
          useToastStore.getState().show(`Solo hay ${available} unidades disponibles de este producto.`);
          return;
        }
        const safeQty = Math.max(1, qty);
        set((state) => ({
          items: state.items.map((i) =>
            i.tx_slug === tx_slug && i.branch_id === branch_id ? { ...i, qty: safeQty } : i
          ),
        }));
        if (get().isSyncEnabled) {
          void syncWithServer(
            cartApi.updateQuantity({ branch_id, tx_slug, qty_product: safeQty }),
            branch_id,
            get().refreshFromServer
          );
        }
      },
      removeProduct: (tx_slug, branch_id) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.tx_slug === tx_slug && i.branch_id === branch_id)
          ),
        }));
        if (get().isSyncEnabled) {
          void syncWithServer(
            cartApi.removeProduct(tx_slug, branch_id),
            branch_id,
            get().refreshFromServer
          );
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
      refreshFromServer: async (branchId) => {
        if (!get().isSyncEnabled || pendingSyncs > 0) return;
        try {
          const remoteItems = await cartApi.getCartItems(branchId);
          // Si arrancó una operación mientras se pedía, la respuesta ya está vieja.
          if (pendingSyncs > 0) return;
          set((state) => ({
            items: [
              ...state.items.filter((i) => i.branch_id !== branchId),
              ...remoteItems.map((item) => mapBackendItem(branchId, item)),
            ],
          }));
        } catch (err) {
          // Sin red o 401: se conserva lo local (el 401 lo maneja el listener global).
          console.warn(`[cart.store] no se pudo refrescar el carrito de la sede ${branchId}:`, err);
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

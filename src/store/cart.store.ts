import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import * as cartApi from '@/api/services/cart.services';
import type { CartItemFromBackend } from '@/api/services/cart.services';
import { useToastStore } from '@/store/toast.store';
import type { CartItem } from '@/types/cart';
import { clampToAvailability, getAvailableUnits } from '@/utils/cartStock';

/**
 * Carrito con dos modos:
 *
 *  - SIN sesión: vive en Zustand+AsyncStorage, no requiere token. Los cambios
 *    se aplican al instante (no hay API de por medio).
 *  - CON sesión (`isSyncEnabled`, lo prende/apaga `useUserStore` en
 *    `signIn`/`signOut`/`rehydrateAuth`): **se espera la respuesta de la API
 *    antes de cambiar nada**. Cada acción devuelve `Promise<boolean>`: `true` si
 *    se aplicó, `false` si el servidor la rechazó (se avisa con un toast con el
 *    mensaje del backend) o si ya había una operación en esa línea. La UI usa
 *    `pendingKeys` para mostrar un loader y bloquear los botones de esa línea.
 *    Es el comportamiento de la web (spinner mientras actualiza) y evita que las
 *    cantidades locales se desfasen del servidor.
 *  - `syncOnLogin()` sube el carrito local a la nube (`mergeLocalCart`, por
 *    sede) justo después de loguearse y reemplaza el estado local de cada sede
 *    con la versión autoritativa del backend (CHECKOUT-API.md §12.7).
 *  - `reset` vacía todo.
 *
 * EL BACKEND ARMA LA ORDEN CON EL CARRITO DEL SERVIDOR (`OrderController`:
 * `ShoppingCartItem` del usuario + sede), no con los `products` del payload, y
 * lo VACÍA al crear la orden. Por eso:
 *  - `add-product` SUMA `qty_product` a lo que ya hay → se manda lo agregado
 *    (delta), no el total nuevo.
 *  - Tras crear una orden se vacía SOLO lo local (`clearBranchLocal`): llamar a
 *    `remove-product` sobre ítems que el backend ya borró daría errores.
 *  - `refreshFromServer` repone precios, stock y cantidades al entrar al
 *    carrito/checkout, al cambiar de sede, con pull-to-refresh y tras una
 *    operación rechazada (el stock pudo haber cambiado).
 *
 * `cart.store` NO importa `user.store` (evita el ciclo user→cart→user):
 * es `user.store` quien conoce `isAuthenticated` y llama
 * `setSyncEnabled`/`syncOnLogin` desde `signIn`/`signOut`/`rehydrateAuth`.
 */

type CartState = {
  items: CartItem[];
  isSyncEnabled: boolean;
  /** `true` mientras `syncOnLogin` sube el carrito local y baja el del servidor. */
  isSyncingLogin: boolean;
  /**
   * Operaciones al servidor en curso: `cartLineKey(sede, slug)` por línea y
   * `cartClearKey(sede)` para "vaciar carrito". Solo en memoria (no se persiste).
   */
  pendingKeys: string[];

  addProduct: (item: Omit<CartItem, 'added_at'>) => Promise<boolean>;
  updateQuantity: (tx_slug: string, branch_id: number, qty: number) => Promise<boolean>;
  removeProduct: (tx_slug: string, branch_id: number) => Promise<boolean>;
  /** Vacía el carrito de la sede: con sesión espera a `DELETE /cart/clear`. */
  clearBranch: (branchId: number) => Promise<boolean>;
  /** Vacía la sede SOLO en local (post-orden: el backend ya vació su carrito). */
  clearBranchLocal: (branchId: number) => void;
  clear: () => void;
  setRemoteCart: (items: CartItem[]) => void;
  setSyncEnabled: (enabled: boolean) => void;
  syncOnLogin: () => Promise<void>;
  /** Reemplaza los ítems de la sede por los del servidor (solo con sesión). */
  refreshFromServer: (branchId: number) => Promise<void>;
  reset: () => void;
};

const initialState: Pick<
  CartState,
  'items' | 'isSyncEnabled' | 'isSyncingLogin' | 'pendingKeys'
> = {
  items: [],
  isSyncEnabled: false,
  isSyncingLogin: false,
  pendingKeys: [],
};

/** Clave de una línea del carrito en `pendingKeys`. */
export const cartLineKey = (branchId: number, slug: string): string => `${branchId}:${slug}`;
/** Clave de "vaciar carrito" de una sede en `pendingKeys`. */
export const cartClearKey = (branchId: number): string => `clear:${branchId}`;

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
 * remoto: la respuesta traería datos viejos y la UI "saltaría" hacia atrás.
 */
let pendingSyncs = 0;

const isSameLine = (i: CartItem, slug: string, branchId: number): boolean =>
  i.tx_slug === slug && i.branch_id === branchId;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => {
      /**
       * Ejecuta una operación contra el backend marcando `key` como pendiente
       * (loader + botones bloqueados en esa línea). Devuelve `true` si el
       * servidor la aceptó. Si falla: toast con el mensaje del backend y se
       * re-lee el carrito (puede que el stock haya cambiado). Si ya hay una
       * operación en esa misma línea, no hace nada y devuelve `false`.
       */
      const runOnServer = async (
        key: string,
        branchId: number,
        request: () => Promise<unknown>
      ): Promise<boolean> => {
        if (get().pendingKeys.includes(key)) return false;
        pendingSyncs += 1;
        set((state) => ({ pendingKeys: [...state.pendingKeys, key] }));
        let ok = false;
        try {
          await request();
          ok = true;
        } catch (err) {
          console.warn('[cart.store] la operación con el backend falló:', err);
          useToastStore
            .getState()
            .show(err instanceof Error && err.message ? err.message : 'No se pudo actualizar el carrito.');
        } finally {
          pendingSyncs -= 1;
          set((state) => ({ pendingKeys: state.pendingKeys.filter((k) => k !== key) }));
        }
        if (!ok) await get().refreshFromServer(branchId);
        return ok;
      };

      return {
        ...initialState,

        addProduct: async (item) => {
          const key = cartLineKey(item.branch_id, item.tx_slug);
          if (get().pendingKeys.includes(key)) return false;

          const existing = get().items.find((i) => isSameLine(i, item.tx_slug, item.branch_id));
          const availability = item.qty_availability ?? existing?.qty_availability;
          const { qty, capped } = clampToAvailability(existing?.qty ?? 0, item.qty, availability);
          if (capped) {
            useToastStore
              .getState()
              .show(`Solo hay ${availability} unidades disponibles de este producto.`);
            // Ya estaba en el tope: no hay nada que agregar.
            if (existing && qty === existing.qty) return false;
          }
          // Unidades realmente agregadas (puede ser menos que `item.qty` si se topó).
          const added = qty - (existing?.qty ?? 0);

          const applyLocal = () =>
            set((state) => {
              const current = state.items.find((i) => isSameLine(i, item.tx_slug, item.branch_id));
              return {
                items: current
                  ? state.items.map((i) =>
                      i === current
                        ? {
                            ...i,
                            qty: i.qty + added,
                            qty_availability: availability ?? i.qty_availability,
                            added_at: Date.now(),
                          }
                        : i
                    )
                  : [...state.items, { ...item, qty: added, added_at: Date.now() }],
              };
            });

          if (!get().isSyncEnabled) {
            applyLocal();
            return true;
          }
          const ok = await runOnServer(key, item.branch_id, () =>
            // `add-product` SUMA al ítem del servidor: se manda lo agregado, no el total.
            cartApi.addProduct({ branch_id: item.branch_id, tx_slug: item.tx_slug, qty_product: added })
          );
          if (ok) applyLocal();
          return ok;
        },

        updateQuantity: async (tx_slug, branch_id, qty) => {
          const key = cartLineKey(branch_id, tx_slug);
          if (get().pendingKeys.includes(key)) return false;

          const current = get().items.find((i) => isSameLine(i, tx_slug, branch_id));
          const available = current ? getAvailableUnits(current) : null;
          // Subir por encima del stock no se permite; bajar siempre (aunque siga
          // pasado, para que el cliente pueda ir corrigiendo hasta el tope).
          if (current && available !== null && qty > available && qty > current.qty) {
            useToastStore.getState().show(`Solo hay ${available} unidades disponibles de este producto.`);
            return false;
          }
          const safeQty = Math.max(1, qty);
          const applyLocal = () =>
            set((state) => ({
              items: state.items.map((i) => (isSameLine(i, tx_slug, branch_id) ? { ...i, qty: safeQty } : i)),
            }));

          if (!get().isSyncEnabled) {
            applyLocal();
            return true;
          }
          const ok = await runOnServer(key, branch_id, () =>
            cartApi.updateQuantity({ branch_id, tx_slug, qty_product: safeQty })
          );
          if (ok) applyLocal();
          return ok;
        },

        removeProduct: async (tx_slug, branch_id) => {
          const key = cartLineKey(branch_id, tx_slug);
          if (get().pendingKeys.includes(key)) return false;

          const applyLocal = () =>
            set((state) => ({ items: state.items.filter((i) => !isSameLine(i, tx_slug, branch_id)) }));

          if (!get().isSyncEnabled) {
            applyLocal();
            return true;
          }
          const ok = await runOnServer(key, branch_id, () => cartApi.removeProduct(tx_slug, branch_id));
          if (ok) applyLocal();
          return ok;
        },

        clearBranch: async (branchId) => {
          const applyLocal = () =>
            set((state) => ({ items: state.items.filter((i) => i.branch_id !== branchId) }));

          if (!get().isSyncEnabled) {
            applyLocal();
            return true;
          }
          const ok = await runOnServer(cartClearKey(branchId), branchId, () => cartApi.clearCart(branchId));
          if (ok) applyLocal();
          return ok;
        },

        clearBranchLocal: (branchId) =>
          set((state) => ({ items: state.items.filter((i) => i.branch_id !== branchId) })),
        clear: () => set({ items: [] }),
        setRemoteCart: (items) => set({ items }),
        setSyncEnabled: (enabled) => set({ isSyncEnabled: enabled }),

        syncOnLogin: async () => {
          const localItems = get().items;
          const branchIds = [...new Set(localItems.map((i) => i.branch_id))];
          // Mientras sube/baja el carrito no se permite otro `refreshFromServer`: leería el
          // servidor a medio merge (vacío) y borraría el carrito local.
          pendingSyncs += 1;
          set({ isSyncingLogin: true });
          try {
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
          } finally {
            pendingSyncs -= 1;
            set({ isSyncingLogin: false });
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
      };
    },
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // `isSyncEnabled` y `pendingKeys` no se persisten: cada boot arranca en
      // `false`/`[]` hasta que `rehydrateAuth`/`signIn` de `user.store` lo confirme.
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

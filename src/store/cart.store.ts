import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CartItem } from '@/types/cart';

/**
 * Carrito OFFLINE-FIRST.
 *
 *  - Vive en Zustand+AsyncStorage, no requiere token.
 *  - Items se identifican por (tx_slug, branch_id) → clave única.
 *  - `addProduct` soporta qty: si el item ya existe, suma la cantidad.
 *  - `setRemoteCart` reemplaza el estado con lo que viene del backend
 *    (usado en boot cuando hay token, o después de un merge).
 *  - `reset` vacía todo (post-orden).
 *
 * La sincronización con el backend vive en `useCartSync` (Fase 4A) y
 * se hace DESPUÉS de modificar el store local. El cart local es la
 * fuente de verdad para la UI.
 */

type CartState = {
  items: CartItem[];

  addProduct: (item: Omit<CartItem, 'added_at'>) => void;
  updateQuantity: (tx_slug: string, branch_id: number, qty: number) => void;
  removeProduct: (tx_slug: string, branch_id: number) => void;
  clear: () => void;
  setRemoteCart: (items: CartItem[]) => void;
  reset: () => void;
};

const initialState: Pick<CartState, 'items'> = {
  items: [],
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      ...initialState,
      addProduct: (item) =>
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
        }),
      updateQuantity: (tx_slug, branch_id, qty) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              i.tx_slug === tx_slug && i.branch_id === branch_id
                ? { ...i, qty: Math.max(1, qty) }
                : i
            ),
        })),
      removeProduct: (tx_slug, branch_id) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.tx_slug === tx_slug && i.branch_id === branch_id)
          ),
        })),
      clear: () => set({ items: [] }),
      setRemoteCart: (items) => set({ items }),
      reset: () => set(initialState),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
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

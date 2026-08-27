import { useCallback } from 'react';

import {
  addProduct as apiAdd,
  removeProduct as apiRemove,
  updateQuantity as apiUpdate,
} from '@/api/services/cart.services';
import { useCartStore } from '@/store/cart.store';
import { useUserStore } from '@/store/user.store';
import { useBranchStore } from '@/store/branch.store';
import type { CartItem } from '@/types/cart';

/**
 * Wrapper sobre `useCartStore` que sincroniza cada cambio con el
 * backend cuando hay token.
 *
 * Si no hay auth o no hay branch, las operaciones son 100% locales
 * (igual que en la web: offline-first).
 *
 * Si el sync al backend falla, se loguea en dev y se sigue. El cart
 * local es la fuente de verdad para la UI.
 */
export function useCartSync() {
  const isAuth = useUserStore((s) => s.isAuthenticated);
  const branchId = useBranchStore((s) => s.selectedBranch?.value);

  const addProduct = useCallback(
    (item: Omit<CartItem, 'added_at'>) => {
      useCartStore.getState().addProduct(item);
      if (isAuth && branchId) {
        apiAdd({
          branch_id: branchId,
          tx_slug: item.tx_slug,
          qty_product: item.qty,
        }).catch((err) => {
          if (__DEV__) console.warn('[cartSync] add failed', err);
        });
      }
    },
    [isAuth, branchId]
  );

  const updateQuantity = useCallback(
    (slug: string, qty: number) => {
      if (!branchId) return;
      useCartStore.getState().updateQuantity(slug, branchId, qty);
      if (isAuth) {
        apiUpdate({
          branch_id: branchId,
          tx_slug: slug,
          qty_product: qty,
        }).catch((err) => {
          if (__DEV__) console.warn('[cartSync] update failed', err);
        });
      }
    },
    [isAuth, branchId]
  );

  const removeProduct = useCallback(
    (slug: string) => {
      if (!branchId) return;
      useCartStore.getState().removeProduct(slug, branchId);
      if (isAuth) {
        apiRemove(slug, branchId).catch((err) => {
          if (__DEV__) console.warn('[cartSync] remove failed', err);
        });
      }
    },
    [isAuth, branchId]
  );

  const clear = useCallback(() => {
    if (!branchId) return;
    useCartStore.getState().clear();
    if (isAuth) {
      import('@/api/services/cart.services').then(({ clearCart }) => {
        clearCart(branchId).catch((err) => {
          if (__DEV__) console.warn('[cartSync] clear failed', err);
        });
      });
    }
  }, [isAuth, branchId]);

  return { addProduct, updateQuantity, removeProduct, clear };
}

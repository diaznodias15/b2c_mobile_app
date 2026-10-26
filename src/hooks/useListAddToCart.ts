import { useCallback } from 'react';

import { selectEffectiveBranchId, useBranchStore } from '@/store/branch.store';
import { useCartStore } from '@/store/cart.store';
import { useToastStore } from '@/store/toast.store';
import type { Product } from '@/types/whitelabel';
import { toAvailability } from '@/utils/cartStock';

/**
 * `onAddToCart` estable para listas de `ProductListItem`
 * (Buscar y listado por departamento). `useCallback` no es cosmético: las
 * filas están memoizadas y reciben estas funciones como props, así que si
 * cambiaran de referencia en cada render de la pantalla se re-renderizarían
 * todas las filas visibles.
 */
export function useListAddToCart(): (product: Product) => Promise<boolean> {
  const branchId = useBranchStore(selectEffectiveBranchId);
  const addProduct = useCartStore((s) => s.addProduct);
  const showToast = useToastStore((s) => s.show);

  return useCallback(
    async (product: Product): Promise<boolean> => {
      if (branchId === null) return false;
      const added = await addProduct({
        tx_slug: product.tx_slug,
        product_id: product.id,
        branch_id: branchId,
        nb_product: product.nb_product,
        nb_brand: product.nb_brand,
        tx_img_url: product.tx_img_url,
        tx_variant_label: product.tx_variant_label,
        pri_product_final_price: product.pri_product_final_price,
        pri_product_price: product.pri_product_price,
        qty_discount: product.qty_discount,
        qty_tax: product.qty_tax,
        qty_availability: toAvailability(product.qty_product),
        qty: 1,
      });
      // Con sesión `added` es la respuesta de la API: el toast y la animación solo
      // salen si el servidor aceptó el cambio (si no, `addProduct` ya avisó el motivo).
      if (added) showToast('Producto agregado al carrito');
      return added;
    },
    [branchId, addProduct, showToast]
  );
}

import type { CartBulkReason, CartBulkResult } from '@/api/services/cart.services';

const REASON_TEXT: Record<CartBulkReason, string> = {
  PRODUCT_UNAVAILABLE: 'no está disponible en esta sede',
  OUT_OF_STOCK: 'sin stock',
  ALREADY_MAX_IN_CART: 'ya tienes todo lo disponible en el carrito',
  INVALID_QUANTITY: 'cantidad no válida',
};

export type BulkSummary = {
  /** Se agregó al menos un producto. */
  anyAdded: boolean;
  /** Hubo productos recortados u omitidos: conviene avisar con detalle. */
  hasIssues: boolean;
  title: string;
  /** Una línea por producto incompleto, con su motivo. */
  lines: string[];
};

/**
 * Resume la respuesta de "repetir pedido" / "agregar todos los favoritos" (mismo formato): qué
 * se agregó y qué quedó incompleto o fuera, con el motivo, para mostrárselo al cliente.
 */
export function summarizeBulkResult(result: CartBulkResult): BulkSummary {
  const lines = (result.items ?? [])
    .filter((l) => l.status !== 'ADDED')
    .map((l) =>
      l.status === 'ADJUSTED'
        ? `${l.nb_product}: se agregaron ${l.qty_added} de ${l.qty_requested} (por el stock disponible)`
        : `${l.nb_product}: ${(l.reason && REASON_TEXT[l.reason]) || 'no se pudo agregar'}`
    );

  const anyAdded = result.added > 0 || result.adjusted > 0;
  const hasIssues = lines.length > 0;
  const total = result.added + result.adjusted;

  let title: string;
  if (!anyAdded) title = 'No se pudo agregar ningún producto';
  else if (!hasIssues) title = total === 1 ? 'Producto agregado al carrito' : `${total} productos agregados al carrito`;
  else title = 'Algunos productos no se agregaron completos';

  return { anyAdded, hasIssues, title, lines };
}

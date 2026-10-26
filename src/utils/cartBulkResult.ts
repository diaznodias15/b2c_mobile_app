import type { CartBulkReason, CartBulkResult } from '@/api/services/cart.services';

const REASON_TEXT: Record<CartBulkReason, string> = {
  PRODUCT_UNAVAILABLE: 'No disponible en esta sede',
  OUT_OF_STOCK: 'Sin stock',
  ALREADY_MAX_IN_CART: 'Ya tienes todo lo disponible en el carrito',
  INVALID_QUANTITY: 'Cantidad inválida en el pedido original',
};

export type BulkSummary = {
  /** Se agregó al menos un producto. */
  anyAdded: boolean;
  /** Hubo productos recortados u omitidos: conviene avisar con detalle. */
  hasIssues: boolean;
  title: string;
  /** Texto bajo el título cuando no se agregó nada: el `message` del backend o uno por defecto. */
  detail: string | null;
  /** Una línea por producto incompleto, con su motivo. */
  lines: string[];
};

/**
 * Resume la respuesta de "repetir pedido" / "agregar todos los favoritos" (mismo formato): qué
 * se agregó y qué quedó incompleto o fuera, con el motivo, para mostrárselo al cliente.
 */
export function summarizeBulkResult(
  result: CartBulkResult,
  texts: { message?: string | null; emptyMessage?: string } = {}
): BulkSummary {
  const lines = (result.items ?? [])
    .filter((l) => l.status !== 'ADDED')
    .map((l) =>
      l.status === 'ADJUSTED'
        ? `${l.nb_product}: se agregaron ${l.qty_added} de ${l.qty_requested} ${l.qty_requested === 1 ? 'unidad' : 'unidades'}`
        : `${l.nb_product}: ${(l.reason && REASON_TEXT[l.reason]) || 'No se pudo agregar'}`
    );

  const anyAdded = result.added > 0 || result.adjusted > 0;
  const hasIssues = lines.length > 0;

  let title: string;
  if (!anyAdded) title = 'No se agregó ningún producto';
  else if (!hasIssues) title = 'Productos agregados al carrito';
  else title = 'Algunos productos quedaron incompletos';

  const detail = anyAdded ? null : texts.message || texts.emptyMessage || null;

  return { anyAdded, hasIssues, title, detail, lines };
}

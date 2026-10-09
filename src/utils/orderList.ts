import type { Order, OrderStatus } from '@/types/orders';

/**
 * Actualiza el estado de UNA orden dentro de una página de "Mis órdenes" sin
 * volver a pedir la lista. Devuelve la MISMA referencia si no hay nada que
 * cambiar (así `setQueriesData` no dispara renders de más).
 *
 * Sirve para que, al refrescar el detalle de una orden y descubrir que su
 * estado cambió, la insignia de la lista de fondo se ponga al día de inmediato.
 */
export function patchOrderStatusInPage<T extends { items: Order[] }>(
  page: T,
  txOrderNumber: string,
  status: OrderStatus
): T {
  const target = page.items.find((order) => order.tx_order_number === txOrderNumber);
  if (!target || target.tx_status === status) return page;
  return {
    ...page,
    items: page.items.map((order) =>
      order.tx_order_number === txOrderNumber ? { ...order, tx_status: status } : order
    ),
  };
}

/**
 * Mensaje tras refrescar el detalle de una orden: dice si el estado cambió o
 * sigue igual (para quien refresca justamente a verificarlo).
 */
export function describeStatusRefresh(
  previous: OrderStatus | undefined,
  next: OrderStatus,
  labelOf: (status: OrderStatus) => string
): string {
  const label = labelOf(next);
  return previous !== undefined && previous !== next
    ? `El estado cambió a "${label}".`
    : `Sin cambios: el pedido sigue en "${label}".`;
}

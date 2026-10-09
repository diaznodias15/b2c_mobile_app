import type { OrderStatus } from '@/types/orders';

/**
 * Índice (0–4) del paso activo del `OrderStatusStepper` a partir de `tx_status`.
 *
 * El backend NO manda `in_status`: en la web lo calcula `orderDetailAdapter`.
 * La app lo leía de la respuesta (`data.in_status`), llegaba `undefined` y
 * ningún paso se iluminaba. Se deriva siempre de `tx_status`, que sí viene.
 * `CANCELED` (5) no se dibuja en el stepper (el detalle muestra la alerta de
 * cancelación); un estado desconocido cae a 0, igual que la web.
 *
 * Vive aparte de `orderStatus.ts` a propósito: ese archivo importa íconos de
 * `lucide-react-native`, que no cargan en los tests de Node. Esta función es
 * pura y sí se testea.
 */
const ORDER_STEP_BY_STATUS: Record<OrderStatus, number> = {
  PENDING: 0,
  APPROVED: 1,
  PROCESSING: 2,
  PROCESSED: 3,
  FINISHED: 4,
  CANCELED: 5,
};

export function getOrderStatusStep(status: string | null | undefined): number {
  return ORDER_STEP_BY_STATUS[status as OrderStatus] ?? 0;
}

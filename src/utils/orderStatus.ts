import {
  CircleCheck,
  CircleEllipsis,
  CircleX,
  ListCheck,
  Package,
  PackageOpen,
  Star,
  type LucideIcon,
} from 'lucide-react-native';

import type { OrderStatus, PaymentMethodCode } from '@/types/orders';
import type { FulfillmentType } from '@/types/cart';
import type { ThemeColors } from '@/theme/colors';

/**
 * Mapping de status (MY-ORDERS-MODULE.md §25). PENDING/CANCELED usan
 * hex fijos (no whitelabel) a propósito — mismo criterio que la web:
 * son colores "semánticos" (advertencia/error) que no deberían
 * cambiar aunque el admin recoloree la marca. APPROVED/PROCESSING/
 * PROCESSED comparten el primary; FINISHED usa success.
 */
export function getOrderStatusConfig(
  status: OrderStatus,
  colors: ThemeColors
): { color: string; icon: LucideIcon; label: string } | null {
  switch (status) {
    case 'PENDING':
      return { color: '#C05621', icon: CircleEllipsis, label: 'En revisión' };
    case 'APPROVED':
      return { color: colors.primary, icon: ListCheck, label: 'Aprobado' };
    case 'PROCESSING':
      return { color: colors.primary, icon: PackageOpen, label: 'Procesando' };
    case 'PROCESSED':
      return { color: colors.primary, icon: Package, label: 'Procesado' };
    case 'FINISHED':
      return { color: colors.success, icon: CircleCheck, label: 'Entregado' };
    case 'CANCELED':
      return { color: '#C53030', icon: CircleX, label: 'Cancelado' };
    default:
      return null;
  }
}

/** Steps del `OrderStatusStepper` (MY-ORDERS-MODULE.md §14) — CANCELED no se muestra acá. */
export const ORDER_STEPPER_STEPS: Array<{ icon: LucideIcon; label: string }> = [
  { icon: CircleEllipsis, label: 'Pendiente' },
  { icon: ListCheck, label: 'Aprobado' },
  { icon: PackageOpen, label: 'Procesando' },
  { icon: Package, label: 'Procesado' },
  { icon: Star, label: 'Finalizado' },
];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodCode, string> = {
  EFECTIVO: 'Efectivo',
  PUNTODEVENTA: 'Punto de venta',
  PAGOMOVIL: 'Pago móvil',
  TRANSFERENCIA: 'Transferencia',
  ZELLE: 'Zelle',
  EXPRESS: 'Express',
};

export const FULFILLMENT_LABELS: Record<FulfillmentType, string> = {
  PICKUP: 'Retiro en tienda',
  DELIVERY: 'Delivery',
};

/**
 * El backend manda `dt_created_at` crudo ("YYYY-MM-DD HH:mm:ss"), no
 * pre-formateado como sugiere MY-ORDERS-MODULE.md (ahí lo formatea el
 * `ordersAdapter` de la web con dayjs) — confirmado contra la API real.
 * Formatea a "DD/MM/YYYY" para la lista.
 */
export function formatOrderListDate(raw: string): string {
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return raw;
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

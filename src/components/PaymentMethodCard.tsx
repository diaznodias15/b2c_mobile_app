import { hexToRgba, type ThemeColors } from '@/theme/colors';

/**
 * Colores por método de pago. La tarjeta que los usa vive en `redesign/components/PaymentMethodCard`.
 * El fondo/borde/texto de la tarjeta respetan el whitelabel, pero el icono usa colores FIJOS por método
 * (no whitelabel): son la "identidad visual" del método (el violeta de Zelle, el rojo de Pago Móvil),
 * no algo que el admin deba recolorear — mismo criterio que `OrderStatusBadge` con PENDING/CANCELED.
 */

/** Mismos hex fijos que la web (CHECKOUT-FLOW.md §13.4) — no son tokens del whitelabel a propósito. */
export const PAYMENT_METHOD_COLORS = {
  PAGOMOVIL: { bg: '#FFF1F1', color: '#C53030' },
  TRANSFERENCIA: { bg: '#EBF4FF', color: '#2B6CB0' },
  ZELLE: { bg: '#F3EFFF', color: '#6B46C1' },
  EFECTIVO: { bg: '#F0FFF4', color: '#2F855A' },
  PUNTODEVENTA: { bg: '#FFFAF0', color: '#C05621' },
  EXPRESS: { bg: '#FFFCE6', color: '#B7791F' },
} as const;

export function paymentMethodColorFor(method: keyof typeof PAYMENT_METHOD_COLORS, colors: ThemeColors) {
  const config = PAYMENT_METHOD_COLORS[method];
  const { bg, color } = config ?? { bg: hexToRgba(colors.primary, 0.1), color: colors.primary };
  return { iconBg: bg, iconColor: color };
}

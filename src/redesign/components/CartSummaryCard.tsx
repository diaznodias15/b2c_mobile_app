import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';

import type { DisplayCurrency } from '@/store/currency.store';
import type { ThemeColors } from '@/theme/colors';
import { formatDisplayPrice } from '@/utils/currency';
import type { CartSummary } from '@/utils/pricing';

import { MIN_TOUCH } from '../ui/tokens';
import { Txt } from '../ui/Txt';

/**
 * Resumen del carrito del rediseño. **Mismo contrato que `@/components/CartSummaryCard`**
 * (`summary`, `exchangeRate`, `displayCurrency`, `colors`, `children`, `deliveryFee`) más
 * `collapsible`.
 *
 * Qué cambia: el **Total** es lo primero y más grande (22 px); el desglose
 * (Subtotal / Descuento / IVA / Envío) pasa a 14 px (era 13). Con `collapsible` (el carrito)
 * el desglose queda plegado tras tocar la fila del total, para que la barra inferior no se
 * coma media pantalla en teléfonos chicos; sin `collapsible` (checkout) se muestra siempre,
 * como antes. Si hay descuento, "Ahorraste X" se ve aunque el desglose esté plegado.
 */
export function CartSummaryCard({
  summary,
  exchangeRate,
  displayCurrency,
  colors,
  children,
  deliveryFee,
  collapsible = false,
}: {
  summary: CartSummary;
  exchangeRate: number | null | undefined;
  displayCurrency: DisplayCurrency;
  colors: ThemeColors;
  children?: ReactNode;
  /**
   * Costo de envío — `undefined` cuando no aplica (PICKUP), `null` cuando aplica pero no
   * se pudo cotizar ("Se coordina por WhatsApp", nunca "gratis"), `number` cuando ya se
   * calculó. Se suma a `summary.total` para el Total mostrado.
   */
  deliveryFee?: number | null;
  collapsible?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const total = summary.total + (deliveryFee ?? 0);
  const fmt = (amount: number) => formatDisplayPrice(amount, exchangeRate, displayCurrency);
  const showBreakdown = !collapsible || open;

  const totalRow = (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Txt variant="label" color="muted" colors={colors}>
          Total
        </Txt>
        {collapsible &&
          (open ? <ChevronUp size={16} color={colors.muted} /> : <ChevronDown size={16} color={colors.muted} />)}
      </View>
      <Txt variant="price" colors={colors} style={{ fontSize: 22, lineHeight: 28 }}>
        {fmt(total)}
      </Txt>
    </View>
  );

  return (
    <View style={{ gap: 6 }}>
      {showBreakdown && (
        <View style={{ gap: 6 }}>
          <SummaryRow label="Subtotal" value={fmt(summary.subtotal)} colors={colors} />
          <SummaryRow
            label="Descuento"
            value={summary.discountTotal > 0 ? `-${fmt(summary.discountTotal)}` : fmt(0)}
            colors={colors}
          />
          <SummaryRow label="Impuesto (IVA)" value={fmt(summary.taxTotal)} colors={colors} />
          {deliveryFee !== undefined && (
            <SummaryRow
              label="Envío"
              value={deliveryFee === null ? 'Se coordina por WhatsApp' : deliveryFee > 0 ? fmt(deliveryFee) : 'Gratis'}
              colors={colors}
            />
          )}
        </View>
      )}

      {collapsible ? (
        <Pressable
          onPress={() => setOpen((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={open ? 'Ocultar el desglose del total' : 'Ver el desglose del total'}
          accessibilityState={{ expanded: open }}
          style={{ minHeight: MIN_TOUCH - 8, justifyContent: 'center' }}
        >
          {totalRow}
        </Pressable>
      ) : (
        totalRow
      )}

      {summary.discountTotal > 0 && (
        <Txt variant="caption" colors={colors} style={{ color: colors.success, fontWeight: '700' }}>
          Ahorraste {fmt(summary.discountTotal)}
        </Txt>
      )}

      {children && <View style={{ marginTop: 6, gap: 8 }}>{children}</View>}
    </View>
  );
}

function SummaryRow({ label, value, colors }: { label: string; value: string; colors: ThemeColors }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <Txt variant="label" color="muted" colors={colors} style={{ fontWeight: '500' }}>
        {label}
      </Txt>
      <Txt variant="label" colors={colors}>
        {value}
      </Txt>
    </View>
  );
}

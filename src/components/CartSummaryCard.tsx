import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { formatDisplayPrice } from '@/utils/currency';
import type { DisplayCurrency } from '@/store/currency.store';
import type { CartSummary } from '@/utils/pricing';
import type { ThemeColors } from '@/theme/colors';

/**
 * Desglose Subtotal + Descuento + Impuesto (IVA) + Total
 * (CARTSUMMARY-FUNCTIONALITY.md, adaptado a lo que esta API realmente
 * expone — ver el comentario de `getCartSummary`). Sin card ni título
 * propios a propósito: se monta DENTRO del footer existente de
 * `cart.tsx`/`checkout.tsx` (que ya trae su propio fondo/borde), no
 * como un bloque visual separado.
 */
export function CartSummaryCard({
  summary,
  exchangeRate,
  displayCurrency,
  colors,
  children,
}: {
  summary: CartSummary;
  exchangeRate: number | null | undefined;
  displayCurrency: DisplayCurrency;
  colors: ThemeColors;
  children?: ReactNode;
}) {
  return (
    <View style={{ gap: 6 }}>
      <SummaryRow
        label="Subtotal"
        value={formatDisplayPrice(summary.subtotal, exchangeRate, displayCurrency)}
        colors={colors}
      />
      <SummaryRow
        label="Descuento"
        value={
          summary.discountTotal > 0
            ? `-${formatDisplayPrice(summary.discountTotal, exchangeRate, displayCurrency)}`
            : formatDisplayPrice(0, exchangeRate, displayCurrency)
        }
        colors={colors}
      />
      <SummaryRow
        label="Impuesto (IVA)"
        value={formatDisplayPrice(summary.taxTotal, exchangeRate, displayCurrency)}
        colors={colors}
      />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
        <Text style={{ fontSize: 15, color: colors.muted }}>Total</Text>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground }}>
          {formatDisplayPrice(summary.total, exchangeRate, displayCurrency)}
        </Text>
      </View>

      {children && <View style={{ marginTop: 8, gap: 8 }}>{children}</View>}
    </View>
  );
}

function SummaryRow({ label, value, colors }: { label: string; value: string; colors: ThemeColors }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ fontSize: 13, color: colors.muted }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground }}>{value}</Text>
    </View>
  );
}

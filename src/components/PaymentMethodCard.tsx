import { Pressable, Text, View } from 'react-native';
import { Check, type LucideIcon } from 'lucide-react-native';

import { hexToRgba, type ThemeColors } from '@/theme/colors';

/**
 * Card de método de pago (CHECKOUT-FLOW.md §13.4). El fondo/borde/texto
 * de la card SÍ respetan el whitelabel (`colors.section`/`colors.border`/
 * `colors.foreground`) — pero el ícono usa colores FIJOS por método (no
 * whitelabel), igual criterio que `OrderStatusBadge` con PENDING/CANCELED:
 * son "identidad visual" del método (todo el mundo reconoce el violeta
 * de Zelle, el rojo de Pago Móvil), no algo que el admin deba recolorear.
 */
export function PaymentMethodCard({
  label,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
  selected,
  onPress,
  colors,
}: {
  label: string;
  subtitle?: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  selected: boolean;
  onPress: () => void;
  colors: ThemeColors;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexBasis: '48%',
          flexGrow: 1,
          padding: 12,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: selected ? iconColor : colors.border,
          backgroundColor: colors.section,
          opacity: pressed ? 0.85 : 1,
          gap: 8,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            backgroundColor: iconBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={18} color={iconColor} />
        </View>
        {selected && (
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: iconColor,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Check size={12} color="#FFFFFF" strokeWidth={3} />
          </View>
        )}
      </View>
      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.foreground }} numberOfLines={1}>
        {label}
      </Text>
      {subtitle && (
        <Text style={{ fontSize: 11, color: colors.muted }} numberOfLines={1}>
          {subtitle}
        </Text>
      )}
    </Pressable>
  );
}

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

import { Pressable, View } from 'react-native';
import { Check, type LucideIcon } from 'lucide-react-native';

import type { ThemeColors } from '@/theme/colors';

import { Txt } from '../ui/Txt';

/**
 * Tarjeta de método de pago. **Mismo contrato que `@/components/PaymentMethodCard`** (`label`,
 * `subtitle`, `icon`, `iconBg`, `iconColor`, `selected`, `onPress`, `colors`); los colores fijos por
 * método (`paymentMethodColorFor`) siguen viniendo de allí, porque son la "identidad visual" del
 * método (el violeta de Zelle, el rojo de Pago Móvil) y no del whitelabel.
 *
 * Qué cambia: el subtítulo pasa a 12 px (era 11), el seleccionado se distingue por un check y un
 * borde más grueso además del color (el borde usa el color del método), y toda la tarjeta anuncia
 * `selected` y su subtítulo al lector de pantalla.
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
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={subtitle ? `${label}, ${subtitle}` : label}
      style={({ pressed }) => ({
        flexBasis: '48%',
        flexGrow: 1,
        minHeight: 96,
        padding: 12,
        borderRadius: 14,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? iconColor : colors.border,
        backgroundColor: colors.productCard,
        opacity: pressed ? 0.85 : 1,
        gap: 8,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: iconBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={20} color={iconColor} />
        </View>
        {selected && (
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: iconColor,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Check size={14} color="#FFFFFF" strokeWidth={3} />
          </View>
        )}
      </View>
      <View>
        <Txt variant="label" colors={colors} numberOfLines={1} style={{ fontWeight: '700' }}>
          {label}
        </Txt>
        {subtitle ? (
          <Txt variant="caption" color="muted" colors={colors} numberOfLines={1}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
    </Pressable>
  );
}

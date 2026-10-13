import { ActivityIndicator, Pressable, View } from 'react-native';
import { Minus, Plus, Trash2, type LucideIcon } from 'lucide-react-native';

import type { ThemeColors } from '@/theme/colors';

import { MIN_TOUCH } from '../ui/tokens';
import { Txt } from '../ui/Txt';

/**
 * Stepper +/- de cantidad del rediseño. **Mismo contrato que
 * `@/components/QuantityStepper`** (`value`, `max`, `onChange`, `colors`, `disabled`,
 * `loading`, `onRemove`), usado en el detalle de producto y en el carrito.
 *
 * Qué cambia: cada botón mide 44×48 (antes un icono de 16 px con `hitSlop`), el número
 * es de 16 px con ancho fijo para que el control no "baile" al pasar de 9 a 10, y los
 * botones tienen estado `pressed`. Los botones inactivos (mínimo/máximo) se atenúan y
 * anuncian `disabled` al lector de pantalla.
 */
export function QuantityStepper({
  value,
  max,
  onChange,
  colors,
  disabled = false,
  loading = false,
  onRemove,
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
  colors: ThemeColors;
  disabled?: boolean;
  /**
   * Hay una operación con el servidor en curso: bloquea los botones y reemplaza
   * el número por un spinner (con sesión se espera la respuesta de la API).
   */
  loading?: boolean;
  /**
   * Si se pasa, con cantidad 1 el botón "−" se vuelve una papelera que llama a
   * `onRemove` (como en la web) en vez de quedar deshabilitado. Es para el carrito.
   */
  onRemove?: () => void;
}) {
  const removesAtOne = onRemove !== undefined && value <= 1;
  const blocked = disabled || loading;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.section,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        height: MIN_TOUCH,
        opacity: blocked ? 0.6 : 1,
      }}
    >
      <StepButton
        icon={removesAtOne ? Trash2 : Minus}
        color={removesAtOne ? colors.danger : colors.foreground}
        label={removesAtOne ? 'Quitar del carrito' : 'Restar cantidad'}
        disabled={blocked || (value <= 1 && !removesAtOne)}
        onPress={() => (removesAtOne ? onRemove() : onChange(Math.max(1, value - 1)))}
      />
      <View style={{ minWidth: 32, alignItems: 'center' }}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Txt
            variant="label"
            colors={colors}
            style={{ fontSize: 16, fontWeight: '700', textAlign: 'center' }}
            accessibilityLiveRegion="polite"
            accessibilityLabel={`Cantidad: ${value}`}
          >
            {value}
          </Txt>
        )}
      </View>
      <StepButton
        icon={Plus}
        color={colors.foreground}
        label="Sumar cantidad"
        disabled={blocked || value >= max}
        onPress={() => onChange(Math.min(max, value + 1))}
      />
    </View>
  );
}

function StepButton({
  icon: Icon,
  color,
  label,
  disabled,
  onPress,
}: {
  icon: LucideIcon;
  color: string;
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => ({
        width: 44,
        height: MIN_TOUCH,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.35 : pressed ? 0.6 : 1,
      })}
    >
      <Icon size={18} color={color} strokeWidth={2.4} />
    </Pressable>
  );
}

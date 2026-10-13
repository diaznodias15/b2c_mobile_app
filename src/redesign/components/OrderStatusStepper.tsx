import { View } from 'react-native';

import type { ThemeColors } from '@/theme/colors';
import { ORDER_STEPPER_STEPS } from '@/utils/orderStatus';

import { Txt } from '../ui/Txt';

/**
 * Progreso de la orden en 5 pasos. **Mismo contrato que `@/components/OrderStatusStepper`**
 * (`active` 0-4 desde `getOrderStatusStep`, `colors`); no se renderiza si la orden está
 * CANCELED (lo decide el llamador).
 *
 * Qué cambia: el original ponía las 5 etiquetas en una fila de 10 px (ilegible en 360 dp).
 * Ahora es una barra de 5 segmentos y, debajo, el paso actual en grande ("Procesando") con
 * "Paso 3 de 5" y cuál sigue. Se anuncia como un solo elemento de progreso.
 */
export function OrderStatusStepper({ active, colors }: { active: number; colors: ThemeColors }) {
  const total = ORDER_STEPPER_STEPS.length;
  const current = ORDER_STEPPER_STEPS[Math.min(Math.max(active, 0), total - 1)];
  const next = ORDER_STEPPER_STEPS[active + 1];
  const Icon = current.icon;

  return (
    <View
      style={{ gap: 10 }}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Estado del pedido: ${current.label}, paso ${active + 1} de ${total}`}
    >
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {ORDER_STEPPER_STEPS.map((step, index) => (
          <View
            key={step.label}
            style={{
              flex: 1,
              height: 6,
              borderRadius: 3,
              backgroundColor: index <= active ? colors.primary : colors.border,
            }}
          />
        ))}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.primaryOverlay,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt variant="label" colors={colors} style={{ fontWeight: '800' }}>
            {current.label}
          </Txt>
          <Txt variant="caption" color="muted" colors={colors}>
            Paso {active + 1} de {total}
            {next ? ` · Sigue: ${next.label}` : ''}
          </Txt>
        </View>
      </View>
    </View>
  );
}

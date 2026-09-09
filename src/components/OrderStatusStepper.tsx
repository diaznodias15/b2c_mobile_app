import { Text, View } from 'react-native';

import { ORDER_STEPPER_STEPS } from '@/utils/orderStatus';
import type { ThemeColors } from '@/theme/colors';

/**
 * Timeline de 5 pasos (MY-ORDERS-MODULE.md §14). No se renderiza si la
 * orden está CANCELED — eso lo decide el caller (`ModalOrderDetail`).
 */
export function OrderStatusStepper({
  active,
  colors,
}: {
  /** 0-4 (ver mapping in_status en MY-ORDERS-MODULE.md §25). */
  active: number;
  colors: ThemeColors;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
      {ORDER_STEPPER_STEPS.map((step, index) => {
        const isDone = index <= active;
        const Icon = step.icon;
        return (
          <View key={step.label} style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
              <View
                style={{
                  flex: index === 0 ? 0 : 1,
                  height: 2,
                  backgroundColor: index !== 0 && index <= active ? colors.primary : colors.border,
                }}
              />
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDone ? colors.primary : colors.section,
                  borderWidth: isDone ? 0 : 1,
                  borderColor: colors.border,
                }}
              >
                <Icon size={14} color={isDone ? colors.onPrimary : colors.muted} />
              </View>
              <View
                style={{
                  flex: index === ORDER_STEPPER_STEPS.length - 1 ? 0 : 1,
                  height: 2,
                  backgroundColor: index < active ? colors.primary : colors.border,
                }}
              />
            </View>
            <Text
              style={{
                fontSize: 10,
                color: isDone ? colors.foreground : colors.muted,
                fontWeight: isDone ? '600' : '400',
                textAlign: 'center',
                marginTop: 4,
              }}
              numberOfLines={1}
            >
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

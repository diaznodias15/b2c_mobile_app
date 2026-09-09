import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

import type { ThemeColors } from '@/theme/colors';

/**
 * Piezas compartidas entre el checkout Lite (una sola pantalla) y los
 * pasos del checkout Full (`CheckoutEntregaStep`/`CheckoutPagoStep`) —
 * extraídas acá para no duplicar el mismo `Field`/`inputStyle` en cada
 * archivo (mismo criterio que `PasswordStrengthMeter`).
 */

export function CheckoutBackButton({
  insets,
  colors,
  onPress,
}: {
  insets: { top: number };
  colors: ThemeColors;
  /** Si no se pasa, hace `router.back()` (o vuelve a /cart). */
  onPress?: () => void;
}) {
  const router = useRouter();
  return (
    <Pressable
      onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace('/cart')))}
      style={{
        position: 'absolute',
        top: insets.top + 10,
        left: 16,
        zIndex: 1,
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.section,
      }}
      accessibilityRole="button"
      accessibilityLabel="Volver"
      hitSlop={8}
    >
      <ChevronLeft size={22} color={colors.foreground} />
    </Pressable>
  );
}

export function CheckoutFieldLabel({ children, colors }: { children: ReactNode; colors: ThemeColors }) {
  return (
    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 6 }}>{children}</Text>
  );
}

export function CheckoutField({
  label,
  colors,
  children,
}: {
  label: string;
  colors: ThemeColors;
  children: ReactNode;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <CheckoutFieldLabel colors={colors}>{label}</CheckoutFieldLabel>
      {children}
    </View>
  );
}

export function checkoutInputStyle(colors: ThemeColors) {
  return {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.foreground,
  };
}

export function CheckoutOptionCard({
  label,
  icon: Icon,
  active,
  onPress,
  colors,
}: {
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  active: boolean;
  onPress: () => void;
  colors: ThemeColors;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: active ? colors.primary : colors.section,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
      }}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      <Icon size={18} color={active ? colors.onPrimary : colors.foreground} />
      <Text style={{ fontSize: 14, fontWeight: '600', color: active ? colors.onPrimary : colors.foreground }}>
        {label}
      </Text>
    </Pressable>
  );
}

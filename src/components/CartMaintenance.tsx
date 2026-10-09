import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Wrench } from 'lucide-react-native';

import { BottomTabs } from '@/components/bottom-tabs';
import { hexToRgba, type ThemeColors } from '@/theme/colors';

/**
 * Pantalla del carrito/checkout cuando el admin lo apaga (`is_show_cart = 0`):
 * "Lo sentimos / Módulo en mantenimiento", con salida al inicio.
 * `withTabs` agrega la barra inferior (el carrito es una tab; el checkout no).
 */
export function CartMaintenance({
  colors,
  insetsTop,
  withTabs = false,
}: {
  colors: ThemeColors;
  insetsTop: number;
  withTabs?: boolean;
}) {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: insetsTop,
          paddingHorizontal: 32,
        }}
      >
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: hexToRgba(colors.warning, 0.14),
            marginBottom: 20,
          }}
        >
          <Wrench size={38} color={colors.warning} strokeWidth={1.6} />
        </View>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground, marginBottom: 6 }}>
          Lo sentimos
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: 24 }}>
          Módulo en mantenimiento. Vuelve a intentarlo en unos minutos.
        </Text>
        <Pressable
          onPress={() => router.replace('/')}
          style={{ paddingVertical: 12, paddingHorizontal: 22, borderRadius: 999, backgroundColor: colors.primary }}
          accessibilityRole="button"
          accessibilityLabel="Ir al inicio"
        >
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.onPrimary }}>Ir al inicio</Text>
        </Pressable>
      </View>
      {withTabs && <BottomTabs />}
    </View>
  );
}

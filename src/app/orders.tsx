import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { useThemeColors } from '@/store/config.store';

/**
 * Ruta NO-tab (como `product/[slug]`, `login`, `register`): se llega
 * acá solo con `router.push('/orders')` desde `ProfileActionCard`
 * "Mis órdenes" — a propósito no está en el menú "Ver más" ni
 * renderiza `<BottomTabs />`, para que el swipe-back / back button
 * funcionen igual que en el detalle de producto (ver `_layout.tsx`).
 */
export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))}
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

      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: insets.top,
          paddingHorizontal: 24,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground }}>
          Pedidos
        </Text>
      </View>
    </View>
  );
}

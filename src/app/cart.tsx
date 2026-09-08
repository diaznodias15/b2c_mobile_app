import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabs } from '@/components/bottom-tabs';
import { useThemeColors } from '@/store/config.store';
import { useCartStore, selectCartCount } from '@/store/cart.store';

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const cartCount = useCartStore(selectCartCount);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: insets.top,
          paddingHorizontal: 24,
          gap: 8,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground }}>
          Carrito
        </Text>
        <Text style={{ fontSize: 16, color: colors.muted }}>
          {cartCount > 0
            ? `${cartCount} ${cartCount === 1 ? 'producto' : 'productos'}`
            : 'Tu carrito está vacío'}
        </Text>
      </View>
      <BottomTabs />
    </View>
  );
}

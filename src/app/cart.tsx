import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabs } from '@/components/bottom-tabs';
import { useConfigStore, useThemeColors } from '@/store/config.store';
import { useCartStore, selectCartCount, selectCartTotal } from '@/store/cart.store';
import { useCurrencyStore } from '@/store/currency.store';
import { formatDisplayPrice } from '@/utils/currency';

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const cartCount = useCartStore(selectCartCount);
  const cartTotal = useCartStore(selectCartTotal);
  const displayCurrency = useCurrencyStore((s) => s.displayCurrency);
  const exchangeRate = useConfigStore((s) => s.appConfig?.amt_exchange_rate);

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
        {cartCount > 0 && (
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground, marginTop: 8 }}>
            {formatDisplayPrice(cartTotal, exchangeRate, displayCurrency)}
          </Text>
        )}
      </View>
      <BottomTabs />
    </View>
  );
}

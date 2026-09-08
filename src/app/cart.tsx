import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShoppingCart, Trash2 } from 'lucide-react-native';

import { BottomTabs } from '@/components/bottom-tabs';
import { QuantityStepper } from '@/components/QuantityStepper';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { useBranchStore, selectEffectiveBranchId } from '@/store/branch.store';
import { useCartStore, selectCartTotal } from '@/store/cart.store';
import { useThemeColors } from '@/store/config.store';
import { useToastStore } from '@/store/toast.store';
import { formatDisplayPrice } from '@/utils/currency';
import type { ThemeColors } from '@/theme/colors';
import type { CartItem } from '@/types/cart';

const MAX_QTY = 99;
const PLACEHOLDER_IMAGE = require('../../assets/images/unavailable-product-image.webp');

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const branchId = useBranchStore(selectEffectiveBranchId);
  const showToast = useToastStore((s) => s.show);

  // Carrito acotado a la sede activa: los precios/stock son por sede,
  // así que mezclar items de sedes distintas en un mismo total no
  // tendría sentido. `items` es la referencia estable del store — se
  // filtra acá con useMemo en vez de un selector inline (que armaría un
  // array nuevo en cada notificación del store, el mismo anti-patrón de
  // Zustand documentado en AGENTS.md).
  const items = useCartStore((s) => s.items);
  const cartItems = useMemo(
    () => items.filter((item) => item.branch_id === branchId),
    [items, branchId]
  );
  const cartTotal = useMemo(() => selectCartTotal({ items: cartItems }), [cartItems]);

  const { displayCurrency, exchangeRate } = useDisplayCurrency();

  if (cartItems.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: insets.top,
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
              backgroundColor: colors.primaryOverlaySoft,
              marginBottom: 20,
            }}
          >
            <ShoppingCart size={40} color={colors.primary} strokeWidth={1.6} />
          </View>
          <Text
            style={{
              fontSize: 17,
              fontWeight: '700',
              color: colors.foreground,
              textAlign: 'center',
              marginBottom: 6,
            }}
          >
            Tu carrito está vacío
          </Text>
          <Text
            style={{ fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: 24 }}
          >
            Agregá productos desde el inicio o la búsqueda para verlos acá.
          </Text>
          <Pressable
            onPress={() => router.push('/')}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 999,
              backgroundColor: colors.primary,
            }}
            accessibilityRole="button"
            accessibilityLabel="Ir a comprar"
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.onPrimary }}>
              Ir a comprar
            </Text>
          </Pressable>
        </View>
        <BottomTabs />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Text
        style={{
          fontSize: 22,
          fontWeight: '700',
          color: colors.foreground,
          paddingTop: insets.top + 12,
          paddingHorizontal: 24,
          paddingBottom: 12,
        }}
      >
        Carrito
      </Text>

      <FlatList
        data={cartItems}
        keyExtractor={(item) => `${item.tx_slug}-${item.branch_id}`}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 10, paddingBottom: 16 }}
        renderItem={({ item }) => <CartLineItem item={item} colors={colors} />}
      />

      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: insets.bottom + 16,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.background,
          gap: 12,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 15, color: colors.muted }}>Total</Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground }}>
            {formatDisplayPrice(cartTotal, exchangeRate, displayCurrency)}
          </Text>
        </View>

        <Pressable
          onPress={() => showToast('El pago todavía no está disponible')}
          style={{
            height: 48,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.primary,
          }}
          accessibilityRole="button"
          accessibilityLabel="Proceder al pago"
        >
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.onPrimary }}>
            Proceder al pago
          </Text>
        </Pressable>
      </View>

      <BottomTabs />
    </View>
  );
}

function CartLineItem({ item, colors }: { item: CartItem; colors: ThemeColors }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeProduct = useCartStore((s) => s.removeProduct);
  const { displayCurrency, exchangeRate } = useDisplayCurrency();

  const [imageFailed, setImageFailed] = useState(false);
  const showPlaceholder = !item.tx_img_url || imageFailed;
  const unitPrice = Number(item.pri_product_final_price);

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 12,
        backgroundColor: colors.productCard,
        borderRadius: 14,
        padding: 10,
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 6,
      }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 10,
          overflow: 'hidden',
          backgroundColor: colors.section,
        }}
      >
        <Image
          source={showPlaceholder ? PLACEHOLDER_IMAGE : { uri: item.tx_img_url }}
          style={{ width: '100%', height: '100%' }}
          contentFit="contain"
          onError={() => setImageFailed(true)}
        />
      </View>

      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        <View>
          <Text
            numberOfLines={1}
            style={{ fontSize: 11, fontWeight: '600', color: colors.muted, marginBottom: 2 }}
          >
            {item.nb_brand}
          </Text>
          <Text
            numberOfLines={2}
            style={{ fontSize: 13, fontWeight: '600', color: colors.foreground, lineHeight: 17 }}
          >
            {item.nb_product}
          </Text>
        </View>
        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.foreground }}>
          {formatDisplayPrice(unitPrice, exchangeRate, displayCurrency)}
        </Text>
      </View>

      <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <Pressable
          onPress={() => removeProduct(item.tx_slug, item.branch_id)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Quitar ${item.nb_product} del carrito`}
        >
          <Trash2 size={18} color={colors.danger} />
        </Pressable>
        <QuantityStepper
          value={item.qty}
          max={MAX_QTY}
          onChange={(qty) => updateQuantity(item.tx_slug, item.branch_id, qty)}
          colors={colors}
        />
      </View>
    </View>
  );
}

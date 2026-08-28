import { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import AppTabs from '@/components/app-tabs';
import { EmptyState } from '@/components/EmptyState';
import { useCartStore, selectItemsByBranch } from '@/store/cart.store';
import { useBranchStore } from '@/store/branch.store';
import { useCartSync } from '@/features/cart/hooks/useCartSync';
import { CartItemRow } from '@/features/cart/components/CartItemRow';
import { OrderSummary } from '@/features/cart/components/OrderSummary';
import { formatPrice } from '@/utils/currency';

/**
 * Pantalla del carrito. Lista los items de la sede activa con
 * stepper, eliminar, total y CTA "Continuar".
 *
 * Si no hay items: empty state con CTA "Explorar productos" → /
 */
export default function CartIndexScreen() {
  const branchId = useBranchStore((s) => s.selectedBranch?.value);
  const allItems = useCartStore((s) => s.items);
  const items = useMemo(
    () => (branchId ? selectItemsByBranch({ items: allItems }, branchId) : []),
    [allItems, branchId]
  );
  const { updateQuantity, removeProduct, clear } = useCartSync();

  const empty = items.length === 0;

  const handleContinue = () => {
    if (empty) return;
    router.push('/cart/entrega');
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-4 pt-3 pb-2 flex-row items-center justify-between border-b border-backgroundElement">
          <Text className="text-xl font-bold text-foreground">Carrito</Text>
          {!empty ? (
            <Pressable
              onPress={clear}
              hitSlop={6}
              accessibilityLabel="Limpiar carrito"
            >
              <Text className="text-xs text-danger">Limpiar</Text>
            </Pressable>
          ) : null}
        </View>

        {empty ? (
          <EmptyState
            illustration="cart"
            title="Tu carrito está vacío"
            description="Explorá los departamentos desde Inicio y agregá los productos que necesites."
            cta={{ label: 'Ir a Inicio', onPress: () => router.replace('/') }}
          />
        ) : (
          <>
            <ScrollView
              contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
            >
              {items.map((it) => (
                <CartItemRow
                  key={`${it.tx_slug}-${it.branch_id}`}
                  item={it}
                  onQtyChange={(q) => updateQuantity(it.tx_slug, q)}
                  onRemove={() => removeProduct(it.tx_slug)}
                />
              ))}
            </ScrollView>
            {/* Footer sticky */}
            <View className="absolute bottom-0 left-0 right-0 bg-background border-t border-backgroundElement px-4 py-3">
              <OrderSummary items={items} compact />
              <Pressable
                onPress={handleContinue}
                className="bg-primary rounded-[14px] py-3 mt-3 items-center"
                accessibilityRole="button"
                accessibilityLabel="Continuar con la entrega"
              >
                <Text className="text-sm font-bold text-primary-foreground">
                  Continuar
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </SafeAreaView>
      <AppTabs />
    </View>
  );
}

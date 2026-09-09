import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, FileText } from 'lucide-react-native';

import { getMyOrders } from '@/api/services/orders.services';
import { ModalOrderDetail } from '@/components/ModalOrderDetail';
import { OrderRow } from '@/components/OrderRow';
import { OrderRowSkeleton } from '@/components/OrderRowSkeleton';
import { OrdersPagination } from '@/components/OrdersPagination';
import { selectEffectiveBranchId, useBranchStore } from '@/store/branch.store';
import { useThemeColors } from '@/store/config.store';
import { hexToRgba } from '@/theme/colors';

/**
 * Ruta NO-tab (como `product/[slug]`, `login`, `register`): se llega
 * acá solo con `router.push('/orders')` desde `ProfileActionCard`
 * "Mis órdenes" — a propósito no está en el menú "Ver más" ni
 * renderiza `<BottomTabs />`, para que el swipe-back / back button
 * funcionen igual que en el detalle de producto (ver `_layout.tsx`).
 *
 * Basado en MY-ORDERS-MODULE.md: lista paginada + modal full-screen
 * de detalle al tocar una fila. Paginación local (no URL-driven, este
 * app no tiene URLs) — mismo criterio que `search.tsx`.
 */
export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const branchId = useBranchStore(selectEffectiveBranchId);

  const [page, setPage] = useState(1);
  const [openOrderNumber, setOpenOrderNumber] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-orders', branchId, page],
    queryFn: () => getMyOrders({ branch: branchId as number, page }),
    enabled: branchId !== null,
  });

  const orders = data?.items ?? [];
  const total = data?.pagination.total ?? 0;
  const lastPage = data?.pagination.last_page ?? 1;

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

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: insets.top + 60 }}>
        <View
          style={{
            backgroundColor: colors.section,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingHorizontal: 20,
              paddingVertical: 18,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: hexToRgba(colors.primary, 0.12),
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileText size={18} color={colors.primary} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground }}>
              Mis órdenes
            </Text>
          </View>

          {isLoading && (
            <View>
              {[0, 1, 2].map((i) => (
                <OrderRowSkeleton key={i} colors={colors} />
              ))}
            </View>
          )}

          {!isLoading && isError && (
            <View style={{ paddingVertical: 40, paddingHorizontal: 24, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: colors.danger, textAlign: 'center' }}>
                No pudimos cargar tus órdenes. Intentá de nuevo más tarde.
              </Text>
            </View>
          )}

          {!isLoading && !isError && orders.length === 0 && (
            <View style={{ paddingVertical: 40, paddingHorizontal: 24, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center' }}>
                Aún no tienes órdenes de compra.
              </Text>
            </View>
          )}

          {!isLoading &&
            orders.map((order, index) => (
              <OrderRow
                key={order.tx_order_number}
                order={order}
                index={index}
                onPress={setOpenOrderNumber}
                colors={colors}
              />
            ))}

          {!isLoading && orders.length > 0 && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                paddingVertical: 14,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 12, color: colors.muted }}>{total} items</Text>
              <OrdersPagination
                page={page}
                lastPage={lastPage}
                isLoading={isLoading}
                onChange={setPage}
                colors={colors}
              />
            </View>
          )}
        </View>
      </ScrollView>

      <ModalOrderDetail
        visible={openOrderNumber !== null}
        txOrderNumber={openOrderNumber}
        onClose={() => setOpenOrderNumber(null)}
        colors={colors}
      />
    </View>
  );
}

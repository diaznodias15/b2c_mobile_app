import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, FileText, RefreshCcw } from 'lucide-react-native';

import { getMyOrders } from '@/api/services/orders.services';
import { useRefreshControl } from '@/hooks/useRefreshControl';
import { selectEffectiveBranchId, useBranchStore } from '@/store/branch.store';
import { useThemeColors } from '@/store/config.store';

import { ModalOrderDetail } from '../components/ModalOrderDetail';
import { OrderRow, OrderRowSkeleton } from '../components/OrderRow';
import { OrdersPagination } from '../components/OrdersPagination';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Txt } from '../ui/Txt';

/**
 * "Mis órdenes" del rediseño. Misma ruta no-tab y misma lógica que `orders.tsx` (lista
 * paginada por sede con `getMyOrders`, paginación local con `useState`, modal de detalle
 * al tocar una orden, pull-to-refresh compartido) con otra presentación:
 *
 *  - Cada orden es una tarjeta (ver `OrderRow`), sin la tabla con filas rayadas.
 *  - Cabecera con botón de volver de 48 dp y el contador de órdenes.
 *  - Paginación con botones de texto de 48 dp.
 *  - El estado de error ahora ofrece "Reintentar" (el original solo mostraba el mensaje).
 */
export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const branchId = useBranchStore(selectEffectiveBranchId);
  const refreshControl = useRefreshControl();

  const [page, setPage] = useState(1);
  const [openOrderNumber, setOpenOrderNumber] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-orders', branchId, page],
    queryFn: () => getMyOrders({ branch: branchId as number, page }),
    enabled: branchId !== null,
  });

  const orders = data?.items ?? [];
  const total = data?.pagination.total ?? 0;
  const lastPage = data?.pagination.last_page ?? 1;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={isLoading || isError ? [] : orders}
        keyExtractor={(order) => order.tx_order_number}
        refreshControl={refreshControl}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 24,
          gap: 10,
          flexGrow: 1,
        }}
        ListHeaderComponent={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <IconButton
              icon={ChevronLeft}
              label="Volver"
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))}
              colors={colors}
            />
            <View style={{ flex: 1 }}>
              <Txt variant="title" colors={colors}>
                Mis órdenes
              </Txt>
              {!isLoading && !isError && total > 0 ? (
                <Txt variant="caption" color="muted" colors={colors}>
                  {total} {total === 1 ? 'orden' : 'órdenes'}
                </Txt>
              ) : null}
            </View>
          </View>
        }
        renderItem={({ item }) => <OrderRow order={item} onPress={setOpenOrderNumber} colors={colors} />}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ gap: 10 }}>
              {[0, 1, 2].map((i) => (
                <OrderRowSkeleton key={i} colors={colors} />
              ))}
            </View>
          ) : isError ? (
            <EmptyState
              colors={colors}
              title="No pudimos cargar tus órdenes"
              message="Revisa tu conexión e inténtalo de nuevo."
              action={{ label: 'Reintentar', icon: RefreshCcw, onPress: () => void refetch() }}
            />
          ) : (
            <EmptyState
              colors={colors}
              title="Aún no tienes órdenes"
              message="Cuando hagas tu primer pedido, lo verás aquí con su estado."
              action={{ label: 'Ir a comprar', onPress: () => router.replace('/') }}
            />
          )
        }
        ListFooterComponent={
          !isLoading && !isError && orders.length > 0 ? (
            <View style={{ marginTop: 6 }}>
              <OrdersPagination page={page} lastPage={lastPage} isLoading={isLoading} onChange={setPage} colors={colors} />
            </View>
          ) : null
        }
      />

      <ModalOrderDetail
        visible={openOrderNumber !== null}
        txOrderNumber={openOrderNumber}
        onClose={() => setOpenOrderNumber(null)}
        colors={colors}
      />
    </View>
  );
}

function EmptyState({
  colors,
  title,
  message,
  action,
}: {
  colors: ReturnType<typeof useThemeColors>;
  title: string;
  message: string;
  action: { label: string; icon?: typeof RefreshCcw; onPress: () => void };
}) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primaryOverlay,
          marginBottom: 20,
        }}
      >
        <FileText size={38} color={colors.primary} strokeWidth={1.6} />
      </View>
      <Txt variant="section" colors={colors} style={{ textAlign: 'center', marginBottom: 6 }}>
        {title}
      </Txt>
      <Txt variant="body" color="muted" colors={colors} style={{ textAlign: 'center', marginBottom: 20 }}>
        {message}
      </Txt>
      <Button label={action.label} icon={action.icon} fullWidth={false} onPress={action.onPress} colors={colors} />
    </View>
  );
}

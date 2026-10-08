import { createElement, useCallback, useState, type ReactElement } from 'react';
import { RefreshControl, type RefreshControlProps } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { bootstrapConfig } from '@/components/Providers';
import { useThemeColors } from '@/store/config.store';
import { useToastStore } from '@/store/toast.store';

/**
 * Pull-to-refresh compartido por todas las pantallas con scroll vertical.
 *
 * Un solo gesto refresca las dos fuentes de datos de la app:
 *  - el config/whitelabel (`bootstrapConfig`: colores, tasa, sedes,
 *    departamentos, publicidad, marcas — todo vive en stores de Zustand);
 *  - las queries de TanStack Query activas (`invalidateQueries` re-pide
 *    solo las que están montadas, o sea "lo correspondiente a la vista
 *    en donde estoy": más vendidos, órdenes, detalle de producto, etc.).
 *
 * Se devuelve el `<RefreshControl>` ya armado para pasarlo como prop
 * `refreshControl` del `ScrollView`/`FlatList`. `bootstrapConfig` nunca
 * lanza (captura su error en el store), así que `finally` solo garantiza
 * que el spinner se apague.
 */
export function useRefreshControl(): ReactElement<RefreshControlProps> {
  const queryClient = useQueryClient();
  const colors = useThemeColors();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([bootstrapConfig(), queryClient.invalidateQueries()]);
      useToastStore.getState().show('Datos actualizados');
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  return createElement(RefreshControl, {
    refreshing,
    onRefresh,
    colors: [colors.primary],
    tintColor: colors.primary,
    progressBackgroundColor: colors.background,
  });
}

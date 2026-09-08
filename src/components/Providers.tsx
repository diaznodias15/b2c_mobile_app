import { useMemo, type ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useConfigStore, useThemeColors, useBranchStore, useDepartmentStore, useAdvertisingStore, useBrandsStore } from '@/store';
import { buildThemeColors, themeColorsToCssVars } from '@/theme';
import { loadConfig } from '@/api';

/**
 * Providers raiz. Un solo lugar para montar todos los providers
 * (Uniwind, Query, SafeArea, GestureHandler).
 */
export function Providers({ children }: { children: ReactNode }) {
  const appConfig = useConfigStore((s) => s.appConfig);
  const isError = useConfigStore((s) => s.isError);
  /** Loader de arranque: hasta que llegue la config (o falle), no mostramos pantallas vacías. */
  const isBooting = appConfig === null && !isError;

  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
    []
  );

  const configColors = appConfig?.config_colors;
  const cssVars = useMemo(
    () => themeColorsToCssVars(buildThemeColors(configColors)),
    [configColors]
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <View style={[{ flex: 1 }, cssVars as object]} className="bg-background">
            {isBooting ? <BootLoader /> : children}
          </View>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** Pantalla de carga mientras `bootstrapConfig` trae el whitelabel del backend. */
function BootLoader() {
  const colors = useThemeColors();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

/**
 * Carga la config del backend y la reparte en los stores.
 * (Vuelve cuando tengamos pantallas que muestren el whitelabel.)
 */
export async function bootstrapConfig() {
  const { setLoading, setError, setAppConfig } = useConfigStore.getState();
  const { setDepartments } = useDepartmentStore.getState();
  const { setAdvertising } = useAdvertisingStore.getState();
  const { setBrands } = useBrandsStore.getState();
  const branchStore = useBranchStore.getState();

  setLoading(true);
  try {
    const data = await loadConfig();
    // `config_colors` viene como campo hermano de `app_config` en el
    // envelope real del backend (`data.config_colors`, no
    // `data.app_config.config_colors`) — hay que mergearlo a mano.
    setAppConfig({ ...data.app_config, config_colors: data.config_colors });
    if (data.advertisings !== undefined) {
      setAdvertising(data.advertisings);
    }
    if (data.departments !== undefined) {
      setDepartments(data.departments);
    }
    if (data.branches !== undefined) {
      branchStore.setBranchTree(data.branches);
    }
    if (data.brands !== undefined) {
      setBrands(data.brands);
    }
  } catch (err) {
    console.error('[bootstrapConfig] FALLÓ:', err);
    setError(
      err instanceof Error ? err.message : 'No se pudo cargar la configuración'
    );
  }
}

import { useMemo, type ReactNode } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HeroUINativeProvider } from 'heroui-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useConfigStore, useBranchStore, useDepartmentStore, useAdvertisingStore } from '@/store';
import { buildThemeColors, themeColorsToCssVars } from '@/theme';
import { loadConfig } from '@/api';

/**
 * Providers raiz. Un solo lugar para montar todos los providers
 * (Uniwind, HeroUI, Query, SafeArea, GestureHandler).
 */
export function Providers({ children }: { children: ReactNode }) {
  const appConfig = useConfigStore((s) => s.appConfig);

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
          <HeroUINativeProvider
            config={{
              textProps: {
                allowFontScaling: true,
                maxFontSizeMultiplier: 1.4,
              },
            }}
          >
            <View style={[{ flex: 1 }, cssVars as object]} className="bg-background">
              {children}
            </View>
          </HeroUINativeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
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
  const branchStore = useBranchStore.getState();

  setLoading(true);
  try {
    const data = await loadConfig();
    setAppConfig(data.app_config);
    if (data.advertisings !== undefined) {
      setAdvertising(data.advertisings);
    }
    if (data.departments !== undefined) {
      setDepartments(data.departments);
    }
    if (data.branches !== undefined) {
      branchStore.setBranchTree(data.branches);
    }
  } catch (err) {
    setError(
      err instanceof Error ? err.message : 'No se pudo cargar la configuración'
    );
  }
}

import { useMemo, type ReactNode } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HeroUINativeProvider } from 'heroui-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import {
  useConfigStore,
  useBranchStore,
  useDepartmentStore,
  useAdvertisingStore,
} from '@/store';
import { buildThemeColors, themeColorsToCssVars } from '@/theme';
import { loadConfig } from '@/api';
import { pickDefaultBranch } from '@/features/branches/utils/tree';

/**
 * Componente raíz de providers. Lo usamos dentro de RootLayout
 * para que todos los providers (Uniwind, HeroUI, Query, etc.)
 * vivan en un solo lugar.
 */
export function Providers({ children }: { children: ReactNode }) {
  const appConfig = useConfigStore((s) => s.appConfig);

  // React Query — una sola instancia por mount.
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

  // CSS variables del tema, derivadas de la config del backend.
  // Dependemos del objeto `config_colors` para que se recalcule
  // cuando llega config nueva.
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
 * Dispara la carga inicial de la config del backend y la reparte
 * en los stores correspondientes.
 *
 * Auto-selecciona la sede por defecto (is_default=1 o la primera)
 * si el usuario todavía no eligió una manualmente.
 */
export async function bootstrapConfig() {
  const { setLoading, setError, setAppConfig } = useConfigStore.getState();
  const branchStore = useBranchStore.getState();
  const { setDepartments } = useDepartmentStore.getState();
  const { setAdvertising } = useAdvertisingStore.getState();

  setLoading(true);
  try {
    const data = await loadConfig();
    setAppConfig(data.app_config);
    if (data.advertisings) {
      setAdvertising(data.advertisings);
    }
    if (data.departments) {
      setDepartments(data.departments);
    }
    if (data.branches) {
      branchStore.setBranchTree(data.branches);
      // Si no hay sede seleccionada todavía, auto-pick la default.
      if (!branchStore.selectedBranch) {
        const def = pickDefaultBranch(data.branches);
        if (def) {
          branchStore.setSelectedBranch(def);
        }
      }
    }
  } catch (err) {
    setError(
      err instanceof Error ? err.message : 'No se pudo cargar la configuración'
    );
  }
}

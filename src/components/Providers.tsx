import { useMemo, type ReactNode } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HeroUINativeProvider } from 'heroui-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useConfigStore, useBranchStore } from '@/store';
import { buildThemeColors, themeColorsToCssVars } from '@/theme';
import { loadConfig } from '@/api';

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

/** Dispara la carga inicial de la config del backend. */
export async function bootstrapConfig() {
  const { setLoading, setError, setAppConfig } = useConfigStore.getState();
  const { setBranches } = useBranchStore.getState();

  setLoading(true);
  try {
    const data = await loadConfig();
    // Guardamos el app_config interno (no el envelope completo).
    setAppConfig(data.app_config);
    // Las branches también vienen en la config.
    if (data.branches) {
      setBranches(data.branches);
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : 'No se pudo cargar la configuración');
  }
}

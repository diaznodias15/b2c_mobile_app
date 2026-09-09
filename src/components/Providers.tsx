import { useMemo, type ReactNode } from 'react';
import { Dimensions, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { FlyingCartOverlay } from '@/components/FlyingCartOverlay';
import { ProductCardSkeleton } from '@/components/ProductCardSkeleton';
import { Skeleton } from '@/components/Skeleton';
import { Toast } from '@/components/Toast';
import { useConfigStore, useThemeColors, useBranchStore, useDepartmentStore, useAdvertisingStore, useBrandsStore } from '@/store';
import { buildThemeColors, themeColorsToCssVars } from '@/theme';
import { loadConfig } from '@/api';

const SCREEN_WIDTH = Dimensions.get('window').width;
const BANNER_SIZE = SCREEN_WIDTH - 48;
const DEPARTMENT_CARD_HEIGHT = 168;
const DEPARTMENT_CARD_WIDTH = (SCREEN_WIDTH - 48 - 12) / 2;

/**
 * Providers raiz. Un solo lugar para montar todos los providers
 * (Uniwind, Query, SafeArea, GestureHandler).
 */
export function Providers({ children }: { children: ReactNode }) {
  const appConfig = useConfigStore((s) => s.appConfig);
  /**
   * Loader de arranque: se basa en `hasBootstrapped` (esta sesión ya
   * terminó su fetch), NO en `appConfig !== null` — `appConfig` se
   * rehidrata de AsyncStorage antes de que la red responda (ver el
   * comentario en `config.store.ts`), así que usar eso hacía que el
   * skeleton nunca apareciera salvo en la primera instalación.
   */
  const hasBootstrapped = useConfigStore((s) => s.hasBootstrapped);
  const isBooting = !hasBootstrapped;

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
    <KeyboardProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <View style={[{ flex: 1 }, cssVars as object]} className="bg-background">
              {isBooting ? <HomeSkeleton /> : children}
              {!isBooting && (
                <>
                  <FlyingCartOverlay />
                  <Toast />
                </>
              )}
            </View>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </KeyboardProvider>
  );
}

/**
 * Skeleton del Home mientras `bootstrapConfig` trae el whitelabel del
 * backend (reemplaza al spinner centrado: da la sensación de que la app
 * ya está ahí, solo "rellenándose", en vez de pantalla en blanco).
 *
 * No usa `colors` reales del backend (todavía no llegaron) — cae al
 * fallback de `useThemeColors()` (`SOFT_COLORS`), que es la base neutra
 * sobre la que igual se dibuja cualquier whitelabel.
 */
function HomeSkeleton() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + 10,
          paddingBottom: 10,
          paddingHorizontal: 24,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.navbar,
        }}
      >
        <Skeleton width={120} height={36} borderRadius={8} colors={colors} />
        <Skeleton width={90} height={16} borderRadius={4} colors={colors} />
      </View>

      <View style={{ alignItems: 'center', paddingTop: 8 }}>
        <Skeleton width={BANNER_SIZE} height={BANNER_SIZE} borderRadius={18} colors={colors} />
      </View>

      <View style={{ marginTop: 24, alignItems: 'center', gap: 6 }}>
        <Skeleton width={160} height={18} borderRadius={4} colors={colors} />
        <Skeleton width={220} height={12} borderRadius={4} colors={colors} />
      </View>

      <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 24, marginTop: 16 }}>
        {[0, 1, 2].map((i) => (
          <ProductCardSkeleton key={i} colors={colors} />
        ))}
      </View>

      <View style={{ marginTop: 24, alignItems: 'center', gap: 6 }}>
        <Skeleton width={140} height={18} borderRadius={4} colors={colors} />
        <Skeleton width={240} height={12} borderRadius={4} colors={colors} />
      </View>

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 12,
          paddingHorizontal: 24,
          marginTop: 16,
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            width={DEPARTMENT_CARD_WIDTH}
            height={DEPARTMENT_CARD_HEIGHT}
            borderRadius={16}
            colors={colors}
          />
        ))}
      </View>
    </View>
  );
}

/**
 * Carga la config del backend y la reparte en los stores.
 * (Vuelve cuando tengamos pantallas que muestren el whitelabel.)
 */
export async function bootstrapConfig() {
  const { setLoading, setError, setAppConfig, markBootstrapped } = useConfigStore.getState();
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
  } finally {
    // Se marca al final (éxito o error) para que el skeleton de arranque
    // cubra TODA la ventana de carga de esta sesión, incluso cuando
    // `appConfig` ya viene rehidratado de una sesión anterior.
    markBootstrapped();
  }
}

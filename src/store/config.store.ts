import { useMemo } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildThemeColors } from '@/theme/colors';
import type { ConfigColors, ThemeColors } from '@/theme/colors';

/**
 * Forma esperada del `appConfig` que llega del backend.
 * En Fase 1 lo completamos con todos los campos del documento
 * (whitelabel, multi-sede, lite mode, dark mode, payment methods, etc.).
 */
export type AppConfig = {
  tx_company_name?: string;
  tx_company_rif?: string;
  tx_company_phone?: string;
  tx_company_whatsapp?: string;
  tx_company_email?: string;
  tx_company_address?: string;
  tx_company_description?: string;
  tx_company_logo_url?: string;
  tx_whatsapp_contact_phone?: string;
  tx_whatsapp_default_message?: string;
  is_allow_delivery?: boolean | string;
  is_allow_dark_mode?: boolean | string;
  is_lite_mode?: boolean | string;
  is_show_cart?: boolean | string;
  is_show_user?: boolean | string;
  is_maintenance_mode?: number | string;
  qty_cart_seconds?: number;
  qty_free_delivery_threshold?: number;
  amt_exchange_rate?: number;
  dt_config_date?: string;
  config_colors?: ConfigColors;
  config_radius?: string | number;
  // … el resto se completa en fases siguientes
};

/**
 * Los flags `is_*` del backend llegan como `boolean | string` ("1"/"0",
 * a veces `true`/`false` real) — nunca compararlos con `=== true`
 * directo. Usar este helper en cualquier gate nuevo (`is_lite_mode`,
 * `is_allow_delivery`, etc).
 */
export function isConfigFlagTrue(value: boolean | string | number | undefined): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  return value === '1' || value === 'true';
}

type ConfigState = {
  appConfig: AppConfig | null;
  isLoading: boolean;
  isError: boolean;
  errorInfo: string | null;
  isMaintenance: boolean;
  /**
   * true recién cuando ESTA sesión de la app terminó su primer fetch de
   * `/api/config/get` (éxito o error) — a propósito NO se deriva de
   * `appConfig !== null`, porque `appConfig` se persiste en AsyncStorage
   * (ver `partialize` abajo) y en cualquier arranque que no sea la
   * primera instalación llega YA seteado desde el caché local, antes de
   * que la red responda. Si `Providers.tsx` mostrara el boot skeleton
   * hasta que `appConfig === null`, en un arranque "tibio" nunca se vería
   * el skeleton — el Home montaría de una con `appConfig` viejo pero
   * `departments`/`advertising`/`branches` (que NO se persisten, ver sus
   * stores) todavía vacíos, mostrando el estado "sin datos" en vez de
   * loading. `hasBootstrapped` nunca se persiste, así que siempre arranca
   * en `false` en cada proceso nuevo.
   */
  hasBootstrapped: boolean;
  setAppConfig: (cfg: AppConfig) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setMaintenance: (maint: boolean) => void;
  markBootstrapped: () => void;
  reset: () => void;
  /** Atajo: tokens de tema derivados de la config. */
  getThemeColors: () => ThemeColors;
};

const initialState: Pick<
  ConfigState,
  'appConfig' | 'isLoading' | 'isError' | 'errorInfo' | 'isMaintenance' | 'hasBootstrapped'
> = {
  appConfig: null,
  isLoading: false,
  isError: false,
  errorInfo: null,
  isMaintenance: false,
  hasBootstrapped: false,
};

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setAppConfig: (cfg) => set({ appConfig: cfg, isLoading: false, isError: false, errorInfo: null }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) =>
        set({ isError: error !== null, errorInfo: error, isLoading: false }),
      setMaintenance: (maint) => set({ isMaintenance: maint }),
      markBootstrapped: () => set({ hasBootstrapped: true }),
      reset: () => set(initialState),
      getThemeColors: () => buildThemeColors(get().appConfig?.config_colors),
    }),
    {
      name: 'config-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ appConfig: state.appConfig }),
    }
  )
);

/**
 * Hook para usar en componentes — NUNCA uses
 * `useConfigStore((s) => s.getThemeColors())` directamente: esa llamada
 * crea un objeto nuevo en cada render, y como corre dentro del selector
 * de `useSyncExternalStore`, React nunca ve el mismo snapshot dos veces
 * → "Maximum update depth exceeded" (loop infinito de renders). Acá
 * seleccionamos solo `config_colors` (referencia estable del store) y
 * memoizamos el cálculo de colores con `useMemo`.
 */
export function useThemeColors(): ThemeColors {
  const configColors = useConfigStore((s) => s.appConfig?.config_colors);
  return useMemo(() => buildThemeColors(configColors), [configColors]);
}

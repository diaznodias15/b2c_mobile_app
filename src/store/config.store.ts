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
  tx_company_logo_url?: string;
  is_allow_delivery?: boolean | string;
  is_allow_dark_mode?: boolean | string;
  is_lite_mode?: boolean | string;
  is_show_cart?: boolean | string;
  is_show_user?: boolean | string;
  qty_cart_seconds?: number;
  qty_free_delivery_threshold?: number;
  amt_exchange_rate?: number;
  config_colors?: ConfigColors;
  config_radius?: string | number;
  // … el resto se completa en Fase 1
};

type ConfigState = {
  appConfig: AppConfig | null;
  isLoading: boolean;
  isError: boolean;
  errorInfo: string | null;
  isMaintenance: boolean;
  setAppConfig: (cfg: AppConfig) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setMaintenance: (maint: boolean) => void;
  reset: () => void;
  /** Atajo: tokens de tema derivados de la config. */
  getThemeColors: () => ThemeColors;
};

const initialState: Pick<
  ConfigState,
  'appConfig' | 'isLoading' | 'isError' | 'errorInfo' | 'isMaintenance'
> = {
  appConfig: null,
  isLoading: false,
  isError: false,
  errorInfo: null,
  isMaintenance: false,
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

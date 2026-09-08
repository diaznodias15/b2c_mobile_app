import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DisplayCurrency } from '@/utils/currency';

export type { DisplayCurrency };

/**
 * Preferencia de moneda del usuario para mostrar precios en toda la
 * app: `Bs.` (bolívares, la principal) o `REF` (precio referencial en
 * USD, la base que manda el backend). Persistida — la conversión real
 * vive en `formatDisplayPrice` (`src/utils/currency.ts`), este store
 * solo guarda la elección.
 */
type CurrencyState = {
  displayCurrency: DisplayCurrency;
  setDisplayCurrency: (currency: DisplayCurrency) => void;
};

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      displayCurrency: 'Bs.',
      setDisplayCurrency: (currency) => set({ displayCurrency: currency }),
    }),
    {
      name: 'currency-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

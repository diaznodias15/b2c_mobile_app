import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { addToSearchHistory, removeFromSearchHistory } from '@/utils/searchHistory';

/**
 * Búsquedas recientes de Buscar, persistidas en el dispositivo (solo texto que la persona escribió;
 * no se envía a ningún lado). La lógica de agregar/quitar/limitar está en `utils/searchHistory.ts`.
 */
type SearchHistoryState = {
  queries: string[];
  add: (query: string) => void;
  remove: (query: string) => void;
  clear: () => void;
};

export const useSearchHistoryStore = create<SearchHistoryState>()(
  persist(
    (set) => ({
      queries: [],
      add: (query) => set((s) => ({ queries: addToSearchHistory(s.queries, query) })),
      remove: (query) => set((s) => ({ queries: removeFromSearchHistory(s.queries, query) })),
      clear: () => set({ queries: [] }),
    }),
    {
      name: 'search-history-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

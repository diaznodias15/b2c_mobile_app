import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { BranchGroup, BranchItem } from '@/types/whitelabel';

/**
 * Store de sedes.
 *
 * El backend devuelve `branches` como árbol (estado → ciudad → items[]).
 * Guardamos el árbol completo y derivamos la lista plana en el momento
 * que la necesitemos. La selección del usuario es siempre un `BranchItem`.
 */

type BranchState = {
  /** Árbol completo que vino del backend. */
  branchTree: BranchGroup[];
  /** Sede actualmente seleccionada. */
  selectedBranch: BranchItem | null;
  setBranchTree: (tree: BranchGroup[]) => void;
  setSelectedBranch: (b: BranchItem) => void;
  reset: () => void;
};

const initialState: Pick<BranchState, 'branchTree' | 'selectedBranch'> = {
  branchTree: [],
  selectedBranch: null,
};

export const useBranchStore = create<BranchState>()(
  persist(
    (set) => ({
      ...initialState,
      setBranchTree: (tree) => set({ branchTree: tree }),
      setSelectedBranch: (b) => set({ selectedBranch: b }),
      reset: () => set(initialState),
    }),
    {
      name: 'branch-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Sede / sucursal de la farmacia. */
export type Branch = {
  id: number;
  nb_name: string;
  nb_state?: string;
  nb_city?: string;
  tx_address?: string;
  tx_phone?: string;
  qty_latitude?: number;
  qty_longitude?: number;
  is_open?: boolean;
  tx_opening_hours?: string;
  // … el resto se completa en Fase 1
};

type BranchState = {
  selectedBranch: Branch | null;
  branches: Branch[];
  setSelectedBranch: (b: Branch) => void;
  setBranches: (b: Branch[]) => void;
  reset: () => void;
};

const initialState: Pick<BranchState, 'selectedBranch' | 'branches'> = {
  selectedBranch: null,
  branches: [],
};

export const useBranchStore = create<BranchState>()(
  persist(
    (set) => ({
      ...initialState,
      setSelectedBranch: (b) => set({ selectedBranch: b }),
      setBranches: (b) => set({ branches: b }),
      reset: () => set(initialState),
    }),
    {
      name: 'branch-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

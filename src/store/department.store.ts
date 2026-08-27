import { create } from 'zustand';

import type { Department } from '@/types/whitelabel';

/**
 * Store de departamentos.
 *
 * En el web se persiste a localStorage; en mobile lo dejamos en memoria
 * porque la fuente de verdad es el backend (se rehidrata en cada boot
 * desde `/api/config/get`). Si en el futuro hace falta offline, lo
 * migramos a AsyncStorage.
 */

type DepartmentState = {
  departments: Department[];
  setDepartments: (deps: Department[]) => void;
  reset: () => void;
};

const initialState: Pick<DepartmentState, 'departments'> = {
  departments: [],
};

export const useDepartmentStore = create<DepartmentState>()((set) => ({
  ...initialState,
  setDepartments: (deps) => set({ departments: deps }),
  reset: () => set(initialState),
}));

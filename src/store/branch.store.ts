import { useMemo } from 'react';
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

/**
 * Selector puro: sede a usar para pedir data (top products, etc.) cuando
 * todavía no hay selector de sede real en la UI. Prioriza `selectedBranch`;
 * si no hay, cae a la marcada `is_default`, y si tampoco hay, a la primera
 * del árbol. No dispara `setSelectedBranch` — el store sigue sin
 * auto-seleccionar (decisión existente, ver branch.store.test.ts).
 */
export function selectEffectiveBranchId(state: {
  branchTree: BranchGroup[];
  selectedBranch: BranchItem | null;
}): number | null {
  if (state.selectedBranch) return state.selectedBranch.value;
  for (const group of state.branchTree) {
    const defaultItem = group.items.find((item) => item.is_default);
    if (defaultItem) return defaultItem.value;
  }
  return state.branchTree[0]?.items[0]?.value ?? null;
}

/**
 * Item completo de la sede efectiva (ver `selectEffectiveBranchId`), para
 * mostrar su nombre/alias (navbar, etc.). A diferencia de
 * `selectEffectiveBranchLocation`, esto SÍ es seguro usar directo con
 * `useBranchStore(selectEffectiveBranch)` sin useMemo: siempre devuelve
 * una referencia que ya existe en `branchTree`/`selectedBranch` (nunca
 * arma un objeto nuevo), así que la identidad se mantiene estable entre
 * renders mientras el árbol no cambie.
 */
export function selectEffectiveBranch(state: {
  branchTree: BranchGroup[];
  selectedBranch: BranchItem | null;
}): BranchItem | null {
  if (state.selectedBranch) return state.selectedBranch;
  for (const group of state.branchTree) {
    const defaultItem = group.items.find((item) => item.is_default);
    if (defaultItem) return defaultItem;
  }
  return state.branchTree[0]?.items[0] ?? null;
}

/**
 * Ciudad/estado de la sede efectiva (ver `selectEffectiveBranchId`).
 * `nb_city`/`nb_state` viven en el `BranchGroup` que envuelve al item, no
 * en el `BranchItem` en sí — hay que buscar el grupo que lo contiene.
 */
export function selectEffectiveBranchLocation(state: {
  branchTree: BranchGroup[];
  selectedBranch: BranchItem | null;
}): { city: string; state: string } | null {
  const branchId = selectEffectiveBranchId(state);
  if (branchId === null) return null;
  for (const group of state.branchTree) {
    if (group.items.some((item) => item.value === branchId)) {
      return { city: group.nb_city, state: group.nb_state };
    }
  }
  return null;
}

/**
 * Hook para usar en componentes — NUNCA selecciones
 * `selectEffectiveBranchLocation` directo con `useBranchStore(...)`: ese
 * selector arma un objeto `{city, state}` nuevo en cada llamada, y como
 * corre dentro del selector de `useSyncExternalStore`, React nunca ve el
 * mismo snapshot dos veces → "Maximum update depth exceeded" (mismo bug
 * que `getThemeColors`, ver config.store.ts). Acá seleccionamos las
 * piezas estables (`branchTree`, `selectedBranch`) y memoizamos.
 */
export function useEffectiveBranchLocation(): { city: string; state: string } | null {
  const branchTree = useBranchStore((s) => s.branchTree);
  const selectedBranch = useBranchStore((s) => s.selectedBranch);
  return useMemo(
    () => selectEffectiveBranchLocation({ branchTree, selectedBranch }),
    [branchTree, selectedBranch]
  );
}

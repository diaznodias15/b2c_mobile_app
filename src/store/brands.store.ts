import { create } from 'zustand';

import type { Brand } from '@/types/whitelabel';

/**
 * Store de marcas (strip "Marcas con las que trabajamos" del Home).
 *
 * En memoria (no persistimos): se rehidrata desde `/api/config/get` en
 * cada boot, igual que `advertising`/`department`.
 */

type BrandsState = {
  brands: Brand[];
  setBrands: (list: Brand[]) => void;
  reset: () => void;
};

const initialState: Pick<BrandsState, 'brands'> = {
  brands: [],
};

export const useBrandsStore = create<BrandsState>()((set) => ({
  ...initialState,
  setBrands: (list) => set({ brands: list }),
  reset: () => set(initialState),
}));

import { create } from 'zustand';

import type { Advertising } from '@/types/whitelabel';

/**
 * Store de publicidad del carrusel del Home.
 *
 * En memoria (no persistimos): el carrusel siempre se rehidrata
 * desde `/api/config/get` en boot. La idea es que el admin pueda
 * cambiar la publicidad sin requerir reinstall de la app.
 */

type AdvertisingState = {
  advertising: Advertising[];
  setAdvertising: (list: Advertising[]) => void;
  reset: () => void;
};

const initialState: Pick<AdvertisingState, 'advertising'> = {
  advertising: [],
};

export const useAdvertisingStore = create<AdvertisingState>()((set) => ({
  ...initialState,
  setAdvertising: (list) => set({ advertising: list }),
  reset: () => set(initialState),
}));

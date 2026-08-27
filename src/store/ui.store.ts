import { create } from 'zustand';

/**
 * Estado global de UI: modales, snackbars, overlays.
 * Acá NO se persiste nada — es estado puramente de UI.
 */

export type ModalId =
  | 'logout'
  | 'emailUnverified'
  | 'resetPassword'
  | 'sessionExpired'
  | 'cartWorkingHours'
  | null;

type UIState = {
  /** Modal activo globalmente. */
  activeModal: ModalId;
  /** Snackbar/toast global. */
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  openModal: (id: Exclude<ModalId, null>) => void;
  closeModal: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
  showSessionExpired: () => void;
  reset: () => void;
};

const initialState: Pick<UIState, 'activeModal' | 'toast'> = {
  activeModal: null,
  toast: null,
};

export const useUIStore = create<UIState>()((set) => ({
  ...initialState,
  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),
  showToast: (message, type = 'info') => set({ toast: { message, type } }),
  clearToast: () => set({ toast: null }),
  showSessionExpired: () => set({ activeModal: 'sessionExpired' }),
  reset: () => set(initialState),
}));

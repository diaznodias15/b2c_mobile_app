import { create } from 'zustand';

/**
 * Store mínimo para el toast global (ej. "Producto agregado al
 * carrito"). El componente `Toast` (montado una sola vez en
 * `Providers.tsx`) es el único que lee `message` — cualquier pantalla
 * puede disparar uno con `useToastStore.getState().show('...')` sin
 * necesitar contexto ni prop drilling.
 */
type ToastState = {
  message: string | null;
  show: (message: string) => void;
  hide: () => void;
};

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  show: (message) => set({ message }),
  hide: () => set({ message: null }),
}));

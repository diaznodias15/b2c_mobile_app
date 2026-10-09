import { create } from 'zustand';

/**
 * Estado EN MEMORIA (no se persiste) del timer de reserva y del aviso de
 * horarios del carrito.
 *
 * - `deadline` (ms epoch) vive aquí y no en un componente para que la cuenta
 *   regresiva siga corriendo al pasar del carrito al checkout (dos pantallas
 *   distintas en la app; en la web es una sola página).
 * - `workingHoursShownFor`: sedes para las que ya se mostró el modal de
 *   horarios en esta sesión. La web lo abre cada vez que se entra a `/carrito`
 *   (una navegación deliberada); aquí el carrito es una tab que se visita
 *   seguido, así que se muestra una vez por sede y sesión para no molestar.
 */
type CartTimerState = {
  deadline: number | null;
  workingHoursShownFor: number[];

  /** Arranca una cuenta nueva de `totalSeconds` desde `now`. */
  start: (totalSeconds: number, now?: number) => void;
  reset: () => void;
  markWorkingHoursShown: (branchId: number) => void;
};

export const useCartTimerStore = create<CartTimerState>()((set) => ({
  deadline: null,
  workingHoursShownFor: [],

  start: (totalSeconds, now = Date.now()) => set({ deadline: now + totalSeconds * 1000 }),
  reset: () => set({ deadline: null }),
  markWorkingHoursShown: (branchId) =>
    set((state) =>
      state.workingHoursShownFor.includes(branchId)
        ? state
        : { workingHoursShownFor: [...state.workingHoursShownFor, branchId] }
    ),
}));

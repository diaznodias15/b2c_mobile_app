import { create } from 'zustand';

import { addFavorite, getFavoriteSlugs, removeFavorite } from '@/api/services/favorites.services';
import { useToastStore } from '@/store/toast.store';

/**
 * Favoritos del cliente (FRONTEND_FAVORITES.md): solo los `tx_slug`, para pintar el corazón en el
 * catálogo sin pedir la lista completa. NO se persiste: se pide una vez al haber sesión y se
 * vacía al cerrarla (otra cuenta no debe ver los corazones de la anterior).
 *
 * NO es optimista: el corazón cambia cuando el backend confirma. Mientras tanto el slug está en
 * `pending` (el botón "late" y ignora toques repetidos); si el servidor rechaza (p. ej. el tope
 * de 200), queda como estaba y se avisa con el mensaje del backend.
 *
 * `user.store` es quien llama a `load`/`reset` (login, sesión restaurada, cierre de sesión);
 * este store NO importa `user.store` para evitar el ciclo.
 */
type FavoritesState = {
  slugs: string[];
  /** `true` cuando ya se pidió la lista de esta sesión. */
  isLoaded: boolean;
  /** Slugs con una petición en curso. */
  pending: string[];
  load: () => Promise<void>;
  /** Agrega o quita. Resuelve `true` si el servidor lo aplicó. */
  toggle: (slug: string) => Promise<boolean>;
  /** Vacía todo (cierre de sesión) e invalida peticiones en vuelo. */
  reset: () => void;
};

const initialState: Pick<FavoritesState, 'slugs' | 'isLoaded' | 'pending'> = {
  slugs: [],
  isLoaded: false,
  pending: [],
};

/** Invalida respuestas viejas: si la sesión cambió mientras se pedía, se descarta. */
let session = 0;

export const useFavoritesStore = create<FavoritesState>()((set, get) => ({
  ...initialState,

  load: async () => {
    const mine = session;
    try {
      const slugs = await getFavoriteSlugs();
      if (mine !== session) return;
      set({ slugs, isLoaded: true });
    } catch (err) {
      // Sin la lista los corazones salen vacíos; no es motivo para molestar al usuario.
      console.warn('[favorites.store] no se pudieron cargar los favoritos:', err);
    }
  },

  toggle: async (slug) => {
    if (get().pending.includes(slug)) return false;
    const mine = session;
    const wasFavorite = get().slugs.includes(slug);
    set((s) => ({ pending: [...s.pending, slug] }));
    try {
      if (wasFavorite) await removeFavorite(slug);
      else await addFavorite(slug);
      if (mine !== session) return false;
      set((s) => ({
        slugs: wasFavorite ? s.slugs.filter((x) => x !== slug) : [slug, ...s.slugs.filter((x) => x !== slug)],
      }));
      return true;
    } catch (err) {
      if (mine === session) {
        useToastStore
          .getState()
          .show(err instanceof Error && err.message ? err.message : 'No pudimos actualizar tus favoritos.');
      }
      return false;
    } finally {
      if (mine === session) set((s) => ({ pending: s.pending.filter((x) => x !== slug) }));
    }
  },

  reset: () => {
    session += 1;
    set(initialState);
  },
}));

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from '@/utils/secureStorage';
import { setToken, getToken } from '@/api/axiosRequest';
import { me } from '@/api/services/auth.services';
import { useCartStore } from '@/store/cart.store';

/**
 * Perfil del usuario autenticado. Forma real de `data` en
 * `POST /api/auth/login` (AUTH_WEB_FLOWS.md) — es un objeto PLANO, no
 * `{ user, token }` anidado, y `id` es un UUID (string), no el id
 * interno de la tabla `users`.
 */
export type User = {
  id: string;
  name: string;
  email: string;
  /** Ya viene formateado del backend: "+58 (0414) 123-4567". */
  tx_phone?: string;
  created_at?: string;
  /** Solo viene en cuentas admin/super-admin — para clientes siempre null. */
  role?: number | null;
  permissions?: unknown[] | null;
};

type UserState = {
  user: User | null;
  /** El token NO se guarda en el store, vive en SecureStore. */
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  /** Setea user + guarda token en SecureStore. */
  signIn: (user: User, token: string) => Promise<void>;
  /** Limpia user + borra token de SecureStore. */
  signOut: () => Promise<void>;
  /** Rehidrata el estado chequeando si hay token en SecureStore. */
  rehydrateAuth: () => Promise<boolean>;
  /**
   * Revalida el perfil con `GET /api/auth/me`. El store persiste el usuario del login,
   * así que sin esto los datos (nombre, teléfono…) quedan viejos y un token vencido
   * sigue pareciendo una sesión activa. Un 401 cierra la sesión por el listener global
   * (`onUnauthorized`); cualquier otro fallo conserva lo que ya hay.
   */
  refreshUser: () => Promise<void>;
  reset: () => void;
};

const initialState: Pick<UserState, 'user' | 'isAuthenticated' | 'isLoading'> = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setUser: (user) => set({ user, isAuthenticated: true }),
      setLoading: (loading) => set({ isLoading: loading }),
      signIn: async (user, token) => {
        await setToken(token);
        set({ user, isAuthenticated: true, isLoading: false });
        // Sube el carrito local a la nube y lo reemplaza por la versión
        // autoritativa del backend — fire-and-forget, no bloquea el
        // login si falla (el carrito local sigue sirviendo mientras tanto).
        useCartStore.getState().setSyncEnabled(true);
        void useCartStore.getState().syncOnLogin();
      },
      signOut: async () => {
        await setToken(null);
        set({ user: null, isAuthenticated: false, isLoading: false });
        useCartStore.getState().setSyncEnabled(false);
      },
      rehydrateAuth: async () => {
        // Leemos directamente de SecureStore para no depender del
        // cache en memoria de axiosRequest (que podría tener un token
        // de otra sesión o tests previos).
        const token = await SecureStore.getItemAsync('auth_token');
        // Sincronizamos el cache de axiosRequest para que el wrapper
        // lo use sin un fetch extra.
        if (token) {
          await getToken();
        }
        if (!token) {
          set({ user: null, isAuthenticated: false });
          useCartStore.getState().setSyncEnabled(false);
          return false;
        }
        // Sesión restaurada (no un login nuevo): prende el sync para
        // mutaciones futuras, pero NO vuelve a mergear — el carrito
        // local ya persiste entre reinicios y ya se sincronizó cuando
        // se creó.
        useCartStore.getState().setSyncEnabled(true);
        // Datos del perfil al día (y detecta un token ya vencido) sin bloquear el arranque.
        void get().refreshUser();
        return true;
      },
      refreshUser: async () => {
        if (!get().isAuthenticated) return;
        try {
          const fresh = await me();
          // La sesión pudo cerrarse mientras se pedía: no resucitar un usuario ya borrado.
          const current = get().user;
          if (get().isAuthenticated && current) set({ user: { ...current, ...fresh } });
        } catch (err) {
          // 401 → el listener global cierra la sesión. Sin red u otro error: se conserva lo local.
          console.warn('[user.store] no se pudo revalidar el perfil:', err);
        }
      },
      reset: () => set(initialState),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Persistimos solo el perfil; el token vive en SecureStore.
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

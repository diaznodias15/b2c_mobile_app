import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from '@/utils/secureStorage';
import { setToken, getToken } from '@/api/axiosRequest';

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
  reset: () => void;
};

const initialState: Pick<UserState, 'user' | 'isAuthenticated' | 'isLoading'> = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      ...initialState,
      setUser: (user) => set({ user, isAuthenticated: true }),
      setLoading: (loading) => set({ isLoading: loading }),
      signIn: async (user, token) => {
        await setToken(token);
        set({ user, isAuthenticated: true, isLoading: false });
      },
      signOut: async () => {
        await setToken(null);
        set({ user: null, isAuthenticated: false, isLoading: false });
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
          return false;
        }
        return true;
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

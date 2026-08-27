import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken, setToken } from '@/api/axiosRequest';

/** Perfil del usuario autenticado. */
export type User = {
  id: number;
  email: string;
  name?: string;
  phone?: string;
  created_at?: string;
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
        const token = await getToken();
        if (!token) {
          set({ user: null, isAuthenticated: false });
          return false;
        }
        // El token existe; dejamos isAuthenticated según lo que diga
        // el store persistido (puede tener user cacheado o no).
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

import { describe, it, expect, beforeEach, vi } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from '@/utils/secureStorage';

vi.mock('@/api/services/cart.services', () => ({
  addProduct: vi.fn().mockResolvedValue(undefined),
  updateQuantity: vi.fn().mockResolvedValue(undefined),
  removeProduct: vi.fn().mockResolvedValue(undefined),
  mergeLocalCart: vi.fn().mockResolvedValue(undefined),
  getCartItems: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/api/services/auth.services', () => ({
  me: vi.fn().mockResolvedValue(undefined),
}));

// eslint-disable-next-line import/first
import { me } from '@/api/services/auth.services';
// eslint-disable-next-line import/first
import { useCartStore } from '@/store/cart.store';
// eslint-disable-next-line import/first
import { useUserStore } from './user.store';

vi.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
vi.mocked(SecureStore.setItemAsync).mockResolvedValue(undefined);
vi.mocked(SecureStore.deleteItemAsync).mockResolvedValue(undefined);

describe('useUserStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useUserStore.getState().reset();
    useCartStore.getState().reset();
    vi.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
    vi.mocked(me).mockReset();
  });

  it('starts with no user and not authenticated', () => {
    const s = useUserStore.getState();
    expect(s.user).toBeNull();
    expect(s.isAuthenticated).toBe(false);
  });

  it('setUser stores user and marks authenticated', () => {
    const user = { id: 'u1', email: 'test@example.com', name: 'Test' };
    useUserStore.getState().setUser(user);
    const s = useUserStore.getState();
    expect(s.user).toEqual(user);
    expect(s.isAuthenticated).toBe(true);
  });

  it('setLoading toggles isLoading', () => {
    useUserStore.getState().setLoading(true);
    expect(useUserStore.getState().isLoading).toBe(true);
    useUserStore.getState().setLoading(false);
    expect(useUserStore.getState().isLoading).toBe(false);
  });

  it('signIn stores user and saves token in SecureStore', async () => {
    const user = { id: 'u1', email: 'test@example.com', name: 'Test' };
    await useUserStore.getState().signIn(user, 'jwt-token-123');
    const s = useUserStore.getState();
    expect(s.user).toEqual(user);
    expect(s.isAuthenticated).toBe(true);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'auth_token',
      'jwt-token-123'
    );
  });

  it('signOut clears user and removes token from SecureStore', async () => {
    await useUserStore.getState().signIn(
      { id: 'u1', email: 'test@example.com', name: 'Test' },
      'jwt-token-123'
    );
    await useUserStore.getState().signOut();
    const s = useUserStore.getState();
    expect(s.user).toBeNull();
    expect(s.isAuthenticated).toBe(false);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
  });

  it('signIn prende el sync del carrito y dispara syncOnLogin', async () => {
    await useUserStore.getState().signIn(
      { id: 'u1', email: 'test@example.com', name: 'Test' },
      'jwt-token-123'
    );
    expect(useCartStore.getState().isSyncEnabled).toBe(true);
  });

  it('signOut apaga el sync del carrito', async () => {
    await useUserStore.getState().signIn(
      { id: 'u1', email: 'test@example.com', name: 'Test' },
      'jwt-token-123'
    );
    await useUserStore.getState().signOut();
    expect(useCartStore.getState().isSyncEnabled).toBe(false);
  });

  it('rehydrateAuth con token prende el sync sin re-mergear', async () => {
    vi.mocked(SecureStore.getItemAsync).mockResolvedValueOnce('existing-token');
    await useUserStore.getState().rehydrateAuth();
    expect(useCartStore.getState().isSyncEnabled).toBe(true);
  });

  it('rehydrateAuth sin token apaga el sync', async () => {
    vi.mocked(SecureStore.getItemAsync).mockResolvedValueOnce(null);
    useCartStore.getState().setSyncEnabled(true);
    await useUserStore.getState().rehydrateAuth();
    expect(useCartStore.getState().isSyncEnabled).toBe(false);
  });

  it('rehydrateAuth returns true if token exists', async () => {
    vi.mocked(SecureStore.getItemAsync).mockResolvedValueOnce('existing-token');
    const hasToken = await useUserStore.getState().rehydrateAuth();
    expect(hasToken).toBe(true);
  });

  it('rehydrateAuth returns false if no token', async () => {
    vi.mocked(SecureStore.getItemAsync).mockResolvedValueOnce(null);
    const hasToken = await useUserStore.getState().rehydrateAuth();
    expect(hasToken).toBe(false);
  });

  it('reset clears state', () => {
    useUserStore.getState().setUser({ id: 'u1', email: 'x@y.com', name: 'Test' });
    useUserStore.getState().setLoading(true);
    useUserStore.getState().reset();
    const s = useUserStore.getState();
    expect(s.user).toBeNull();
    expect(s.isAuthenticated).toBe(false);
    expect(s.isLoading).toBe(false);
  });

  it('persists user and isAuthenticated to AsyncStorage', async () => {
    useUserStore.getState().setUser({ id: 'u1', email: 'persisted@example.com', name: 'Test' });
    await new Promise((r) => setTimeout(r, 10));
    const stored = await AsyncStorage.getItem('user-storage');
    expect(stored).toBeTruthy();
    expect(stored).toContain('persisted@example.com');
  });

  describe('refreshUser (revalida el perfil con /auth/me)', () => {
    const stored = { id: 'u1', email: 'viejo@example.com', name: 'Nombre Viejo', tx_phone: '+58 (0414) 111-1111' };

    it('actualiza los datos del perfil con lo que devuelve el servidor', async () => {
      useUserStore.getState().setUser(stored);
      vi.mocked(me).mockResolvedValueOnce({ ...stored, name: 'Nombre Nuevo', tx_phone: '+58 (0424) 222-2222' });

      await useUserStore.getState().refreshUser();

      const u = useUserStore.getState().user;
      expect(u?.name).toBe('Nombre Nuevo');
      expect(u?.tx_phone).toBe('+58 (0424) 222-2222');
      expect(u?.id).toBe('u1');
    });

    it('conserva los campos que el servidor no devuelve', async () => {
      useUserStore.getState().setUser({ ...stored, created_at: '2026-10-09 10:00:00' });
      vi.mocked(me).mockResolvedValueOnce({ id: 'u1', email: 'viejo@example.com', name: 'Otro' });

      await useUserStore.getState().refreshUser();

      expect(useUserStore.getState().user?.created_at).toBe('2026-10-09 10:00:00');
      expect(useUserStore.getState().user?.name).toBe('Otro');
    });

    it('sin sesión no pide nada', async () => {
      await useUserStore.getState().refreshUser();
      expect(me).not.toHaveBeenCalled();
    });

    it('si falla (sin red, etc.) conserva el usuario guardado', async () => {
      useUserStore.getState().setUser(stored);
      vi.mocked(me).mockRejectedValueOnce(new Error('sin red'));

      await useUserStore.getState().refreshUser();

      expect(useUserStore.getState().user?.name).toBe('Nombre Viejo');
      expect(useUserStore.getState().isAuthenticated).toBe(true);
    });

    it('no resucita al usuario si se cerró la sesión mientras se pedía', async () => {
      useUserStore.getState().setUser(stored);
      let resolveMe: (u: typeof stored) => void = () => {};
      vi.mocked(me).mockReturnValueOnce(new Promise((r) => (resolveMe = r)));

      const pending = useUserStore.getState().refreshUser();
      await useUserStore.getState().signOut();
      resolveMe({ ...stored, name: 'Tarde' });
      await pending;

      expect(useUserStore.getState().user).toBeNull();
      expect(useUserStore.getState().isAuthenticated).toBe(false);
    });

    it('rehydrateAuth con sesión y token revalida el perfil', async () => {
      useUserStore.getState().setUser(stored);
      vi.mocked(SecureStore.getItemAsync).mockResolvedValueOnce('existing-token');
      vi.mocked(me).mockResolvedValueOnce({ ...stored, name: 'Revalidado' });

      await useUserStore.getState().rehydrateAuth();
      await new Promise((r) => setTimeout(r, 0));

      expect(me).toHaveBeenCalledTimes(1);
      expect(useUserStore.getState().user?.name).toBe('Revalidado');
    });
  });
});

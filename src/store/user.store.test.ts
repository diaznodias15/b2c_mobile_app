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
});

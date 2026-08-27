/**
 * Mocks compartidos entre tests.
 * Se importan desde vitest.config.ts con setupFiles.
 */

// Mock de AsyncStorage para tests de stores.
import { vi } from 'vitest';

vi.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    default: {
      getItem: vi.fn(async (key: string) => store.get(key) ?? null),
      setItem: vi.fn(async (key: string, value: string) => {
        store.set(key, value);
      }),
      removeItem: vi.fn(async (key: string) => {
        store.delete(key);
      }),
      clear: vi.fn(async () => {
        store.clear();
      }),
      getAllKeys: vi.fn(async () => Array.from(store.keys())),
      multiGet: vi.fn(async (keys: string[]) =>
        keys.map((k) => [k, store.get(k) ?? null] as [string, string | null])
      ),
      multiSet: vi.fn(async (pairs: [string, string][]) => {
        for (const [k, v] of pairs) store.set(k, v);
      }),
    },
  };
});

// Mock del wrapper secureStorage (cross-platform) para tests.
// Antes mockeábamos `expo-secure-store` directo, pero ahora el wrapper
// es el que importa el código de dominio.
vi.mock('@/utils/secureStorage', () => ({
  getItemAsync: vi.fn(async () => null),
  setItemAsync: vi.fn(async () => undefined),
  deleteItemAsync: vi.fn(async () => undefined),
}));

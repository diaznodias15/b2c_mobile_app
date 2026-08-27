import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getItemAsync,
  setItemAsync,
  deleteItemAsync,
} from './secureStorage.web';

describe('secureStorage.web', () => {
  beforeEach(() => {
    // Limpiamos cualquier stub previo.
    vi.restoreAllMocks();
    // Reset del memory fallback entre tests: lo conseguimos borrando
    // todas las keys que usemos. Cada test usa keys únicas para no chocar.
  });

  describe('con localStorage real', () => {
    beforeEach(() => {
      const store = new Map<string, string>();
      // Stub de localStorage que persiste entre tests del mismo bloque.
      const localStorageMock = {
        getItem: vi.fn((k: string) => store.get(k) ?? null),
        setItem: vi.fn((k: string, v: string) => {
          store.set(k, v);
        }),
        removeItem: vi.fn((k: string) => {
          store.delete(k);
        }),
      };
      (globalThis as any).localStorage = localStorageMock;
    });

    it('setItemAsync guarda el valor y getItemAsync lo lee', async () => {
      await setItemAsync('auth_token', 'jwt-abc');
      const v = await getItemAsync('auth_token');
      expect(v).toBe('jwt-abc');
    });

    it('getItemAsync devuelve null si la key no existe', async () => {
      const v = await getItemAsync('inexistente');
      expect(v).toBeNull();
    });

    it('deleteItemAsync borra la key', async () => {
      await setItemAsync('auth_token', 'jwt-abc');
      await deleteItemAsync('auth_token');
      const v = await getItemAsync('auth_token');
      expect(v).toBeNull();
    });

    it('setItemAsync con valor vacío sigue guardando string vacío', async () => {
      await setItemAsync('auth_token', '');
      const v = await getItemAsync('auth_token');
      expect(v).toBe('');
    });
  });

  describe('cuando localStorage lanza errores (quota, private mode)', () => {
    beforeEach(() => {
      const localStorageMock = {
        getItem: vi.fn(() => {
          throw new Error('SecurityError');
        }),
        setItem: vi.fn(() => {
          throw new Error('QuotaExceeded');
        }),
        removeItem: vi.fn(() => {
          throw new Error('SecurityError');
        }),
      };
      (globalThis as any).localStorage = localStorageMock;
    });

    it('getItemAsync no rompe y devuelve null', async () => {
      const v = await getItemAsync('clave-bug');
      expect(v).toBeNull();
    });

    it('setItemAsync no rompe y cae al memory fallback', async () => {
      // No debe lanzar; debe completar silenciosamente.
      await expect(setItemAsync('clave-bug', 'valor')).resolves.toBeUndefined();
      // Como localStorage está roto, getItemAsync también prueba primero ahí
      // y captura el error, luego consulta el memory fallback y devuelve
      // el valor que setItemAsync recién guardó. La app sigue funcionando
      // aunque localStorage esté inaccesible en el browser.
      const v = await getItemAsync('clave-bug');
      expect(v).toBe('valor');
    });

    it('deleteItemAsync no rompe', async () => {
      await expect(deleteItemAsync('clave-bug')).resolves.toBeUndefined();
    });
  });

  describe('cuando localStorage no existe (SSR, Node puro)', () => {
    beforeEach(() => {
      delete (globalThis as any).localStorage;
    });

    it('getItemAsync devuelve null sin explotar', async () => {
      const v = await getItemAsync('clave-ssr');
      expect(v).toBeNull();
    });

    it('setItemAsync no rompe (memory fallback silencioso)', async () => {
      await expect(
        setItemAsync('clave-ssr', 'valor')
      ).resolves.toBeUndefined();
    });

    it('deleteItemAsync no rompe', async () => {
      await expect(deleteItemAsync('clave-ssr')).resolves.toBeUndefined();
    });
  });
});

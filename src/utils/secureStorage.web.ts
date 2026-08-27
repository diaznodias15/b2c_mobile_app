/**
 * Implementación web del secureStorage.
 *
 * Usa `localStorage` del navegador como fallback de `expo-secure-store`
 * (que es nativo-only en SDK 57 y no tiene polyfill web oficial).
 *
 * **NO es seguro** — el token queda en texto plano en localStorage. Solo
 * lo usamos para dev/testing de Fase 1-2 en `npm run web`. Cuando entremos
 * a Fase 3+ con testing real en iPhone, se sustituye por httpOnly cookies
 * o re-evaluamos.
 *
 * Mantiene la misma API que `expo-secure-store` para que el código de
 * dominio (`axiosRequest`, `useUserStore`) no sepa en qué plataforma corre.
 */

const memoryFallback = new Map<string, string>();

function safeStorage(): Storage | null {
  if (typeof globalThis === 'undefined') return null;
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export async function getItemAsync(key: string): Promise<string | null> {
  const storage = safeStorage();
  if (storage) {
    try {
      return storage.getItem(key);
    } catch {
      // ignore
    }
  }
  return memoryFallback.get(key) ?? null;
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  const storage = safeStorage();
  if (storage) {
    try {
      storage.setItem(key, value);
      return;
    } catch {
      // quota, private mode, etc → caemos a memoria
    }
  }
  memoryFallback.set(key, value);
}

export async function deleteItemAsync(key: string): Promise<void> {
  const storage = safeStorage();
  if (storage) {
    try {
      storage.removeItem(key);
    } catch {
      // ignore
    }
  }
  memoryFallback.delete(key);
}

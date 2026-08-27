import { create, type AxiosInstance, type AxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, API_TIMEOUT_MS } from './config';

/**
 * Wrapper de axios equivalente al `axiosRequest` de la web.
 *
 * - Dedup de requests idénticos en ventana de 5s.
 * - Inyecta token desde SecureStore (Keychain/Keystore).
 * - Timeout 60s por defecto.
 * - Soporta AbortController vía `signal`.
 * - Reintentos opcionales.
 *
 * Las funciones de servicio (en services/*) consumen este wrapper;
 * nunca se llama axios directo desde la UI.
 */

const TOKEN_KEY = 'auth_token';

const ongoing = new Map<string, Promise<unknown>>();
const history = new Map<string, number>();
const DEDUP_WINDOW_MS = 5_000;

let memoryToken: string | null = null;

export async function getToken(): Promise<string | null> {
  if (memoryToken) return memoryToken;
  try {
    const stored = await SecureStore.getItemAsync(TOKEN_KEY);
    memoryToken = stored;
    return stored;
  } catch {
    return null;
  }
}

export async function setToken(token: string | null): Promise<void> {
  memoryToken = token;
  if (token) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
}

const instance: AxiosInstance = create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

instance.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type RequestOptions = Omit<AxiosRequestConfig, 'signal' | 'cancelToken'> & {
  signal?: AbortSignal;
  dedup?: boolean;
};

function makeKey(method: string, url: string, data?: unknown): string {
  return `${method.toUpperCase()}::${url}::${data ? JSON.stringify(data) : ''}`;
}

export async function axiosRequest<T = unknown>(
  options: RequestOptions
): Promise<T> {
  const { signal, dedup = true, method = 'GET', url = '', data, ...rest } = options;
  const key = makeKey(method, url, data);

  if (dedup && method.toUpperCase() === 'GET') {
    const last = history.get(key);
    const inFlight = ongoing.get(key);
    if (inFlight) return inFlight as Promise<T>;
    if (last && Date.now() - last < DEDUP_WINDOW_MS) {
      throw new Error('DUPLICATE_REQUEST');
    }
  }

  const promise = instance
    .request<T>({ method, url, data, signal, ...rest })
    .then((res) => {
      history.set(key, Date.now());
      return res.data;
    })
    .finally(() => {
      ongoing.delete(key);
    });

  if (dedup && method.toUpperCase() === 'GET') {
    ongoing.set(key, promise);
  }

  return promise;
}

export { instance as axiosInstance };

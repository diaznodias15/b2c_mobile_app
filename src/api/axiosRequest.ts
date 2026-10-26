import { create, type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { useToastStore } from '@/store/toast.store';
import {
  getRetryDelayMs,
  RATE_LIMIT_MAX_RETRIES,
  RATE_LIMIT_MESSAGE,
  RATE_LIMIT_NOTICE_WINDOW_MS,
} from '@/utils/rateLimit';
import * as SecureStore from '@/utils/secureStorage';
import { API_BASE_URL, API_TIMEOUT_MS } from './config';

/**
 * Wrapper de axios equivalente al `axiosRequest` de la web.
 *
 * - Dedup de requests idénticos en ventana de 5s.
 * - Inyecta token desde SecureStore (Keychain/Keystore).
 * - Timeout 60s por defecto.
 * - Soporta AbortController vía `signal`.
 * - Un GET que recibe 429 se reintenta hasta 2 veces respetando `Retry-After`
 *   (ver `utils/rateLimit.ts`). POST/PUT/DELETE NUNCA se repiten solos: crear
 *   una orden o tocar el carrito no debe duplicarse.
 *
 * Las funciones de servicio (en services/*) consumen este wrapper;
 * nunca se llama axios directo desde la UI.
 */

const TOKEN_KEY = 'auth_token';

const ongoing = new Map<string, Promise<unknown>>();
const history = new Map<string, number>();
const DEDUP_WINDOW_MS = 5_000;

/** Mensaje del error que se lanza cuando un GET idéntico cae dentro de la ventana de 5 s. */
export const DUPLICATE_REQUEST_ERROR = 'DUPLICATE_REQUEST';

/**
 * Un duplicado descartado NO es un fallo real (el dato ya se pidió hace
 * instantes): quien lo capture no debe mostrar error ni marcar el estado como
 * fallido.
 */
export function isDuplicateRequestError(err: unknown): boolean {
  return err instanceof Error && err.message === DUPLICATE_REQUEST_ERROR;
}

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

let lastRateLimitNoticeAt = 0;

/** Un solo aviso de "muchas solicitudes" por ventana, aunque fallen varias peticiones. */
function notifyRateLimited(): void {
  const now = Date.now();
  if (now - lastRateLimitNoticeAt < RATE_LIMIT_NOTICE_WINDOW_MS) return;
  lastRateLimitNoticeAt = now;
  useToastStore.getState().show(RATE_LIMIT_MESSAGE);
}

/** Espera `ms`; si se cancela con `signal`, resuelve `false` para abandonar sin error. */
function waitCancelable(ms: number, signal?: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    if (signal?.aborted) return resolve(false);
    const onAbort = () => {
      clearTimeout(timer);
      resolve(false);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve(true);
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
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
      throw new Error(DUPLICATE_REQUEST_ERROR);
    }
  }

  const isGet = method.toUpperCase() === 'GET';

  // Los reintentos viven DENTRO de la promesa registrada en `ongoing`: mientras espera, la
  // petición sigue "en curso" y la deduplicación no lanza otra igual.
  const send = async (): Promise<{ data: T }> => {
    for (let attempt = 0; ; attempt++) {
      try {
        return await instance.request<T>({ method, url, data, signal, ...rest });
      } catch (err: any) {
        const status = err?.response?.status;
        if (status !== 429) throw err;
        const delay = getRetryDelayMs(attempt, err?.response?.headers?.['retry-after']);
        err.retryAfterMs = delay;
        if (!isGet || attempt >= RATE_LIMIT_MAX_RETRIES) {
          notifyRateLimited();
          throw err;
        }
        if (!(await waitCancelable(delay, signal))) throw err;
      }
    }
  };

  const promise = send()
    .then((res) => {
      history.set(key, Date.now());
      return res.data;
    })
    .catch((err) => {
      // Centralizamos el manejo de 401 vía un evento para evitar
      // ciclos de imports. Quien quiera reaccionar (e.g. el root layout)
      // se suscribe a onUnauthorized().
      if (err?.response?.status === 401) {
        listeners.unauthorized.forEach((cb) => {
          try {
            cb();
          } catch (cbErr) {
            console.error('[axiosRequest] unauthorized listener failed:', cbErr);
          }
        });
      }
      // Re-throw con mensaje limpio del backend.
      const backendMessage =
        err?.response?.data?.message || err?.message || 'Error de red';
      const error = new Error(backendMessage) as Error & { status?: number; retryAfterMs?: number };
      if (err?.response?.status) error.status = err.response.status;
      if (typeof err?.retryAfterMs === 'number') error.retryAfterMs = err.retryAfterMs;
      throw error;
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

/* ============================================================
 * Listeners para 401 — patrón observer para evitar ciclos.
 * Se suscriben desde el root layout al iniciar la app.
 * ============================================================ */

type UnauthorizedListener = () => void;

const listeners: { unauthorized: Set<UnauthorizedListener> } = {
  unauthorized: new Set(),
};

export function onUnauthorized(cb: UnauthorizedListener): () => void {
  listeners.unauthorized.add(cb);
  return () => listeners.unauthorized.delete(cb);
}

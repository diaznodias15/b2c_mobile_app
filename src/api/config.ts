/**
 * Variables de entorno de runtime.
 *
 * Para Expo SDK 57, las vars públicas se leen con `process.env.EXPO_PUBLIC_*`
 * o con un app.config que las inyecte en `extra`. Acá las centralizamos
 * para tener un solo punto de cambio.
 *
 * En dev, podés setearlas en `.env` (prefijo EXPO_PUBLIC_):
 *   EXPO_PUBLIC_API_URL=https://api-farmasaman.icommerce360.com
 *   EXPO_PUBLIC_API_TIMEOUT=60000
 */

const fallbackBaseUrl = 'https://api-farmasaman.icommerce360.com';
const fallbackTimeout = 60_000;

function readEnv(name: string, fallback: string): string {
  // process.env está tipado en runtime por Expo Metro
  const value = (process.env as Record<string, string | undefined>)?.[name];
  return value && value.length > 0 ? value : fallback;
}

function readEnvNumber(name: string, fallback: number): number {
  const raw = readEnv(name, String(fallback));
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

export const API_BASE_URL = readEnv('EXPO_PUBLIC_API_URL', fallbackBaseUrl);
export const API_TIMEOUT_MS = readEnvNumber('EXPO_PUBLIC_API_TIMEOUT', fallbackTimeout);

/** Versión del build, útil para debugging. */
export const APP_VERSION = '1.0.0';

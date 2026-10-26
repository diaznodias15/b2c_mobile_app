/** Reintentos máximos de un GET que recibe 429. */
export const RATE_LIMIT_MAX_RETRIES = 2;
const BASE_DELAY_MS = 1_000;
export const RATE_LIMIT_MAX_DELAY_MS = 10_000;
/** Ventana mínima entre dos avisos de "muchas solicitudes". */
export const RATE_LIMIT_NOTICE_WINDOW_MS = 5_000;
export const RATE_LIMIT_MESSAGE = 'Estás realizando muchas solicitudes. Espera unos segundos e intenta nuevamente.';

/** Milisegundos que pide la cabecera `Retry-After` (segundos o fecha HTTP), o `null` si no sirve. */
export function parseRetryAfterMs(header: unknown, now: number = Date.now()): number | null {
  if (header === undefined || header === null) return null;
  const raw = String(header).trim();
  if (!raw) return null;
  if (/^\d+(\.\d+)?$/.test(raw)) return Math.round(Number(raw) * 1000);
  const date = Date.parse(raw);
  return Number.isNaN(date) ? null : date - now;
}

/**
 * Espera antes del reintento número `attempt` (0 = el primero): lo que pida `Retry-After`, o
 * espera creciente (1 s, 2 s…) con un poco de azar, acotado siempre a [0, 10 s].
 */
export function getRetryDelayMs(
  attempt: number,
  retryAfterHeader?: unknown,
  random: () => number = Math.random,
  now: number = Date.now()
): number {
  const fromHeader = parseRetryAfterMs(retryAfterHeader, now);
  const ms = fromHeader ?? BASE_DELAY_MS * 2 ** attempt + Math.floor(random() * 250);
  return Math.min(Math.max(ms, 0), RATE_LIMIT_MAX_DELAY_MS);
}

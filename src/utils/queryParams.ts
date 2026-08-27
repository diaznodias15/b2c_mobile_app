/**
 * Serializa un objeto a query string omitiendo null, undefined y "".
 * Equivalente al `queryParams` de la web — útil para mantener
 * `branch: null` como "usar default del backend".
 */
export function toQueryString(params: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'string' && value.length === 0) continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return parts.length === 0 ? '' : `?${parts.join('&')}`;
}

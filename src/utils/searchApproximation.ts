/**
 * Búsqueda aproximada (doc 19 §F). Si lo escrito no da ningún resultado, el backend prueba con la
 * última palabra acortada y, si encuentra productos, lo avisa en `metadata`. La app NUNCA debe
 * presentar ese resultado como si fuera lo escrito (es una farmacia).
 */

export type SearchApproximation = {
  /** Lo que escribió el cliente (el backend lo devuelve en mayúsculas). */
  original_term: string;
  /** Lo que realmente se buscó tras acortar. No se muestra al cliente. */
  matched_term: string;
};

/**
 * Normaliza `metadata` del backend: `approximate === true` → `{ original_term, matched_term }`;
 * en cualquier otro caso (campo ausente, `null`, `false`, `"true"`…) → `null`. Se informa siempre
 * (con `null` si no hubo aproximación) para que un aviso anterior no quede pegado.
 */
export function adaptSearchApproximation(metadata: unknown): SearchApproximation | null {
  if (metadata == null || typeof metadata !== 'object') return null;
  const m = metadata as Record<string, unknown>;
  if (m.approximate !== true) return null;
  return {
    original_term: typeof m.original_term === 'string' ? m.original_term : '',
    matched_term: typeof m.matched_term === 'string' ? m.matched_term : '',
  };
}

/**
 * Texto del aviso, en UNA línea y con lo que tecleó el cliente. No menciona el término recortado
 * ni ofrece repetir la búsqueda exacta (decisión de producto). Si el backend no devolvió
 * `original_term`, se usa lo que hay en el buscador.
 */
export function getApproximationNotice(approximation: SearchApproximation, typed: string): string {
  const term = (approximation.original_term || typed).trim();
  return `Sin resultados exactos para «${term}». Mostramos productos similares.`;
}

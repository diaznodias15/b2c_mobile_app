/**
 * Qué debe mostrar el detalle de producto según el estado de su consulta.
 *
 * Antes se pintaba el esqueleto cuando `isLoading || !product`, así que una
 * consulta fallida, deshabilitada o sin datos dejaba el esqueleto para siempre
 * (parecía "cargando" indefinidamente, sin mensaje ni forma de reintentar).
 *
 * El orden importa:
 *  1. sin `slug` o sin sede no hay consulta posible → mensaje propio;
 *  2. con datos se muestra el producto aunque un refetch posterior falle;
 *  3. mientras se (re)pide, esqueleto — así "Reintentar" muestra la carga y no
 *     el error viejo (en TanStack Query `isError` sigue en true durante el refetch);
 *  4. si ya no se está pidiendo y falló → error;
 *  5. éxito pero sin producto → no encontrado.
 */
export type ProductDetailView =
  | 'ready'
  | 'loading'
  | 'slow'
  | 'error'
  | 'no-branch'
  | 'not-found';

export function getProductDetailView(input: {
  hasSlug: boolean;
  hasBranch: boolean;
  hasData: boolean;
  isFetching: boolean;
  isError: boolean;
  /** Lleva más de lo razonable cargando (ver `useSlowLoading`). */
  isSlow: boolean;
}): ProductDetailView {
  if (!input.hasSlug) return 'not-found';
  if (!input.hasBranch) return 'no-branch';
  if (input.hasData) return 'ready';
  if (input.isFetching) return input.isSlow ? 'slow' : 'loading';
  if (input.isError) return 'error';
  return 'not-found';
}

/**
 * Re-export de la pantalla principal del carrito.
 * El Stack vive en `./cart/_layout.tsx` con las sub-rutas
 * entrega / pago / confirmar / listo. Este archivo hace
 * que `/cart` resuelva a `./cart/index.tsx`.
 */
export { default } from './cart/index';

import { create } from 'zustand';
import type { ImageSourcePropType } from 'react-native';

export type FlyRect = { x: number; y: number; width: number; height: number };

type Flight = { id: number; source: ImageSourcePropType; rect: FlyRect };

/**
 * Estado de la animación "flying to cart" ("la imagen vuela hacia el
 * carrito" al agregar un producto). `FlyingCartOverlay` (montado una
 * sola vez en Providers.tsx) es el único que lee `flight`/
 * `cartIconPosition` — cualquier botón "Agregar al carrito"
 * (ProductCard, ProductListItem, product/[slug].tsx) mide la posición
 * en pantalla de su propia imagen y llama `startFly`, sin acoplarse al
 * componente que la anima.
 *
 * `bounceSignal` es un contador que `BottomTabs` observa para hacer
 * rebotar el ícono del carrito cuando la animación "aterriza" — un
 * número que cambia siempre dispara el efecto, sin necesidad de un
 * booleano que haya que resetear a mano.
 */
type FlyingCartState = {
  cartIconPosition: { x: number; y: number } | null;
  setCartIconPosition: (pos: { x: number; y: number }) => void;
  flight: Flight | null;
  bounceSignal: number;
  startFly: (source: ImageSourcePropType, rect: FlyRect) => void;
  clearFly: () => void;
};

let nextFlightId = 0;

export const useFlyingCartStore = create<FlyingCartState>((set) => ({
  cartIconPosition: null,
  setCartIconPosition: (pos) => set({ cartIconPosition: pos }),
  flight: null,
  bounceSignal: 0,
  startFly: (source, rect) => set({ flight: { id: ++nextFlightId, source, rect } }),
  clearFly: () => set((state) => ({ flight: null, bounceSignal: state.bounceSignal + 1 })),
}));

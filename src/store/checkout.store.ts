import { create } from 'zustand';

import type {
  ContactInfo,
  DeliveryAddress,
  FulfillmentType,
  PaymentMethod,
} from '@/types/cart';

/**
 * Estado del wizard de checkout (no persistimos — si el usuario
 * cierra la app, vuelve a empezar el checkout).
 *
 * Stepper:
 *  - Lite: cart → confirmar → listo (2 pasos despues del cart)
 *  - Full: cart → entrega → pago → confirmar → listo (3 pasos despues)
 *
 * El step actual NO se guarda en URL para no ensuciar el router;
 * se navega explícitamente entre rutas en `src/app/cart/`.
 */

type CheckoutState = {
  fulfillment: FulfillmentType | null;
  deliveryAddress: DeliveryAddress | null;
  paymentMethod: PaymentMethod | null;
  paymentReference: string;
  comments: string;
  contact: ContactInfo | null;

  setFulfillment: (f: FulfillmentType) => void;
  setDeliveryAddress: (a: DeliveryAddress) => void;
  setPaymentMethod: (m: PaymentMethod) => void;
  setPaymentReference: (ref: string) => void;
  setComments: (c: string) => void;
  setContact: (c: ContactInfo) => void;
  reset: () => void;
};

const initialState: Pick<
  CheckoutState,
  | 'fulfillment'
  | 'deliveryAddress'
  | 'paymentMethod'
  | 'paymentReference'
  | 'comments'
  | 'contact'
> = {
  fulfillment: null,
  deliveryAddress: null,
  paymentMethod: null,
  paymentReference: '',
  comments: '',
  contact: null,
};

export const useCheckoutStore = create<CheckoutState>()((set) => ({
  ...initialState,
  setFulfillment: (f) =>
    set({ fulfillment: f, deliveryAddress: f === 'PICKUP' ? null : undefined }),
  setDeliveryAddress: (a) => set({ deliveryAddress: a }),
  setPaymentMethod: (m) => set({ paymentMethod: m }),
  setPaymentReference: (ref) => set({ paymentReference: ref }),
  setComments: (c) => set({ comments: c }),
  setContact: (c) => set({ contact: c }),
  reset: () => set(initialState),
}));

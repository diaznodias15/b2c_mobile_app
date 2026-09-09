import { create } from 'zustand';

import type {
  ContactInfo,
  DeliveryAddress,
  FulfillmentType,
} from '@/types/cart';
import type { PaymentMethodCode } from '@/types/orders';

/**
 * Estado del wizard de checkout Full (no persistimos — si el usuario
 * cierra la app, vuelve a empezar el checkout). El checkout Lite NO
 * usa este store — es un solo paso con `ContactInfo` directo, sin
 * necesidad de estado compartido entre pantallas.
 *
 * Equivalente al `CheckoutProvider` de la web (CHECKOUT-FLOW.md §4):
 * separa `fulfillment` (entrega) de `payment` (pago) en la misma idea,
 * aplanado acá en un solo store de Zustand en vez de un Context con 2
 * namespaces — mismo shape de datos, un solo lugar para leerlo/
 * escribirlo desde `EntregaStep`/`PagoStep`/`checkout.tsx`.
 *
 * `paymentMethod` es el CÓDIGO del método (`PaymentMethodCode`), no un
 * objeto — antes estaba mal tipado como un objeto `{id, nb_payment_method}`
 * que en realidad correspondía a la forma de un "receptor" configurado
 * por el admin, no al método elegido por el cliente (ver
 * `types/checkout.ts` → `PaymentMethodsConfig`).
 */

type CheckoutState = {
  fulfillment: FulfillmentType | null;
  deliveryAddress: DeliveryAddress | null;
  /** Nombre/teléfono de quien RECIBE el pedido — solo DELIVERY, distinto del `contact` del checkout Lite. */
  recipientName: string;
  recipientPhone: string;
  paymentMethod: PaymentMethodCode | null;
  paymentReference: string;
  /** Monto que el cliente reporta haber pagado — auto-calculado al elegir método, pero editable (CHECKOUT-FLOW.md §13.5). */
  paymentAmount: number | null;
  paymentCurrency: 'Bs.' | 'USD.';
  /** Banco de origen del pago — solo PAGOMOVIL/TRANSFERENCIA. */
  bankOrigin: string;
  /** Titular de la cuenta que envía el Zelle — solo ZELLE. */
  depositorName: string;
  /** Teléfono del pagador — solo PAGOMOVIL (distinto del teléfono del destinatario en delivery). */
  payerPhone: string;
  comments: string;
  contact: ContactInfo | null;
  /**
   * Costo de envío calculado vía `calculate-delivery` (distancia real) —
   * `null` significa "no se pudo cotizar" (sede sin regla configurada,
   * sin coordenadas, o error de red), NO "envío gratis". El checkout
   * debe mostrar "se coordina por WhatsApp" en ese caso, nunca asumir 0.
   */
  deliveryFee: number | null;
  isCalculatingDeliveryFee: boolean;

  setFulfillment: (f: FulfillmentType) => void;
  setDeliveryAddress: (a: DeliveryAddress) => void;
  setRecipientName: (name: string) => void;
  setRecipientPhone: (phone: string) => void;
  setPaymentMethod: (m: PaymentMethodCode | null) => void;
  setPaymentReference: (ref: string) => void;
  setPaymentAmount: (amount: number | null) => void;
  setPaymentCurrency: (currency: 'Bs.' | 'USD.') => void;
  setBankOrigin: (bank: string) => void;
  setDepositorName: (name: string) => void;
  setPayerPhone: (phone: string) => void;
  setComments: (c: string) => void;
  setContact: (c: ContactInfo) => void;
  setDeliveryFee: (fee: number | null) => void;
  setIsCalculatingDeliveryFee: (loading: boolean) => void;
  reset: () => void;
};

const initialState: Omit<
  CheckoutState,
  | 'setFulfillment'
  | 'setDeliveryAddress'
  | 'setRecipientName'
  | 'setRecipientPhone'
  | 'setPaymentMethod'
  | 'setPaymentReference'
  | 'setPaymentAmount'
  | 'setPaymentCurrency'
  | 'setBankOrigin'
  | 'setDepositorName'
  | 'setPayerPhone'
  | 'setComments'
  | 'setContact'
  | 'setDeliveryFee'
  | 'setIsCalculatingDeliveryFee'
  | 'reset'
> = {
  fulfillment: null,
  deliveryAddress: null,
  recipientName: '',
  recipientPhone: '',
  paymentMethod: null,
  paymentReference: '',
  paymentAmount: null,
  paymentCurrency: 'Bs.',
  bankOrigin: '',
  depositorName: '',
  payerPhone: '',
  comments: '',
  contact: null,
  deliveryFee: null,
  isCalculatingDeliveryFee: false,
};

export const useCheckoutStore = create<CheckoutState>()((set) => ({
  ...initialState,
  setFulfillment: (f) =>
    set((state) => ({
      fulfillment: f,
      // Al volver a PICKUP se limpia la dirección — al pasar a DELIVERY
      // se conserva lo que el usuario ya haya cargado (antes se pisaba
      // con `undefined` sin motivo).
      deliveryAddress: f === 'PICKUP' ? null : state.deliveryAddress,
      deliveryFee: f === 'PICKUP' ? null : state.deliveryFee,
    })),
  setDeliveryAddress: (a) => set({ deliveryAddress: a }),
  setRecipientName: (name) => set({ recipientName: name }),
  setRecipientPhone: (phone) => set({ recipientPhone: phone }),
  setPaymentMethod: (m) => set({ paymentMethod: m }),
  setPaymentReference: (ref) => set({ paymentReference: ref }),
  setPaymentAmount: (amount) => set({ paymentAmount: amount }),
  setPaymentCurrency: (currency) => set({ paymentCurrency: currency }),
  setBankOrigin: (bank) => set({ bankOrigin: bank }),
  setDepositorName: (name) => set({ depositorName: name }),
  setPayerPhone: (phone) => set({ payerPhone: phone }),
  setComments: (c) => set({ comments: c }),
  setContact: (c) => set({ contact: c }),
  setDeliveryFee: (fee) => set({ deliveryFee: fee }),
  setIsCalculatingDeliveryFee: (loading) => set({ isCalculatingDeliveryFee: loading }),
  reset: () => set(initialState),
}));

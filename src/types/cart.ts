/**
 * Tipos del carrito y el flujo de checkout.
 *
 * El carrito es OFFLINE-FIRST: vive en Zustand+AsyncStorage y
 * sincroniza con el backend cuando hay token. Esto permite que
 * la app funcione sin auth y sin red, igual que la web.
 */

import type { Envelope } from '@/types/whitelabel';

/** Item del carrito tal como vive en el store local. */
export type CartItem = {
  /** Slug del producto (clave única en el carrito). */
  tx_slug: string;
  /** ID numérico (lo necesitamos para `add-product` del backend). */
  product_id: number;
  /** Sede a la que aplica este item. */
  branch_id: number;
  nb_product: string;
  nb_brand: string;
  tx_img_url?: string | null;
  /** Precio unitario FINAL (con impuestos) en USD, como string. */
  pri_product_final_price: string;
  qty: number;
  /** Timestamp del último add, para que el item más reciente quede arriba. */
  added_at: number;
};

export type FulfillmentType = 'PICKUP' | 'DELIVERY';

/** Datos de envío para DELIVERY. */
export type DeliveryAddress = {
  /** Texto legible (calle, referencia). */
  tx_address: string;
  lat?: number;
  lng?: number;
  /** ID de location guardada (si viene de /api/users/locations). */
  location_id?: number;
};

/** Datos de contacto que pide el modo Lite al confirmar. */
export type ContactInfo = {
  tx_name: string;
  tx_phone: string;
  tx_email?: string;
  tx_id_number?: string;
};

/** Método de pago elegido. */
export type PaymentMethod = {
  id: number;
  nb_payment_method: string;
  /** Algunos métodos requieren referencia (transfer, zelle). */
  requires_reference?: number | boolean;
  tx_logo_url?: string | null;
};

export type CartServiceResponse<T> = Envelope<T> & {
  data: T;
  pagination?: never;
  metadata?: never;
};

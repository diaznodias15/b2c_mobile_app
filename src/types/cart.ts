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
  /** Precio unitario FINAL (con impuestos y descuento aplicados) en Bs. — ver `Product.pri_product_price`. */
  pri_product_final_price: string;
  /**
   * Precio unitario BASE (sin descuento ni IVA) y los % de descuento/IVA
   * — opcionales porque los carritos persistidos ANTES de este campo no
   * lo tienen (AsyncStorage). Sin esto, `getCartSummary()` no puede
   * desglosar Subtotal/Descuento/IVA para ese item y cae a 0 (ver
   * `utils/pricing.ts`). Mismos campos que `Product.pri_product_price`/
   * `qty_discount`/`qty_tax` — ver PRODUCTS-CALCULATIONS.md.
   */
  pri_product_price?: string;
  qty_discount?: number | string;
  qty_tax?: number | string;
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

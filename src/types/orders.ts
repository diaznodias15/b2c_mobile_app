import type { FulfillmentType } from '@/types/cart';

/**
 * Estados posibles de una orden (MY-ORDERS-MODULE.md §25). `CANCELED`
 * es especial: no se muestra en el `OrderStatusStepper`, se muestra
 * `OrderStatusAlert` en su lugar.
 */
export type OrderStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'PROCESSING'
  | 'PROCESSED'
  | 'FINISHED'
  | 'CANCELED';

export type PaymentMethodCode =
  | 'PUNTODEVENTA'
  | 'EFECTIVO'
  | 'PAGOMOVIL'
  | 'TRANSFERENCIA'
  | 'ZELLE'
  | 'EXPRESS';

/**
 * Orden en la lista paginada (`GET /api/orders/my-orders/branch/:branch`).
 * Los numéricos vienen como STRING del backend (`.toFixed(2)`-like) —
 * hay que convertirlos con `Number()` antes de operar (MY-ORDERS-MODULE.md §5.2).
 */
export type Order = {
  tx_order_number: string;
  tx_status: OrderStatus;
  qty_total_amount: string;
  dt_created_at: string;
  qty_items: string;
  qty_units: string;
  amt_exchange_rate: string;
  tx_branch_alias: string;
};

export type OrderProductItem = {
  cod_barcode: string;
  nb_product: string;
  nb_brand?: string;
  qty_product: string;
  pri_product_final_price: string;
  tx_slug: string;
  tx_img_url?: string | null;
  amt_exchange_rate: number;
};

/**
 * Detalle de una orden (`GET /api/orders/detail/:txOrderNumber`). A
 * diferencia de `Order`, acá los numéricos vienen como NUMBER, no
 * string (MY-ORDERS-MODULE.md §6.3).
 */
export type OrderDetail = {
  tx_order_number: string;
  tx_status: OrderStatus;
  /** 0=PENDING, 1=APPROVED, 2=PROCESSING, 3=PROCESSED, 4=FINISHED. */
  in_status: number;
  qty_subtotal_amount: number;
  qty_tax_amount: number;
  qty_discount_amount: number;
  qty_igtf_amount: number;
  qty_delivery_amount: number;
  qty_total_amount: number;
  dt_created_at: string;
  qty_items: number;
  qty_units: number;
  fulfillment_type: FulfillmentType;
  tx_delivery_mode?: 'EXPRESS' | 'STANDARD';
  tx_branch_alias: string;
  tx_payment_method: PaymentMethodCode;
  amt_exchange_rate: number;
  /** Solo presente si tx_status === 'CANCELED'. */
  tx_canceled_note?: string;
  product_items: OrderProductItem[];
};

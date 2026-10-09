import type { CreateOrderPayload } from '@/api/services/orders.services';
import { VE_COUNTRY_CODE } from '@/utils/phone';

/**
 * Payload de `POST /api/orders/create` en modo Lite.
 *
 * Es un contrato con el backend (`CreateOrder.php` + `OrderController.php`),
 * por eso vive en una función pura con test: con `is_lite_mode = 1` exige las
 * 3 partes del teléfono aun en retiro (sin ellas responde 400 "El código del
 * país es requerido."), y `TBD` ("Por definir") es el `fulfillment_type` que
 * solo se acepta en Lite. No incluye nombre, dirección ni datos de pago.
 */
export function buildLiteOrderPayload(input: {
  branchId: number;
  areaCode: string;
  phoneNumber: string;
  products: CreateOrderPayload['products'];
}): CreateOrderPayload {
  return {
    branch_id: input.branchId,
    fulfillment_type: 'TBD',
    tx_delivery_mode: 'EXPRESS',
    tx_payment_method: 'EXPRESS',
    qty_delivery_amount: 0,
    tx_currency_code: 'Bs.',
    is_lite: 1,
    tx_recipient_country_code: VE_COUNTRY_CODE,
    tx_recipient_area_code: input.areaCode,
    tx_recipient_phone_number: input.phoneNumber,
    products: input.products,
  };
}

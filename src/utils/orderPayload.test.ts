import { describe, expect, it } from 'vitest';

import { buildLiteOrderPayload } from './orderPayload';

describe('buildLiteOrderPayload', () => {
  const payload = buildLiteOrderPayload({
    branchId: 3,
    areaCode: '0414',
    phoneNumber: '456-7890',
    products: [{ tx_slug: 'atamel-forte', qty_product: 2 }],
  });

  it('usa fulfillment_type TBD, EXPRESS e is_lite (contrato del modo Lite)', () => {
    expect(payload.fulfillment_type).toBe('TBD');
    expect(payload.tx_payment_method).toBe('EXPRESS');
    expect(payload.tx_delivery_mode).toBe('EXPRESS');
    expect(payload.is_lite).toBe(1);
    expect(payload.tx_currency_code).toBe('Bs.');
    expect(payload.qty_delivery_amount).toBe(0);
  });

  it('manda el teléfono en las 3 partes que exige el backend', () => {
    expect(payload.tx_recipient_country_code).toBe('+58');
    expect(payload.tx_recipient_area_code).toBe('0414');
    expect(payload.tx_recipient_phone_number).toBe('456-7890');
  });

  it('conserva la sede y los productos', () => {
    expect(payload.branch_id).toBe(3);
    expect(payload.products).toEqual([{ tx_slug: 'atamel-forte', qty_product: 2 }]);
  });

  it('no manda nombre, dirección ni datos de pago', () => {
    expect(payload.tx_recipient_name).toBeUndefined();
    expect(payload.tx_recipient_address).toBeUndefined();
    expect(payload.tx_payment_reference).toBeUndefined();
    expect(payload.dt_delivery_date).toBeUndefined();
  });
});

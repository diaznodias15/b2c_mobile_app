import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/axiosRequest', () => ({
  axiosRequest: vi.fn(),
}));
// eslint-disable-next-line import/first
import { axiosRequest } from '@/api/axiosRequest';
// eslint-disable-next-line import/first
import { createOrder } from './orders.services';

const mockAxios = vi.mocked(axiosRequest);

describe('orders.services', () => {
  beforeEach(() => vi.clearAllMocks());

  it('createOrder: POST con payload y devuelve data', async () => {
    mockAxios.mockResolvedValueOnce({
      status: 'OK',
      data: { tx_order_number: 'ORD-12345', total: 1500 },
    });
    const r = await createOrder({
      branch_id: 1,
      fulfillment_type: 'PICKUP',
      payment_method_id: 2,
      products: [{ tx_slug: 'a', qty_product: 1 }],
    });
    expect(r.tx_order_number).toBe('ORD-12345');
    expect(mockAxios.mock.calls[0][0].method).toBe('POST');
    expect(mockAxios.mock.calls[0][0].url).toBe('/api/orders/create');
  });

  it('createOrder: fallback a {tx_order_number: ""} si data es null', async () => {
    mockAxios.mockResolvedValueOnce({ status: 'OK', data: null });
    const r = await createOrder({
      branch_id: 1,
      fulfillment_type: 'PICKUP',
      products: [{ tx_slug: 'a', qty_product: 1 }],
    });
    expect(r.tx_order_number).toBe('');
  });
});

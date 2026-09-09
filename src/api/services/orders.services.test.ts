import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/axiosRequest', () => ({
  axiosRequest: vi.fn(),
}));
// eslint-disable-next-line import/first
import { axiosRequest } from '@/api/axiosRequest';
// eslint-disable-next-line import/first
import { createOrder, getMyOrders, getOrderDetail } from './orders.services';

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

  it('getMyOrders: GET con branch/page y devuelve items + pagination', async () => {
    mockAxios.mockResolvedValueOnce({
      status: 'OK',
      data: [{ tx_order_number: 'ORD-1', tx_status: 'PENDING' }],
      pagination: { total: 1, last_page: 1 },
    });
    const r = await getMyOrders({ branch: 3, page: 2 });
    expect(r.items).toHaveLength(1);
    expect(r.pagination.total).toBe(1);
    expect(mockAxios.mock.calls[0][0].method).toBe('GET');
    expect(mockAxios.mock.calls[0][0].url).toBe('/api/orders/my-orders/branch/3?page=2');
  });

  it('getMyOrders: no rompe si pagination/data vienen vacíos', async () => {
    mockAxios.mockResolvedValueOnce({ status: 'OK', data: null });
    const r = await getMyOrders({ branch: 3 });
    expect(r.items).toEqual([]);
    expect(r.pagination).toEqual({});
  });

  it('getOrderDetail: GET al endpoint de detalle y devuelve data', async () => {
    mockAxios.mockResolvedValueOnce({
      status: 'OK',
      data: { tx_order_number: 'ORD-1', in_status: 2 },
    });
    const r = await getOrderDetail('ORD-1');
    expect(r.tx_order_number).toBe('ORD-1');
    expect(mockAxios.mock.calls[0][0].method).toBe('GET');
    expect(mockAxios.mock.calls[0][0].url).toBe('/api/orders/detail/ORD-1');
  });
});

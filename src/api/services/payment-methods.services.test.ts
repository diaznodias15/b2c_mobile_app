import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/axiosRequest', () => ({
  axiosRequest: vi.fn(),
}));
// eslint-disable-next-line import/first
import { axiosRequest } from '@/api/axiosRequest';
// eslint-disable-next-line import/first
import { getPaymentMethods } from './payment-methods.services';

const mockAxios = vi.mocked(axiosRequest);

describe('payment-methods.services', () => {
  beforeEach(() => vi.clearAllMocks());

  it('construye URL correcta y devuelve data', async () => {
    mockAxios.mockResolvedValueOnce({
      status: 'OK',
      data: [{ id: 1, nb_payment_method: 'Transferencia' }],
    });
    const r = await getPaymentMethods();
    expect(r).toHaveLength(1);
    expect(mockAxios.mock.calls[0][0].url).toBe(
      '/api/config/payment-methods'
    );
  });

  it('devuelve [] si data es null', async () => {
    mockAxios.mockResolvedValueOnce({ status: 'OK', data: null });
    expect(await getPaymentMethods()).toEqual([]);
  });
});

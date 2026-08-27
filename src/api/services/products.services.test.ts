import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTopProducts } from './products.services';

vi.mock('@/api/axiosRequest', () => ({
  axiosRequest: vi.fn(),
}));

import { axiosRequest } from '@/api/axiosRequest';

const mockAxios = vi.mocked(axiosRequest);

describe('getTopProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('construye URL con branch y devuelve data', async () => {
    mockAxios.mockResolvedValueOnce({
      status: 'OK',
      message: 'OK',
      data: [
        {
          id: 1,
          nb_brand: 'X',
          cod_barcode: '0001',
          nb_product: 'Test',
          tx_slug: 'test',
          qty_product: 10,
          qty_discount: 0,
          qty_tax: 0,
          tx_img_url: null,
          pri_product_price: '10',
          pri_product_final_price: '12',
        },
      ],
    });

    const result = await getTopProducts(7);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
    expect(mockAxios).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: expect.stringContaining('branch=7'),
      })
    );
  });

  it('agrega brand al query string si se pasa', async () => {
    mockAxios.mockResolvedValueOnce({ status: 'OK', message: 'OK', data: [] });
    await getTopProducts(1, { brand: 'Bayer' });
    const calledUrl = mockAxios.mock.calls[0][0].url;
    expect(calledUrl).toContain('brand=Bayer');
    expect(calledUrl).toContain('branch=1');
  });

  it('omite brand del query si no se pasa', async () => {
    mockAxios.mockResolvedValueOnce({ status: 'OK', message: 'OK', data: [] });
    await getTopProducts(1);
    const calledUrl = mockAxios.mock.calls[0][0].url;
    expect(calledUrl).not.toContain('brand=');
  });

  it('propaga el AbortSignal', async () => {
    mockAxios.mockResolvedValueOnce({ status: 'OK', message: 'OK', data: [] });
    const ctrl = new AbortController();
    await getTopProducts(2, { signal: ctrl.signal });
    expect(mockAxios.mock.calls[0][0].signal).toBe(ctrl.signal);
  });

  it('devuelve [] si data es null/undefined', async () => {
    mockAxios.mockResolvedValueOnce({
      status: 'OK',
      message: 'OK',
      data: null as any,
    });
    const result = await getTopProducts(1);
    expect(result).toEqual([]);
  });
});

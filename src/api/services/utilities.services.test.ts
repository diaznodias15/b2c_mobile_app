import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/axiosRequest', () => ({
  axiosRequest: vi.fn(),
}));
// eslint-disable-next-line import/first
import { axiosRequest } from '@/api/axiosRequest';
// eslint-disable-next-line import/first
import { getLocations, calculateDeliveryFee } from './utilities.services';

const mockAxios = vi.mocked(axiosRequest);

describe('utilities.services', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getLocations: GET con q= y devuelve las sugerencias', async () => {
    mockAxios.mockResolvedValueOnce({
      status: 'OK',
      data: [{ name: 'Maracaibo', display_name: 'Maracaibo, Zulia, Venezuela', lat: '10.64', lng: '-71.64' }],
    });
    const r = await getLocations('maracaibo');
    expect(r).toHaveLength(1);
    expect(r[0].lat).toBe('10.64');
    expect(mockAxios.mock.calls[0][0].url).toBe('/api/utilities/get-locations?q=maracaibo');
  });

  it('getLocations: normaliza a [] si data es null', async () => {
    mockAxios.mockResolvedValueOnce({ status: 'OK', data: null });
    const r = await getLocations('x');
    expect(r).toEqual([]);
  });

  it('calculateDeliveryFee: parsea qty_delivery_amount', async () => {
    mockAxios.mockResolvedValueOnce({ status: 'OK', data: { qty_delivery_amount: 30 } });
    const fee = await calculateDeliveryFee(10.6, -71.6, 1);
    expect(fee).toBe(30);
    expect(mockAxios.mock.calls[0][0].url).toBe('/api/utilities/calculate-delivery/10.6/-71.6/1');
  });

  it('calculateDeliveryFee: null si el backend rechaza (sin regla de envío, etc)', async () => {
    mockAxios.mockRejectedValueOnce(new Error('No se encontró una regla de envío'));
    const fee = await calculateDeliveryFee(10.6, -71.6, 1);
    expect(fee).toBeNull();
  });

  it('calculateDeliveryFee: null si data no trae un monto reconocible', async () => {
    mockAxios.mockResolvedValueOnce({ status: 'OK', data: { foo: 'bar' } });
    const fee = await calculateDeliveryFee(10.6, -71.6, 1);
    expect(fee).toBeNull();
  });
});

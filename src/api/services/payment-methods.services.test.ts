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

  it('construye la URL correcta y devuelve el shape real (pago_movil/transferencia_bancaria/zelle/banks)', async () => {
    mockAxios.mockResolvedValueOnce({
      status: 'OK',
      data: {
        pago_movil: [{ cod_rif: 'J-1', tx_bank_description: 'BNC', tx_phone: '0414-1234567' }],
        transferencia_bancaria: [],
        zelle: [{ tx_email: 'pagos@x.com', tx_phone: '', tx_bank_description: 'Titular' }],
        banks: [{ value: '0102', label: '(0102) - BDV' }],
      },
    });
    const r = await getPaymentMethods();
    expect(r.pago_movil).toHaveLength(1);
    expect(r.transferencia_bancaria).toEqual([]);
    expect(r.zelle[0].tx_email).toBe('pagos@x.com');
    expect(r.banks[0].value).toBe('0102');
    expect(mockAxios.mock.calls[0][0].url).toBe('/api/config/payment-methods');
  });

  it('normaliza claves ausentes a [] si data es null o viene incompleto', async () => {
    mockAxios.mockResolvedValueOnce({ status: 'OK', data: null });
    expect(await getPaymentMethods()).toEqual({
      pago_movil: [],
      transferencia_bancaria: [],
      zelle: [],
      banks: [],
    });
  });
});

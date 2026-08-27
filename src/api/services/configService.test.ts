import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../axiosRequest', () => ({
  axiosRequest: vi.fn(),
}));
// eslint-disable-next-line import/first
import { axiosRequest } from '../axiosRequest';
// eslint-disable-next-line import/first
import { loadConfig } from './configService';

const mockedRequest = vi.mocked(axiosRequest);

describe('configService.loadConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('extrae .data del envelope y devuelve la config interna', async () => {
    const internal = {
      app_config: {
        tx_company_name: 'Farmacia El Samán',
        tx_company_rif: 'J-12345678-9',
        is_lite_mode: '1',
        config_colors: { tx_primary_color: '#0f766e' },
      },
      branches: [{ id: 1, nb_name: 'Sede Maracaibo' }],
    };
    mockedRequest.mockResolvedValueOnce({
      status: 'OK',
      message: 'OK',
      data: internal,
    });

    const result = await loadConfig();

    expect(result).toEqual(internal);
    expect(result.app_config.tx_company_name).toBe('Farmacia El Samán');
    expect(mockedRequest).toHaveBeenCalledWith({
      method: 'GET',
      url: '/api/config/get',
      signal: undefined,
    });
  });

  it('pasa el AbortSignal al axiosRequest', async () => {
    const controller = new AbortController();
    mockedRequest.mockResolvedValueOnce({ status: 'OK', data: { app_config: {} } });

    await loadConfig(controller.signal);

    expect(mockedRequest).toHaveBeenCalledWith({
      method: 'GET',
      url: '/api/config/get',
      signal: controller.signal,
    });
  });

  it('propaga el error si la API falla', async () => {
    mockedRequest.mockRejectedValueOnce(new Error('Network error'));

    await expect(loadConfig()).rejects.toThrow('Network error');
  });
});

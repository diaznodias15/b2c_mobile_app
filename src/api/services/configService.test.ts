import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../axiosRequest', () => ({
  axiosRequest: vi.fn(),
}));
// eslint-disable-next-line import/first
import { axiosRequest } from '../axiosRequest';
// eslint-disable-next-line import/first
import { loadConfig } from './configService';

const mockedRequest = vi.mocked(axiosRequest);

const fullInternalData = {
  app_config: {
    tx_company_name: 'Farmacia El Samán',
    tx_company_rif: 'J-50188528-1',
    is_lite_mode: '1',
    config_colors: { col_primary: '#008000' } as any,
  },
  config_colors: { col_primary: '#008000' } as any,
  advertisings: [
    {
      nb_advertising: 'Calox',
      tx_img_url_web: 'https://example.com/web.webp',
      tx_img_url_mobile: 'https://example.com/mobile.webp',
      seq_order: 1,
    },
  ],
  brands: [{ id: 1, nb_brand: 'Bayer' }],
  departments: [
    {
      id: 5,
      nb_department: 'SALUD',
      tx_slug: 'salud',
      tx_img_url: 'https://example.com/salud.webp',
      col_department: '#45abff',
      categories: [],
    },
  ],
  branches: [
    {
      nb_state: 'Zulia',
      nb_city: 'Maracaibo',
      group: 'Maracaibo | Zulia',
      items: [
        {
          value: 1,
          label: 'Sede Norte',
          nb_branch: 'FARMACIA EL SAMAN DE PERIJA',
          tx_alias: 'Sede Norte',
          is_default: 1,
        },
      ],
    },
  ],
};

describe('configService.loadConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('extrae .data del envelope y devuelve la config completa', async () => {
    mockedRequest.mockResolvedValueOnce({
      status: 'OK',
      message: 'OK',
      data: fullInternalData,
    });

    const result = await loadConfig();

    expect(result).toEqual(fullInternalData);
    expect(result.app_config.tx_company_name).toBe('Farmacia El Samán');
    expect(result.advertisings).toHaveLength(1);
    expect(result.departments).toHaveLength(1);
    expect(result.branches?.[0].items[0].value).toBe(1);
    expect(mockedRequest).toHaveBeenCalledWith({
      method: 'GET',
      url: '/api/config/get',
      signal: undefined,
    });
  });

  it('pasa el AbortSignal al axiosRequest', async () => {
    const controller = new AbortController();
    mockedRequest.mockResolvedValueOnce({
      status: 'OK',
      data: { app_config: {} as any },
    });

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

  it('maneja data con campos opcionales faltantes (sin advertisings, etc.)', async () => {
    mockedRequest.mockResolvedValueOnce({
      status: 'OK',
      message: 'OK',
      data: { app_config: { tx_company_name: 'X' } } as any,
    });

    const result = await loadConfig();
    expect(result.app_config.tx_company_name).toBe('X');
    expect(result.advertisings).toBeUndefined();
    expect(result.branches).toBeUndefined();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/axiosRequest', () => ({
  axiosRequest: vi.fn(),
}));
// eslint-disable-next-line import/first
import { axiosRequest } from '@/api/axiosRequest';
// eslint-disable-next-line import/first
import {
  getTopProducts,
  getProductList,
  getProductSearch,
  getProductDetail,
} from './products.services';

const mockAxios = vi.mocked(axiosRequest);

const sampleProduct = {
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
};

describe('getTopProducts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('construye URL con branch y devuelve data', async () => {
    mockAxios.mockResolvedValueOnce({
      status: 'OK',
      message: 'OK',
      data: [sampleProduct],
    });
    const result = await getTopProducts(7);
    expect(result).toHaveLength(1);
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
    expect(mockAxios.mock.calls[0][0].url).toContain('brand=Bayer');
  });

  it('omite brand si no se pasa', async () => {
    mockAxios.mockResolvedValueOnce({ status: 'OK', message: 'OK', data: [] });
    await getTopProducts(1);
    expect(mockAxios.mock.calls[0][0].url).not.toContain('brand=');
  });

  it('devuelve [] si data es null/undefined', async () => {
    mockAxios.mockResolvedValueOnce({ status: 'OK', data: null as any });
    expect(await getTopProducts(1)).toEqual([]);
  });
});

describe('getProductList', () => {
  beforeEach(() => vi.clearAllMocks());

  it('construye URL mínima con branch', async () => {
    mockAxios.mockResolvedValueOnce({
      status: 'OK',
      data: [sampleProduct],
      pagination: { last_page: 1, total: 1, next_page: null },
    });
    const result = await getProductList({ branch: 1 });
    expect(result.items).toHaveLength(1);
    expect(result.pagination.last_page).toBe(1);
    expect(mockAxios.mock.calls[0][0].url).toBe('/api/products/list?branch=1');
  });

  it('agrega filtros cuando se pasan', async () => {
    mockAxios.mockResolvedValueOnce({
      status: 'OK',
      data: [],
      pagination: {},
    });
    await getProductList({
      branch: 1,
      department: 'salud',
      category: 'analgesicos',
      subcategory: 'ibuprofeno',
      min_price: 100,
      max_price: 5000,
      page: 2,
    });
    const url = mockAxios.mock.calls[0][0].url;
    expect(url).toContain('department=salud');
    expect(url).toContain('category=analgesicos');
    expect(url).toContain('subcategory=ibuprofeno');
    expect(url).toContain('min_price=100');
    expect(url).toContain('max_price=5000');
    expect(url).toContain('page=2');
  });

  it('omite filtros null/undefined', async () => {
    mockAxios.mockResolvedValueOnce({ status: 'OK', data: [], pagination: {} });
    await getProductList({ branch: 1, department: 'salud' });
    const url = mockAxios.mock.calls[0][0].url;
    expect(url).not.toContain('category=');
    expect(url).not.toContain('subcategory=');
    expect(url).not.toContain('min_price=');
    expect(url).not.toContain('max_price=');
    expect(url).not.toContain('page=');
  });

  it('propaga metadata y pagination', async () => {
    mockAxios.mockResolvedValueOnce({
      status: 'OK',
      data: [sampleProduct],
      pagination: { last_page: 10, total: 240, next_page: 2, per_page: 24 },
      metadata: { min_price: 100, max_price: 5000 },
    });
    const result = await getProductList({ branch: 1 });
    expect(result.pagination.last_page).toBe(10);
    expect(result.pagination.total).toBe(240);
    expect(result.metadata?.min_price).toBe(100);
  });
});

describe('getProductSearch', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requiere el parámetro product', async () => {
    mockAxios.mockResolvedValueOnce({ status: 'OK', data: [], pagination: {} });
    await getProductSearch({ branch: 1, product: 'ibuprofeno' });
    const url = mockAxios.mock.calls[0][0].url;
    expect(url).toContain('product=ibuprofeno');
    expect(url).toContain('branch=1');
  });

  it('pasa page cuando se da', async () => {
    mockAxios.mockResolvedValueOnce({ status: 'OK', data: [], pagination: {} });
    await getProductSearch({ branch: 1, product: 'x', page: 3 });
    expect(mockAxios.mock.calls[0][0].url).toContain('page=3');
  });

  it('propaga AbortSignal', async () => {
    mockAxios.mockResolvedValueOnce({ status: 'OK', data: [], pagination: {} });
    const ctrl = new AbortController();
    await getProductSearch({ branch: 1, product: 'x', signal: ctrl.signal });
    expect(mockAxios.mock.calls[0][0].signal).toBe(ctrl.signal);
  });
});

describe('getProductDetail', () => {
  beforeEach(() => vi.clearAllMocks());

  it('construye URL con slug + branch', async () => {
    mockAxios.mockResolvedValueOnce({
      status: 'OK',
      data: { id: 1, nb_product: 'X', nb_brand: 'B', cod_barcode: 'C', tx_slug: 's', pri_product_price: '10', pri_product_final_price: '12', qty_product: 5, availability_indicator: 2 } as any,
    });
    const d = await getProductDetail('mi-producto', { branch: 3 });
    expect(d.id).toBe(1);
    expect(mockAxios.mock.calls[0][0].url).toBe(
      '/api/products/detail/mi-producto?branch=3'
    );
  });

  it('maneja slug con caracteres especiales (URL encoding implícito)', async () => {
    mockAxios.mockResolvedValueOnce({
      status: 'OK',
      data: { id: 2, nb_product: 'X', nb_brand: 'B', cod_barcode: 'C', tx_slug: 's', pri_product_price: '10', pri_product_final_price: '12', qty_product: 0, availability_indicator: 0 } as any,
    });
    await getProductDetail('producto-con-slug', { branch: 1 });
    expect(mockAxios.mock.calls[0][0].url).toContain(
      '/api/products/detail/producto-con-slug'
    );
  });
});

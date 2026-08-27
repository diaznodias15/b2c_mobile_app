import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/axiosRequest', () => ({
  axiosRequest: vi.fn(),
}));
// eslint-disable-next-line import/first
import { axiosRequest } from '@/api/axiosRequest';
// eslint-disable-next-line import/first
import {
  getCartItems,
  getCartIndicator,
  addProduct,
  updateQuantity,
  removeProduct,
  clearCart,
  mergeLocalCart,
} from './cart.services';

const mockAxios = vi.mocked(axiosRequest);

describe('cart.services', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getCartItems construye URL con branch', async () => {
    mockAxios.mockResolvedValueOnce({ status: 'OK', data: [] });
    await getCartItems(7);
    expect(mockAxios.mock.calls[0][0].url).toBe('/api/cart/items/branch/7');
  });

  it('getCartItems devuelve [] si data es null', async () => {
    mockAxios.mockResolvedValueOnce({ status: 'OK', data: null });
    expect(await getCartItems(1)).toEqual([]);
  });

  it('getCartIndicator devuelve {count: 0} si no hay data', async () => {
    mockAxios.mockResolvedValueOnce({ status: 'OK', data: null });
    expect(await getCartIndicator(1)).toEqual({ count: 0 });
  });

  it('addProduct: POST con payload', async () => {
    mockAxios.mockResolvedValueOnce({ status: 'OK', data: {} });
    await addProduct({ branch_id: 1, tx_slug: 'a', qty_product: 2 });
    expect(mockAxios).toHaveBeenCalledWith({
      method: 'POST',
      url: '/api/cart/add-product',
      data: { branch_id: 1, tx_slug: 'a', qty_product: 2 },
    });
  });

  it('updateQuantity: PUT con payload', async () => {
    mockAxios.mockResolvedValueOnce({ status: 'OK', data: {} });
    await updateQuantity({ branch_id: 1, tx_slug: 'a', qty_product: 5 });
    expect(mockAxios).toHaveBeenCalledWith({
      method: 'PUT',
      url: '/api/cart/update-product-quantity',
      data: { branch_id: 1, tx_slug: 'a', qty_product: 5 },
    });
  });

  it('removeProduct: DELETE con slug y branch en URL', async () => {
    mockAxios.mockResolvedValueOnce({ status: 'OK', data: {} });
    await removeProduct('mi-slug', 3);
    expect(mockAxios.mock.calls[0][0].url).toBe(
      '/api/cart/remove-product/mi-slug/branch/3'
    );
  });

  it('clearCart: DELETE con branch en URL', async () => {
    mockAxios.mockResolvedValueOnce({ status: 'OK', data: {} });
    await clearCart(2);
    expect(mockAxios.mock.calls[0][0].url).toBe('/api/cart/clear/branch/2');
  });

  it('mergeLocalCart: POST con {products: []}', async () => {
    mockAxios.mockResolvedValueOnce({ status: 'OK', data: {} });
    await mergeLocalCart(1, [
      { tx_slug: 'a', qty_product: 1 },
      { tx_slug: 'b', qty_product: 3 },
    ]);
    expect(mockAxios).toHaveBeenCalledWith({
      method: 'POST',
      url: '/api/cart/merge/branch/1',
      data: { products: [{ tx_slug: 'a', qty_product: 1 }, { tx_slug: 'b', qty_product: 3 }] },
    });
  });
});

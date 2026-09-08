import { describe, it, expect } from 'vitest';
import { getProductPricing } from './pricing';
import type { Product } from '@/types/whitelabel';

const product = (over: Partial<Product> = {}): Product => ({
  id: 1,
  nb_brand: 'X',
  cod_barcode: '0001',
  nb_product: 'Test',
  tx_slug: 'test',
  qty_product: 10,
  tx_img_url: null,
  pri_product_price: '100.00',
  pri_product_final_price: '100.00',
  ...over,
});

describe('getProductPricing', () => {
  it('hasDiscount es false sin qty_discount', () => {
    const p = getProductPricing(product());
    expect(p).toEqual({ basePrice: 100, finalPrice: 100, hasDiscount: false });
  });

  it('hasDiscount es true con qty_discount y final < base', () => {
    const p = getProductPricing(
      product({ qty_discount: 20, pri_product_final_price: '80.00' })
    );
    expect(p).toEqual({ basePrice: 100, finalPrice: 80, hasDiscount: true });
  });

  it('hasDiscount es false si qty_discount > 0 pero el precio no bajó', () => {
    // Caso raro pero real: el backend puede mandar qty_discount sin que
    // el precio final refleje la baja — no mostrar un tachado engañoso.
    const p = getProductPricing(
      product({ qty_discount: 20, pri_product_final_price: '100.00' })
    );
    expect(p.hasDiscount).toBe(false);
  });

  it('hasDiscount es false con qty_discount "0.00" (string falsy-ish pero truthy en JS)', () => {
    // "0.00" es un string no vacío → Boolean("0.00") es true, pero como
    // el precio final no baja, hasDiscount igual da false.
    const p = getProductPricing(
      product({ qty_discount: '0.00', pri_product_final_price: '100.00' })
    );
    expect(p.hasDiscount).toBe(false);
  });
});

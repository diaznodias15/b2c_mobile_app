import { describe, it, expect } from 'vitest';
import { calculateDiscountAmount, calculateTaxAmount, getCartSummary, getProductPricing } from './pricing';
import type { Product } from '@/types/whitelabel';
import type { CartItem } from '@/types/cart';

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

describe('calculateDiscountAmount / calculateTaxAmount', () => {
  it('calculateDiscountAmount: % del precio base', () => {
    expect(calculateDiscountAmount(200, 10)).toBe(20);
    expect(calculateDiscountAmount(100, 0)).toBe(0);
  });

  it('calculateTaxAmount: % de la base imponible (ya con descuento)', () => {
    expect(calculateTaxAmount(90, 16)).toBeCloseTo(14.4);
    expect(calculateTaxAmount(0, 16)).toBe(0);
  });
});

describe('getCartSummary', () => {
  const cartItem = (over: Partial<CartItem> = {}): CartItem => ({
    tx_slug: 'a',
    product_id: 1,
    branch_id: 1,
    nb_product: 'A',
    nb_brand: 'X',
    tx_img_url: null,
    pri_product_price: '100.00',
    pri_product_final_price: '104.40',
    qty_discount: 20,
    qty_tax: 16,
    qty: 1,
    added_at: 0,
    ...over,
  });

  it('carrito vacío da todo en 0', () => {
    expect(getCartSummary([])).toEqual({ subtotal: 0, discountTotal: 0, taxTotal: 0, total: 0 });
  });

  it('desglosa subtotal/descuento/IVA/total replicando la cascada de la web (PRODUCTS-CALCULATIONS.md §11)', () => {
    // 50 base, 15% desc → 7.5 desc, base c/desc 42.5, 16% IVA → 6.8 IVA, final backend 49.30
    const summary = getCartSummary([
      cartItem({
        pri_product_price: '50.00',
        pri_product_final_price: '49.30',
        qty_discount: 15,
        qty_tax: 16,
        qty: 2,
      }),
    ]);
    expect(summary.subtotal).toBe(100); // 50 * 2
    expect(summary.discountTotal).toBeCloseTo(15); // 7.5 * 2
    expect(summary.taxTotal).toBeCloseTo(13.6); // 6.8 * 2
    expect(summary.total).toBeCloseTo(98.6); // 49.30 * 2 (autoritativo del backend)
  });

  it('suma varios items ponderando por cantidad', () => {
    const summary = getCartSummary([
      cartItem({ tx_slug: 'a', qty: 2 }),
      cartItem({ tx_slug: 'b', pri_product_price: '50.00', pri_product_final_price: '52.20', qty_discount: 20, qty_tax: 16, qty: 1 }),
    ]);
    expect(summary.total).toBeCloseTo(104.4 * 2 + 52.2);
  });

  it('item sin pri_product_price (carrito persistido viejo) no rompe — cae a discount/tax 0', () => {
    const summary = getCartSummary([
      cartItem({ pri_product_price: undefined, qty_discount: undefined, qty_tax: undefined, pri_product_final_price: '80.00', qty: 1 }),
    ]);
    expect(summary.subtotal).toBe(80);
    expect(summary.discountTotal).toBe(0);
    expect(summary.taxTotal).toBe(0);
    expect(summary.total).toBe(80);
  });
});

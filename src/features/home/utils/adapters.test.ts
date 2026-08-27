import { describe, it, expect } from 'vitest';
import {
  advertisingImageUrl,
  sortAdvertising,
  hasDiscount,
  finalPrice,
  basePrice,
  discountPercent,
} from './adapters';
import type { Advertising, TopProduct } from '@/types/whitelabel';

const sampleAdvertising: Advertising[] = [
  { nb_advertising: 'C', tx_img_url_web: 'w3', tx_img_url_mobile: 'm3', seq_order: 3 },
  { nb_advertising: 'A', tx_img_url_web: 'w1', tx_img_url_mobile: 'm1', seq_order: 1 },
  { nb_advertising: 'B', tx_img_url_web: 'w2', tx_img_url_mobile: 'm2', seq_order: 2, seq_importance: 1 },
];

const product = (overrides: Partial<TopProduct> = {}): TopProduct => ({
  id: 1,
  nb_brand: 'X',
  cod_barcode: '0001',
  nb_product: 'Test',
  tx_slug: 'test',
  qty_product: 10,
  qty_discount: 0,
  qty_tax: 0,
  tx_img_url: null,
  pri_product_price: '100.00',
  pri_product_final_price: '120.00',
  ...overrides,
});

describe('advertisingImageUrl', () => {
  it('devuelve mobile si existe', () => {
    expect(advertisingImageUrl(sampleAdvertising[0])).toBe('m3');
  });

  it('cae a web si no hay mobile', () => {
    expect(
      advertisingImageUrl({
        nb_advertising: 'X',
        tx_img_url_web: 'web',
        tx_img_url_mobile: '',
      })
    ).toBe('web');
  });

  it('devuelve string vacío si no hay nada', () => {
    expect(
      advertisingImageUrl({
        nb_advertising: 'X',
        tx_img_url_web: '',
        tx_img_url_mobile: '',
      })
    ).toBe('');
  });
});

describe('sortAdvertising', () => {
  it('ordena por seq_order asc', () => {
    const sorted = sortAdvertising(sampleAdvertising);
    expect(sorted.map((a) => a.nb_advertising)).toEqual(['A', 'B', 'C']);
  });

  it('no muta el array original', () => {
    const original = [...sampleAdvertising];
    sortAdvertising(sampleAdvertising);
    expect(sampleAdvertising).toEqual(original);
  });

  it('maneja seq_order faltante con fallback alto', () => {
    const noOrder: Advertising[] = [
      { nb_advertising: 'Z', tx_img_url_web: '', tx_img_url_mobile: '' },
      { nb_advertising: 'A', tx_img_url_web: '', tx_img_url_mobile: '', seq_order: 1 },
    ];
    const sorted = sortAdvertising(noOrder);
    expect(sorted[0].nb_advertising).toBe('A');
    expect(sorted[1].nb_advertising).toBe('Z');
  });
});

describe('price helpers', () => {
  it('basePrice y finalPrice parsean a número', () => {
    expect(basePrice(product())).toBe(100);
    expect(finalPrice(product())).toBe(120);
  });

  it('parsePrice acepta string vacío y null como 0', () => {
    expect(basePrice(product({ pri_product_price: '' }))).toBe(0);
    expect(basePrice(product({ pri_product_price: 'abc' }))).toBe(0);
  });

  it('hasDiscount: true si final < base', () => {
    expect(
      hasDiscount(
        product({ pri_product_price: '100', pri_product_final_price: '80' })
      )
    ).toBe(true);
  });

  it('hasDiscount: false si final >= base', () => {
    expect(hasDiscount(product())).toBe(false);
    expect(
      hasDiscount(
        product({ pri_product_price: '100', pri_product_final_price: '100' })
      )
    ).toBe(false);
  });

  it('discountPercent: 20% si 100→80', () => {
    expect(
      discountPercent(
        product({ pri_product_price: '100', pri_product_final_price: '80' })
      )
    ).toBe(20);
  });

  it('discountPercent: 0 si no hay descuento', () => {
    expect(discountPercent(product())).toBe(0);
  });
});

import { describe, it, expect } from 'vitest';
import {
  subtotal,
  totalQty,
  totalLines,
  buildSummary,
  buildOrderPayload,
  deliveryFee,
} from './summary';
import type { CartItem } from '@/types/cart';

const item = (over: Partial<CartItem> = {}): CartItem => ({
  tx_slug: 'a',
  product_id: 1,
  branch_id: 1,
  nb_product: 'A',
  nb_brand: 'X',
  tx_img_url: null,
  pri_product_final_price: '100',
  qty: 1,
  added_at: 0,
  ...over,
});

describe('subtotal / total / qty', () => {
  it('subtotal suma qty × precio', () => {
    expect(subtotal([item({ qty: 2, pri_product_final_price: '10' })])).toBe(20);
    expect(
      subtotal([
        item({ qty: 2, pri_product_final_price: '10' }),
        item({ tx_slug: 'b', qty: 3, pri_product_final_price: '5' }),
      ])
    ).toBe(35);
  });

  it('subtotal tolera precios inválidos como 0', () => {
    expect(
      subtotal([item({ pri_product_final_price: 'abc' })])
    ).toBe(0);
  });

  it('totalQty suma qty', () => {
    expect(
      totalQty([
        item({ qty: 2 }),
        item({ tx_slug: 'b', qty: 3 }),
      ])
    ).toBe(5);
  });

  it('totalLines cuenta líneas distintas', () => {
    expect(totalLines([item(), item({ tx_slug: 'b' })])).toBe(2);
  });

  it('deliveryFee es 0 en Fase 4A', () => {
    expect(deliveryFee([item()])).toBe(0);
  });

  it('buildSummary devuelve todas las claves', () => {
    const s = buildSummary([
      item({ qty: 2, pri_product_final_price: '10' }),
      item({ tx_slug: 'b', qty: 1, pri_product_final_price: '5' }),
    ]);
    expect(s.subtotal).toBe(25);
    expect(s.delivery).toBe(0);
    expect(s.total).toBe(25);
    expect(s.qty).toBe(3);
    expect(s.lines).toBe(2);
  });
});

describe('buildOrderPayload', () => {
  it('lanza si no hay items', () => {
    expect(() =>
      buildOrderPayload({
        branchId: 1,
        items: [],
        fulfillment: 'PICKUP',
      })
    ).toThrow('vacío');
  });

  it('lanza si no hay fulfillment', () => {
    expect(() =>
      buildOrderPayload({
        branchId: 1,
        items: [item()],
        // @ts-expect-error testing
        fulfillment: null,
      })
    ).toThrow('entrega');
  });

  it('lanza si DELIVERY sin address', () => {
    expect(() =>
      buildOrderPayload({
        branchId: 1,
        items: [item()],
        fulfillment: 'DELIVERY',
      })
    ).toThrow('dirección');
  });

  it('construye PICKUP mínimo', () => {
    const p = buildOrderPayload({
      branchId: 1,
      items: [item({ tx_slug: 'a', qty: 2 })],
      fulfillment: 'PICKUP',
    });
    expect(p.branch_id).toBe(1);
    expect(p.fulfillment_type).toBe('PICKUP');
    expect(p.products).toEqual([{ tx_slug: 'a', qty_product: 2 }]);
    expect(p.address).toBeUndefined();
    expect(p.payment_method_id).toBeUndefined();
  });

  it('construye DELIVERY con address y lat/lng', () => {
    const p = buildOrderPayload({
      branchId: 1,
      items: [item()],
      fulfillment: 'DELIVERY',
      deliveryAddress: { tx_address: 'Calle 1', lat: 10.5, lng: -71.6 },
    });
    expect(p.address).toBe('Calle 1');
    expect(p.lat).toBe(10.5);
    expect(p.lng).toBe(-71.6);
  });

  it('incluye payment method + reference + comments + contact si se pasan', () => {
    const p = buildOrderPayload({
      branchId: 1,
      items: [item()],
      fulfillment: 'PICKUP',
      paymentMethod: { id: 5, nb_payment_method: 'Zelle' },
      paymentReference: 'REF-001',
      comments: 'Tocar timbre',
      contact: { tx_name: 'Juan', tx_phone: '+584141234567' },
    });
    expect(p.payment_method_id).toBe(5);
    expect(p.payment_reference).toBe('REF-001');
    expect(p.comments).toBe('Tocar timbre');
    expect(p.contact?.tx_name).toBe('Juan');
  });

  it('omite payment_reference si es string vacío', () => {
    const p = buildOrderPayload({
      branchId: 1,
      items: [item()],
      fulfillment: 'PICKUP',
      paymentReference: '   ',
    });
    expect(p.payment_reference).toBeUndefined();
  });
});

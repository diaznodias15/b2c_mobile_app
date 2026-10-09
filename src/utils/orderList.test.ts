import { describe, expect, it } from 'vitest';

import type { Order } from '@/types/orders';

import { describeStatusRefresh, patchOrderStatusInPage } from './orderList';

const order = (over: Partial<Order> = {}): Order => ({
  tx_order_number: 'ORD-1',
  tx_status: 'PENDING',
  qty_total_amount: '10.00',
  dt_created_at: '2026-10-01 10:00:00',
  qty_items: '1',
  qty_units: '1',
  amt_exchange_rate: '800',
  tx_branch_alias: 'Norte',
  ...over,
});

describe('patchOrderStatusInPage', () => {
  it('cambia solo el estado de la orden indicada', () => {
    const page = { items: [order({ tx_order_number: 'ORD-1' }), order({ tx_order_number: 'ORD-2' })], total: 2 };
    const next = patchOrderStatusInPage(page, 'ORD-2', 'APPROVED');
    expect(next.items.map((o) => o.tx_status)).toEqual(['PENDING', 'APPROVED']);
    expect(next.total).toBe(2);
  });

  it('devuelve la misma referencia si el estado ya es ese', () => {
    const page = { items: [order({ tx_status: 'APPROVED' })] };
    expect(patchOrderStatusInPage(page, 'ORD-1', 'APPROVED')).toBe(page);
  });

  it('devuelve la misma referencia si la orden no está en esa página', () => {
    const page = { items: [order()] };
    expect(patchOrderStatusInPage(page, 'ORD-99', 'FINISHED')).toBe(page);
  });

  it('no muta la página original', () => {
    const page = { items: [order()] };
    patchOrderStatusInPage(page, 'ORD-1', 'FINISHED');
    expect(page.items[0].tx_status).toBe('PENDING');
  });
});

describe('describeStatusRefresh', () => {
  const labelOf = (s: string) => ({ PENDING: 'En revisión', APPROVED: 'Aprobado' })[s as 'PENDING' | 'APPROVED'] ?? s;

  it('avisa del cambio de estado', () => {
    expect(describeStatusRefresh('PENDING', 'APPROVED', labelOf)).toBe('El estado cambió a "Aprobado".');
  });

  it('avisa que sigue igual', () => {
    expect(describeStatusRefresh('PENDING', 'PENDING', labelOf)).toBe('Sin cambios: el pedido sigue en "En revisión".');
  });

  it('sin estado previo conocido lo trata como "sin cambios"', () => {
    expect(describeStatusRefresh(undefined, 'APPROVED', labelOf)).toBe('Sin cambios: el pedido sigue en "Aprobado".');
  });
});

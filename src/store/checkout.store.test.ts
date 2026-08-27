import { describe, it, expect, beforeEach } from 'vitest';
import { useCheckoutStore } from './checkout.store';
import type { PaymentMethod } from '@/types/cart';

const pm: PaymentMethod = { id: 1, nb_payment_method: 'Transfer' };

describe('useCheckoutStore', () => {
  beforeEach(() => {
    useCheckoutStore.getState().reset();
  });

  it('starts empty', () => {
    const s = useCheckoutStore.getState();
    expect(s.fulfillment).toBeNull();
    expect(s.deliveryAddress).toBeNull();
    expect(s.paymentMethod).toBeNull();
    expect(s.paymentReference).toBe('');
    expect(s.comments).toBe('');
    expect(s.contact).toBeNull();
  });

  it('setFulfillment guarda el tipo', () => {
    useCheckoutStore.getState().setFulfillment('PICKUP');
    expect(useCheckoutStore.getState().fulfillment).toBe('PICKUP');
  });

  it('setFulfillment PICKUP limpia la delivery address', () => {
    useCheckoutStore
      .getState()
      .setDeliveryAddress({ tx_address: 'Calle 1' });
    useCheckoutStore.getState().setFulfillment('PICKUP');
    expect(useCheckoutStore.getState().deliveryAddress).toBeNull();
  });

  it('setPaymentMethod guarda el método', () => {
    useCheckoutStore.getState().setPaymentMethod(pm);
    expect(useCheckoutStore.getState().paymentMethod).toEqual(pm);
  });

  it('setPaymentReference y setComments', () => {
    useCheckoutStore.getState().setPaymentReference('REF-123');
    useCheckoutStore.getState().setComments('Tocar timbre');
    expect(useCheckoutStore.getState().paymentReference).toBe('REF-123');
    expect(useCheckoutStore.getState().comments).toBe('Tocar timbre');
  });

  it('setContact guarda los datos de contacto', () => {
    useCheckoutStore
      .getState()
      .setContact({ tx_name: 'Juan', tx_phone: '+584141234567' });
    expect(useCheckoutStore.getState().contact?.tx_name).toBe('Juan');
  });

  it('reset limpia todo', () => {
    useCheckoutStore.getState().setFulfillment('DELIVERY');
    useCheckoutStore.getState().setPaymentMethod(pm);
    useCheckoutStore.getState().reset();
    const s = useCheckoutStore.getState();
    expect(s.fulfillment).toBeNull();
    expect(s.paymentMethod).toBeNull();
  });
});

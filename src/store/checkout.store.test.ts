import { describe, it, expect, beforeEach } from 'vitest';
import { useCheckoutStore } from './checkout.store';
import type { PaymentMethodCode } from '@/types/orders';

const pm: PaymentMethodCode = 'TRANSFERENCIA';

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

  it('setFulfillment DELIVERY conserva la delivery address existente (antes la pisaba con undefined)', () => {
    useCheckoutStore.getState().setDeliveryAddress({ tx_address: 'Calle 1' });
    useCheckoutStore.getState().setFulfillment('DELIVERY');
    expect(useCheckoutStore.getState().deliveryAddress).toEqual({ tx_address: 'Calle 1' });
  });

  it('setPaymentMethod guarda el método', () => {
    useCheckoutStore.getState().setPaymentMethod(pm);
    expect(useCheckoutStore.getState().paymentMethod).toEqual(pm);
  });

  it('setPaymentAmount, setPaymentCurrency, setBankOrigin, setDepositorName, setPayerPhone', () => {
    const s = useCheckoutStore.getState();
    s.setPaymentAmount(150.5);
    s.setPaymentCurrency('USD.');
    s.setBankOrigin('0102');
    s.setDepositorName('Maria Lopez');
    s.setPayerPhone('0414-1234567');
    const updated = useCheckoutStore.getState();
    expect(updated.paymentAmount).toBe(150.5);
    expect(updated.paymentCurrency).toBe('USD.');
    expect(updated.bankOrigin).toBe('0102');
    expect(updated.depositorName).toBe('Maria Lopez');
    expect(updated.payerPhone).toBe('0414-1234567');
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

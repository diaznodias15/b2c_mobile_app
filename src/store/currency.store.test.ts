import { describe, it, expect, beforeEach } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCurrencyStore } from './currency.store';

describe('useCurrencyStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useCurrencyStore.setState({ displayCurrency: 'Bs.' });
  });

  it('starts with Bs. as the default currency', () => {
    expect(useCurrencyStore.getState().displayCurrency).toBe('Bs.');
  });

  it('setDisplayCurrency switches to REF', () => {
    useCurrencyStore.getState().setDisplayCurrency('REF');
    expect(useCurrencyStore.getState().displayCurrency).toBe('REF');
  });

  it('setDisplayCurrency switches back to Bs.', () => {
    useCurrencyStore.getState().setDisplayCurrency('REF');
    useCurrencyStore.getState().setDisplayCurrency('Bs.');
    expect(useCurrencyStore.getState().displayCurrency).toBe('Bs.');
  });

  it('persists the preference to AsyncStorage', async () => {
    useCurrencyStore.getState().setDisplayCurrency('REF');
    await new Promise((r) => setTimeout(r, 10));
    const stored = await AsyncStorage.getItem('currency-storage');
    expect(stored).toContain('REF');
  });
});

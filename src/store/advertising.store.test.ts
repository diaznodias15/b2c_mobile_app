import { describe, it, expect, beforeEach } from 'vitest';
import { useAdvertisingStore } from './advertising.store';
import type { Advertising } from '@/types/whitelabel';

const ads: Advertising[] = [
  { nb_advertising: 'A', tx_img_url_web: 'w1', tx_img_url_mobile: 'm1' },
  { nb_advertising: 'B', tx_img_url_web: 'w2', tx_img_url_mobile: 'm2' },
];

describe('useAdvertisingStore', () => {
  beforeEach(() => {
    useAdvertisingStore.getState().reset();
  });

  it('starts empty', () => {
    expect(useAdvertisingStore.getState().advertising).toEqual([]);
  });

  it('setAdvertising guarda la lista', () => {
    useAdvertisingStore.getState().setAdvertising(ads);
    expect(useAdvertisingStore.getState().advertising).toHaveLength(2);
  });

  it('reset() vacía el store', () => {
    useAdvertisingStore.getState().setAdvertising(ads);
    useAdvertisingStore.getState().reset();
    expect(useAdvertisingStore.getState().advertising).toEqual([]);
  });
});

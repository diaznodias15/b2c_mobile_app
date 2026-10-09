import { describe, expect, it } from 'vitest';

import { canStartRefresh, REFRESH_COOLDOWN_MS } from './refreshGuard';

describe('canStartRefresh', () => {
  it('permite el primer refresh', () => {
    expect(canStartRefresh({ now: 1_790_000_000_000, inFlight: false, lastEndedAt: 0 })).toBe(true);
  });

  it('no permite otro mientras hay uno en curso', () => {
    expect(canStartRefresh({ now: 99_999, inFlight: true, lastEndedAt: 0 })).toBe(false);
  });

  it('no permite otro dentro de la ventana anti-duplicados (5 s) tras terminar el anterior', () => {
    expect(canStartRefresh({ now: 10_000, inFlight: false, lastEndedAt: 8_000 })).toBe(false);
    expect(canStartRefresh({ now: 12_999, inFlight: false, lastEndedAt: 8_000 })).toBe(false);
  });

  it('lo permite de nuevo pasada la ventana', () => {
    expect(canStartRefresh({ now: 8_000 + REFRESH_COOLDOWN_MS, inFlight: false, lastEndedAt: 8_000 })).toBe(true);
  });

  it('la ventana por defecto coincide con la de axiosRequest (5 s)', () => {
    expect(REFRESH_COOLDOWN_MS).toBe(5_000);
  });
});

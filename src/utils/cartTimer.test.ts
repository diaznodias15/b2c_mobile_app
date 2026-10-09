import { describe, expect, it } from 'vitest';

import {
  CART_TIMER_WARNING_SECONDS,
  formatMmSs,
  getRemainingSeconds,
  getTimerProgress,
  isTimerWarning,
} from './cartTimer';

describe('getRemainingSeconds', () => {
  it('redondea hacia arriba para no mostrar 00:00 antes de tiempo', () => {
    expect(getRemainingSeconds(10_000, 0)).toBe(10);
    expect(getRemainingSeconds(10_000, 9_001)).toBe(1);
    expect(getRemainingSeconds(10_000, 9_999)).toBe(1);
  });

  it('nunca baja de 0 aunque ya haya vencido (p. ej. tras volver de segundo plano)', () => {
    expect(getRemainingSeconds(10_000, 10_000)).toBe(0);
    expect(getRemainingSeconds(10_000, 99_000)).toBe(0);
  });
});

describe('formatMmSs', () => {
  it('formatea con ceros a la izquierda', () => {
    expect(formatMmSs(420)).toBe('07:00');
    expect(formatMmSs(65)).toBe('01:05');
    expect(formatMmSs(9)).toBe('00:09');
    expect(formatMmSs(0)).toBe('00:00');
  });

  it('tolera valores negativos y decimales', () => {
    expect(formatMmSs(-5)).toBe('00:00');
    expect(formatMmSs(59.9)).toBe('00:59');
  });
});

describe('isTimerWarning', () => {
  it('es advertencia con 60 s o menos', () => {
    expect(isTimerWarning(CART_TIMER_WARNING_SECONDS)).toBe(true);
    expect(isTimerWarning(1)).toBe(true);
    expect(isTimerWarning(61)).toBe(false);
  });
});

describe('getTimerProgress', () => {
  it('devuelve la fracción restante entre 0 y 1', () => {
    expect(getTimerProgress(420, 420)).toBe(1);
    expect(getTimerProgress(210, 420)).toBe(0.5);
    expect(getTimerProgress(0, 420)).toBe(0);
  });

  it('se mantiene en rango y no divide por cero', () => {
    expect(getTimerProgress(500, 420)).toBe(1);
    expect(getTimerProgress(-5, 420)).toBe(0);
    expect(getTimerProgress(10, 0)).toBe(0);
  });
});

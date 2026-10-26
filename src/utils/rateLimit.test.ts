import { describe, expect, it } from 'vitest';

import { getRetryDelayMs, parseRetryAfterMs } from './rateLimit';

describe('parseRetryAfterMs', () => {
  it('interpreta segundos', () => {
    expect(parseRetryAfterMs('3')).toBe(3000);
    expect(parseRetryAfterMs(2)).toBe(2000);
  });

  it('interpreta una fecha HTTP relativa a "ahora"', () => {
    const now = Date.parse('2026-10-26T10:00:00Z');
    expect(parseRetryAfterMs('Mon, 26 Oct 2026 10:00:04 GMT', now)).toBe(4000);
  });

  it('devuelve null si falta o no se entiende', () => {
    expect(parseRetryAfterMs(undefined)).toBeNull();
    expect(parseRetryAfterMs('')).toBeNull();
    expect(parseRetryAfterMs('pronto')).toBeNull();
  });
});

describe('getRetryDelayMs', () => {
  it('usa Retry-After cuando viene', () => {
    expect(getRetryDelayMs(0, '4')).toBe(4000);
  });

  it('acota Retry-After al máximo de 10 s y nunca devuelve negativos', () => {
    expect(getRetryDelayMs(0, '120')).toBe(10_000);
    const now = Date.parse('2026-10-26T10:00:00Z');
    expect(getRetryDelayMs(0, 'Mon, 26 Oct 2026 09:59:00 GMT', () => 0, now)).toBe(0);
  });

  it('sin cabecera crece exponencialmente con azar y tope', () => {
    expect(getRetryDelayMs(0, undefined, () => 0)).toBe(1000);
    expect(getRetryDelayMs(1, undefined, () => 0)).toBe(2000);
    expect(getRetryDelayMs(1, undefined, () => 0.999)).toBe(2249);
    expect(getRetryDelayMs(5, undefined, () => 0)).toBe(10_000);
  });
});

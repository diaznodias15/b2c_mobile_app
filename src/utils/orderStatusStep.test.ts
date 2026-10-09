import { describe, expect, it } from 'vitest';

import { getOrderStatusStep } from './orderStatusStep';

/** El stepper dibuja 5 pasos (Pendiente … Finalizado): índices 0–4. */
const STEPPER_LENGTH = 5;

describe('getOrderStatusStep', () => {
  it('mapea cada estado de la orden a su paso del stepper', () => {
    expect(getOrderStatusStep('PENDING')).toBe(0);
    expect(getOrderStatusStep('APPROVED')).toBe(1);
    expect(getOrderStatusStep('PROCESSING')).toBe(2);
    expect(getOrderStatusStep('PROCESSED')).toBe(3);
    expect(getOrderStatusStep('FINISHED')).toBe(4);
  });

  it('el último estado activo es el último paso del stepper', () => {
    expect(getOrderStatusStep('FINISHED')).toBe(STEPPER_LENGTH - 1);
  });

  it('CANCELED queda fuera del rango del stepper (se muestra la alerta)', () => {
    expect(getOrderStatusStep('CANCELED')).toBeGreaterThanOrEqual(STEPPER_LENGTH);
  });

  it('un estado desconocido o ausente cae a 0, nunca a undefined', () => {
    expect(getOrderStatusStep('ALGO_NUEVO')).toBe(0);
    expect(getOrderStatusStep(undefined)).toBe(0);
    expect(getOrderStatusStep(null)).toBe(0);
  });
});

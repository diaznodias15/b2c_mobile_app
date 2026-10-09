import { describe, expect, it } from 'vitest';

import { getPasswordChangeIssues } from './passwordChange';

const OLD = 'Antigua#123';
const NEW = 'Nueva#4567';

describe('getPasswordChangeIssues', () => {
  it('permite cambiar cuando todo es válido', () => {
    const r = getPasswordChangeIssues({ oldPassword: OLD, newPassword: NEW, confirmPassword: NEW });
    expect(r.canChange).toBe(true);
    expect(r.oldInvalid).toBe(false);
    expect(r.sameAsOld).toBe(false);
  });

  it('marca la antigua como inválida si no cumple la política (el backend la rechazaría)', () => {
    const r = getPasswordChangeIssues({ oldPassword: 'corta', newPassword: NEW, confirmPassword: NEW });
    expect(r.oldInvalid).toBe(true);
    expect(r.canChange).toBe(false);
  });

  it('no marca la antigua como inválida mientras está vacía (solo bloquea el envío)', () => {
    const r = getPasswordChangeIssues({ oldPassword: '', newPassword: NEW, confirmPassword: NEW });
    expect(r.oldInvalid).toBe(false);
    expect(r.canChange).toBe(false);
  });

  it('detecta que la nueva es igual a la antigua', () => {
    const r = getPasswordChangeIssues({ oldPassword: OLD, newPassword: OLD, confirmPassword: OLD });
    expect(r.sameAsOld).toBe(true);
    expect(r.canChange).toBe(false);
  });

  it('exige que la nueva cumpla la política', () => {
    const r = getPasswordChangeIssues({ oldPassword: OLD, newPassword: 'sinmayus#1', confirmPassword: 'sinmayus#1' });
    expect(r.newValid).toBe(false);
    expect(r.canChange).toBe(false);
  });

  it('exige que la confirmación coincida', () => {
    const r = getPasswordChangeIssues({ oldPassword: OLD, newPassword: NEW, confirmPassword: 'Otra#98765' });
    expect(r.confirmMatches).toBe(false);
    expect(r.canChange).toBe(false);
  });
});

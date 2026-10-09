import { describe, expect, it } from 'vitest';

import { formatPhoneNumber, isAreaCodeValid, isPhoneNumberValid, VE_AREA_CODES } from './phone';

describe('formatPhoneNumber', () => {
  it('no agrega guión hasta pasar los 3 primeros dígitos', () => {
    expect(formatPhoneNumber('')).toBe('');
    expect(formatPhoneNumber('45')).toBe('45');
    expect(formatPhoneNumber('456')).toBe('456');
  });

  it('agrega el guión después del tercer dígito', () => {
    expect(formatPhoneNumber('4567')).toBe('456-7');
    expect(formatPhoneNumber('4567890')).toBe('456-7890');
  });

  it('descarta letras, símbolos y dígitos sobrantes', () => {
    expect(formatPhoneNumber('4a5b6-7890123')).toBe('456-7890');
    expect(formatPhoneNumber('456-7890')).toBe('456-7890');
  });
});

describe('isPhoneNumberValid', () => {
  it('acepta solo el formato 000-0000', () => {
    expect(isPhoneNumberValid('456-7890')).toBe(true);
    expect(isPhoneNumberValid('4567890')).toBe(false);
    expect(isPhoneNumberValid('456-789')).toBe(false);
    expect(isPhoneNumberValid('45-67890')).toBe(false);
    expect(isPhoneNumberValid('')).toBe(false);
  });
});

describe('isAreaCodeValid', () => {
  it('acepta las 6 operadoras del backend', () => {
    VE_AREA_CODES.forEach((code) => expect(isAreaCodeValid(code)).toBe(true));
  });

  it('rechaza cualquier otro valor', () => {
    expect(isAreaCodeValid('0212')).toBe(false);
    expect(isAreaCodeValid('414')).toBe(false);
    expect(isAreaCodeValid('')).toBe(false);
  });
});

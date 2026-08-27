import { describe, it, expect } from 'vitest';
import {
  isEmailValid,
  isPasswordValid,
  isConfirmPasswordValid,
  isNameValid,
  isVenezuelanPhoneValid,
  DOC_TYPES,
  PAYMENT_METHODS,
  GENDERS,
} from './validations';

describe('isEmailValid', () => {
  it.each([
    'user@example.com',
    'user.name+tag@sub.domain.co',
    'a@b.io',
  ])('accepts %s', (email) => {
    expect(isEmailValid(email)).toBe(true);
  });

  it.each([
    '',
    'plainstring',
    '@nouser.com',
    'user@',
    'user@host',
    'user@host.',
  ])('rejects %s', (email) => {
    expect(isEmailValid(email)).toBe(false);
  });

  it('trims whitespace before validating', () => {
    expect(isEmailValid('  user@example.com  ')).toBe(true);
  });
});

describe('isPasswordValid', () => {
  it('rejects passwords shorter than 8 chars', () => {
    expect(isPasswordValid('Aa1!')).toBe(false);
  });

  it('accepts weak password when requireStrong is false', () => {
    expect(isPasswordValid('simplepass', false)).toBe(true);
  });

  it('rejects weak password when requireStrong is true (default)', () => {
    expect(isPasswordValid('simplepass')).toBe(false);
    expect(isPasswordValid('alllowercase1')).toBe(false);
  });

  it('accepts strong password (8+, mayúscula, dígito)', () => {
    expect(isPasswordValid('Secret123')).toBe(true);
    expect(isPasswordValid('C0mpl3j0!')).toBe(true);
  });
});

describe('isConfirmPasswordValid', () => {
  it('returns false when empty', () => {
    expect(isConfirmPasswordValid('', '')).toBe(false);
  });

  it('returns true when both match', () => {
    expect(isConfirmPasswordValid('Secret123', 'Secret123')).toBe(true);
  });

  it('returns false when different', () => {
    expect(isConfirmPasswordValid('Secret123', 'Secret456')).toBe(false);
  });
});

describe('isNameValid', () => {
  it('rejects names shorter than 2 chars', () => {
    expect(isNameValid('A')).toBe(false);
    expect(isNameValid('')).toBe(false);
  });

  it('accepts names of 2+ chars (trimmed)', () => {
    expect(isNameValid('Jo')).toBe(true);
    expect(isNameValid('  María  ')).toBe(true);
  });
});

describe('isVenezuelanPhoneValid', () => {
  it('rejects non-VE country codes', () => {
    expect(
      isVenezuelanPhoneValid({ countryCode: '+1', areaCode: '0412', phoneNumber: '1234567' }),
    ).toBe(false);
  });

  it('rejects unknown operadoras', () => {
    expect(
      isVenezuelanPhoneValid({ countryCode: '+58', areaCode: '0411', phoneNumber: '1234567' }),
    ).toBe(false);
  });

  it.each(['0412', '0414', '0416', '0422', '0424', '0426'])(
    'accepts operadora %s with 7 digits',
    (area) => {
      expect(
        isVenezuelanPhoneValid({ countryCode: '+58', areaCode: area, phoneNumber: '1234567' }),
      ).toBe(true);
    },
  );

  it('rejects phone numbers that are not 7 digits', () => {
    expect(
      isVenezuelanPhoneValid({ countryCode: '+58', areaCode: '0412', phoneNumber: '12345' }),
    ).toBe(false);
    expect(
      isVenezuelanPhoneValid({ countryCode: '+58', areaCode: '0412', phoneNumber: 'abcdefg' }),
    ).toBe(false);
  });
});

describe('VE enums', () => {
  it('DOC_TYPES contains V, E, P', () => {
    expect(DOC_TYPES).toEqual(['V', 'E', 'P']);
  });

  it('PAYMENT_METHODS contains all VE payment methods', () => {
    expect(PAYMENT_METHODS).toContain('EFECTIVO');
    expect(PAYMENT_METHODS).toContain('PUNTODEVENTA');
    expect(PAYMENT_METHODS).toContain('PAGOMOVIL');
    expect(PAYMENT_METHODS).toContain('TRANSFERENCIA');
    expect(PAYMENT_METHODS).toContain('ZELLE');
    expect(PAYMENT_METHODS).toContain('EXPRESS');
  });

  it('GENDERS contains M, F, OTRO', () => {
    expect(GENDERS).toEqual(['M', 'F', 'OTRO']);
  });
});

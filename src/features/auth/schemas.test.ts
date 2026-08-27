import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  signUpSchema,
  resetEmailSchema,
  resetPinSchema,
  resetNewPasswordSchema,
  changePasswordSchema,
} from './schemas';

describe('loginSchema', () => {
  it('accepts valid email + password', () => {
    const r = loginSchema.safeParse({
      email: 'a@b.com',
      password: 'Secret123',
    });
    expect(r.success).toBe(true);
  });

  it('rejects empty email', () => {
    const r = loginSchema.safeParse({ email: '', password: 'Secret123' });
    expect(r.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const r = loginSchema.safeParse({ email: 'not-an-email', password: 'Secret123' });
    expect(r.success).toBe(false);
  });

  it('rejects empty password', () => {
    const r = loginSchema.safeParse({ email: 'a@b.com', password: '' });
    expect(r.success).toBe(false);
  });

  it('rejects short password', () => {
    const r = loginSchema.safeParse({ email: 'a@b.com', password: 'short' });
    expect(r.success).toBe(false);
  });
});

describe('signUpSchema', () => {
  const validPayload = {
    email: 'maria@example.com',
    documentType: 'V' as const,
    documentNumber: '12345678',
    name: 'María Pérez',
    gender: 'F' as const,
    countryCode: '+58',
    areaCode: '0412' as const,
    phoneNumber: '1234567',
    password: 'Secret123',
    confirmPassword: 'Secret123',
    acceptTerms: true as const,
  };

  it('accepts a complete valid payload', () => {
    expect(signUpSchema.safeParse(validPayload).success).toBe(true);
  });

  it('rejects invalid email', () => {
    const r = signUpSchema.safeParse({ ...validPayload, email: 'bad' });
    expect(r.success).toBe(false);
  });

  it('rejects non-numeric document', () => {
    const r = signUpSchema.safeParse({ ...validPayload, documentNumber: 'abc123' });
    expect(r.success).toBe(false);
  });

  it('rejects invalid operadora', () => {
    const r = signUpSchema.safeParse({ ...validPayload, areaCode: '0411' });
    expect(r.success).toBe(false);
  });

  it('rejects phone with wrong number of digits', () => {
    const r = signUpSchema.safeParse({ ...validPayload, phoneNumber: '12345' });
    expect(r.success).toBe(false);
  });

  it('rejects password without uppercase', () => {
    const r = signUpSchema.safeParse({
      ...validPayload,
      password: 'secret123',
      confirmPassword: 'secret123',
    });
    expect(r.success).toBe(false);
  });

  it('rejects password without number', () => {
    const r = signUpSchema.safeParse({
      ...validPayload,
      password: 'SecretPass',
      confirmPassword: 'SecretPass',
    });
    expect(r.success).toBe(false);
  });

  it('rejects mismatched confirmPassword', () => {
    const r = signUpSchema.safeParse({
      ...validPayload,
      confirmPassword: 'Different1',
    });
    expect(r.success).toBe(false);
  });

  it('rejects when acceptTerms is false', () => {
    const r = signUpSchema.safeParse({
      ...validPayload,
      acceptTerms: false as unknown as true,
    });
    expect(r.success).toBe(false);
  });

  it('accepts E and P document types', () => {
    expect(
      signUpSchema.safeParse({ ...validPayload, documentType: 'E' }).success
    ).toBe(true);
    expect(
      signUpSchema.safeParse({ ...validPayload, documentType: 'P' }).success
    ).toBe(true);
  });

  it('rejects invalid gender', () => {
    const r = signUpSchema.safeParse({
      ...validPayload,
      gender: 'X' as unknown as 'F',
    });
    expect(r.success).toBe(false);
  });
});

describe('resetEmailSchema', () => {
  it('accepts valid email', () => {
    expect(
      resetEmailSchema.safeParse({ email: 'a@b.com' }).success
    ).toBe(true);
  });

  it('rejects empty email', () => {
    expect(resetEmailSchema.safeParse({ email: '' }).success).toBe(false);
  });
});

describe('resetPinSchema', () => {
  it('accepts 6-digit PIN', () => {
    expect(resetPinSchema.safeParse({ pin: '123456' }).success).toBe(true);
  });

  it('rejects PIN shorter than 6', () => {
    expect(resetPinSchema.safeParse({ pin: '12345' }).success).toBe(false);
  });

  it('rejects PIN with non-digits', () => {
    expect(resetPinSchema.safeParse({ pin: '12345a' }).success).toBe(false);
  });
});

describe('resetNewPasswordSchema', () => {
  it('accepts matching strong passwords', () => {
    expect(
      resetNewPasswordSchema.safeParse({
        newPassword: 'Secret123',
        confirmPassword: 'Secret123',
      }).success
    ).toBe(true);
  });

  it('rejects mismatched', () => {
    expect(
      resetNewPasswordSchema.safeParse({
        newPassword: 'Secret123',
        confirmPassword: 'Other123',
      }).success
    ).toBe(false);
  });

  it('rejects weak password', () => {
    expect(
      resetNewPasswordSchema.safeParse({
        newPassword: 'simple',
        confirmPassword: 'simple',
      }).success
    ).toBe(false);
  });
});

describe('changePasswordSchema', () => {
  it('accepts different strong passwords', () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: 'Old12345',
        newPassword: 'New12345',
        confirmPassword: 'New12345',
      }).success
    ).toBe(true);
  });

  it('rejects when new equals current', () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: 'Same12345',
        newPassword: 'Same12345',
        confirmPassword: 'Same12345',
      }).success
    ).toBe(false);
  });

  it('rejects mismatched confirm', () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: 'Old12345',
        newPassword: 'New12345',
        confirmPassword: 'Other12345',
      }).success
    ).toBe(false);
  });
});

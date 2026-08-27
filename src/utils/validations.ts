/**
 * Validaciones equivalentes a las de la web, ajustadas al contexto VE.
 * Se usan con react-hook-form vía `@hookform/resolvers/zod` o manual.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmailValid(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function isPasswordValid(value: string, requireStrong = true): boolean {
  if (value.length < 8) return false;
  if (!requireStrong) return true;
  return /[A-Z]/.test(value) && /[0-9]/.test(value);
}

export function isConfirmPasswordValid(pwd: string, confirm: string): boolean {
  return pwd === confirm && pwd.length > 0;
}

export function isNameValid(value: string): boolean {
  return value.trim().length >= 2;
}

const VE_OPERATORAS = ['0412', '0414', '0416', '0422', '0424', '0426'];

/** Valida teléfono venezolano. Espera: { countryCode, areaCode, phoneNumber }. */
export function isVenezuelanPhoneValid(input: {
  countryCode: string;
  areaCode: string;
  phoneNumber: string;
}): boolean {
  const { countryCode, areaCode, phoneNumber } = input;
  if (countryCode !== '+58') return false;
  if (!VE_OPERATORAS.includes(areaCode)) return false;
  return /^\d{7}$/.test(phoneNumber);
}

/** Tipos de documento VE. */
export const DOC_TYPES = ['V', 'E', 'P'] as const;
export type DocType = (typeof DOC_TYPES)[number];

/** Métodos de pago VE. */
export const PAYMENT_METHODS = [
  'EFECTIVO',
  'PUNTODEVENTA',
  'PAGOMOVIL',
  'TRANSFERENCIA',
  'ZELLE',
  'EXPRESS',
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Genders. */
export const GENDERS = ['M', 'F', 'OTRO'] as const;
export type Gender = (typeof GENDERS)[number];

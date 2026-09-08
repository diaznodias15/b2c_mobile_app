/**
 * Validaciones equivalentes a las de la web, ajustadas al contexto VE.
 * Se usan con react-hook-form vía `@hookform/resolvers/zod` o manual.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmailValid(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

/**
 * Política real del backend (AUTH_WEB_FLOWS.md): 8-40 caracteres,
 * mínimo 1 minúscula + 1 mayúscula + 1 número + 1 carácter especial.
 * `requireStrong = false` es para el login (no tiene sentido re-validar
 * la fuerza de una contraseña ya existente, solo que no esté vacía).
 */
export function isPasswordValid(value: string, requireStrong = true): boolean {
  if (value.length < 8 || value.length > 40) return false;
  if (!requireStrong) return true;
  return (
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /[0-9]/.test(value) &&
    /[$&+,:;=?@#<>.^*()%!-]/.test(value)
  );
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

/**
 * Tipos de documento que acepta el backend (`document_type`, regex
 * `/[VEPJG]/` sin anclar — ver nota de seguridad en AUTH_WEB_FLOWS.md:
 * el cliente DEBE restringir a estas 5 opciones con un selector, nunca
 * un TextInput libre, porque el regex del server no está anclado y
 * dejaría pasar basura como "XVE").
 */
export const DOC_TYPES = ['V', 'E', 'P', 'J', 'G'] as const;
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

/**
 * `id_gender` del backend es binario (0 | 1), NO un enum de 3 valores
 * como se había asumido antes — confirmado en AUTH_WEB_FLOWS.md
 * ("radio 0=femenino / 1=masculino").
 */
export const GENDER_OPTIONS = [
  { value: 0, label: 'Femenino' },
  { value: 1, label: 'Masculino' },
] as const;
export type GenderValue = (typeof GENDER_OPTIONS)[number]['value'];

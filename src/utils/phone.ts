/**
 * Teléfono de contacto venezolano en 3 partes, tal como lo exige
 * `POST /api/orders/create` (`tx_recipient_country_code`,
 * `tx_recipient_area_code`, `tx_recipient_phone_number`): país `+58`,
 * operadora de 4 dígitos y número con guión `000-0000`.
 *
 * El backend valida el número con `^[0-9]{3}-[0-9]{4}$` y la operadora contra
 * esta misma lista — mandar el teléfono en un solo campo libre es un `400`.
 */
export const VE_COUNTRY_CODE = '+58' as const;
export const VE_AREA_CODES = ['0412', '0414', '0416', '0422', '0424', '0426'] as const;

/** Deja solo dígitos (máx. 7) y pone el guión: "4567890" → "456-7890". */
export function formatPhoneNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 7);
  return digits.length > 3 ? `${digits.slice(0, 3)}-${digits.slice(3)}` : digits;
}

export function isPhoneNumberValid(value: string): boolean {
  return /^\d{3}-\d{4}$/.test(value);
}

export function isAreaCodeValid(value: string): boolean {
  return (VE_AREA_CODES as readonly string[]).includes(value);
}

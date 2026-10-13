/**
 * Enlaces de contacto a partir de los teléfonos de la config del backend.
 *
 * El backend manda el teléfono como lo cargó el admin, en formato local venezolano
 * ("0422-9876543"), pero `wa.me` exige el número internacional sin "+" ni ceros a la izquierda
 * ("584229876543"): con "04229876543" WhatsApp responde que el número no existe.
 */

const VE_COUNTRY_PREFIX = '58';

/** Número listo para `wa.me`: solo dígitos, con código de país. `''` si no hay dígitos. */
export function toWhatsAppNumber(raw: string | null | undefined): string {
  const original = (raw ?? '').trim();
  const digits = original.replace(/\D/g, '');
  if (!digits) return '';
  // Con "+" o "00" ya trae código de país.
  if (original.startsWith('+')) return digits;
  if (digits.startsWith('00')) return digits.slice(2);
  // Formato local venezolano: "0422…" → "58422…".
  if (digits.startsWith('0')) return VE_COUNTRY_PREFIX + digits.slice(1);
  return digits;
}

/** URL de `wa.me`, con el mensaje inicial opcional. `null` si el teléfono no tiene dígitos. */
export function buildWhatsAppUrl(raw: string | null | undefined, message?: string | null): string | null {
  const number = toWhatsAppNumber(raw);
  if (!number) return null;
  const text = message?.trim();
  return text ? `https://wa.me/${number}?text=${encodeURIComponent(text)}` : `https://wa.me/${number}`;
}

/** URL `tel:` (conserva el "+" inicial si lo hay). `null` si no hay dígitos. */
export function buildTelUrl(raw: string | null | undefined): string | null {
  const cleaned = (raw ?? '').replace(/[^\d+]/g, '');
  return /\d/.test(cleaned) ? `tel:${cleaned}` : null;
}

/** URL `mailto:`. `null` si no parece un correo. */
export function buildMailtoUrl(raw: string | null | undefined): string | null {
  const email = (raw ?? '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? `mailto:${email}` : null;
}

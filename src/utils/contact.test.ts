import { describe, it, expect } from 'vitest';
import { buildMailtoUrl, buildTelUrl, buildWhatsAppUrl, toWhatsAppNumber } from './contact';

describe('toWhatsAppNumber', () => {
  it('formato local venezolano: cambia el 0 inicial por 58', () => {
    expect(toWhatsAppNumber('0422-9876543')).toBe('584229876543');
    expect(toWhatsAppNumber('0414 123 4567')).toBe('584141234567');
  });

  it('con "+" o "00" conserva el código de país', () => {
    expect(toWhatsAppNumber('+58 424 0000000')).toBe('584240000000');
    expect(toWhatsAppNumber('+1 (305) 555-0100')).toBe('13055550100');
    expect(toWhatsAppNumber('0058 424 0000000')).toBe('584240000000');
  });

  it('ya internacional sin "+": no duplica el prefijo', () => {
    expect(toWhatsAppNumber('584229876543')).toBe('584229876543');
  });

  it('vacío, null o sin dígitos → cadena vacía', () => {
    expect(toWhatsAppNumber('')).toBe('');
    expect(toWhatsAppNumber(null)).toBe('');
    expect(toWhatsAppNumber(undefined)).toBe('');
    expect(toWhatsAppNumber('abc')).toBe('');
  });
});

describe('buildWhatsAppUrl', () => {
  it('arma la URL de wa.me', () => {
    expect(buildWhatsAppUrl('0422-9876543')).toBe('https://wa.me/584229876543');
  });

  it('codifica el mensaje inicial', () => {
    expect(buildWhatsAppUrl('0422-9876543', 'Hola, tengo una duda')).toBe(
      'https://wa.me/584229876543?text=Hola%2C%20tengo%20una%20duda'
    );
  });

  it('ignora un mensaje vacío y devuelve null sin teléfono', () => {
    expect(buildWhatsAppUrl('0422-9876543', '  ')).toBe('https://wa.me/584229876543');
    expect(buildWhatsAppUrl(null)).toBeNull();
  });
});

describe('buildTelUrl / buildMailtoUrl', () => {
  it('tel: limpia separadores y conserva el +', () => {
    expect(buildTelUrl('0422-9876543')).toBe('tel:04229876543');
    expect(buildTelUrl('+58 424 000 0000')).toBe('tel:+584240000000');
    expect(buildTelUrl('sin numero')).toBeNull();
  });

  it('mailto: solo con un correo con forma válida', () => {
    expect(buildMailtoUrl(' ayuda@tienda.com ')).toBe('mailto:ayuda@tienda.com');
    expect(buildMailtoUrl('no-es-correo')).toBeNull();
    expect(buildMailtoUrl(null)).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';

import { createConsecutiveReader, normalizeBarcode } from './barcode';

describe('normalizeBarcode', () => {
  it('recorta espacios', () => {
    expect(normalizeBarcode('  7591234500001 ')).toBe('7591234500001');
  });

  it('descarta lo muy corto, vacío o que no es texto', () => {
    expect(normalizeBarcode('ab')).toBeNull();
    expect(normalizeBarcode('   ')).toBeNull();
    expect(normalizeBarcode(undefined)).toBeNull();
    expect(normalizeBarcode(123456)).toBeNull();
  });

  it('acepta exactamente 3 caracteres', () => {
    expect(normalizeBarcode('abc')).toBe('abc');
  });
});

describe('createConsecutiveReader', () => {
  it('acepta un código tras 2 lecturas consecutivas iguales', () => {
    const reader = createConsecutiveReader();
    expect(reader.push('7591234500001')).toBeNull();
    expect(reader.push('7591234500001')).toBe('7591234500001');
  });

  it('un código distinto reinicia la cuenta', () => {
    const reader = createConsecutiveReader();
    expect(reader.push('7591234500001')).toBeNull();
    expect(reader.push('7599999999999')).toBeNull();
    expect(reader.push('7591234500001')).toBeNull();
    expect(reader.push('7591234500001')).toBe('7591234500001');
  });

  it('una lectura vacía o corta reinicia la cuenta', () => {
    const reader = createConsecutiveReader();
    reader.push('7591234500001');
    expect(reader.push('')).toBeNull();
    expect(reader.push('7591234500001')).toBeNull();
  });

  it('tras aceptar, vuelve a pedir lecturas nuevas', () => {
    const reader = createConsecutiveReader();
    reader.push('111222');
    expect(reader.push('111222')).toBe('111222');
    expect(reader.push('111222')).toBeNull();
    expect(reader.push('111222')).toBe('111222');
  });

  it('reset descarta la cuenta en curso', () => {
    const reader = createConsecutiveReader();
    reader.push('111222');
    reader.reset();
    expect(reader.push('111222')).toBeNull();
  });
});

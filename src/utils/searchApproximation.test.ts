import { describe, expect, it } from 'vitest';

import { adaptSearchApproximation, getApproximationNotice } from './searchApproximation';

describe('adaptSearchApproximation', () => {
  it('con approximate true devuelve los términos', () => {
    expect(
      adaptSearchApproximation({ min_price: 1, approximate: true, original_term: 'DUROVLA', matched_term: 'DUROV' })
    ).toEqual({ original_term: 'DUROVLA', matched_term: 'DUROV' });
  });

  it.each([
    undefined,
    null,
    'texto',
    {},
    { approximate: null },
    { approximate: false },
    { approximate: 'true' },
    { approximate: 1 },
  ])('devuelve null con %j', (metadata) => {
    expect(adaptSearchApproximation(metadata)).toBeNull();
  });

  it('tolera términos ausentes', () => {
    expect(adaptSearchApproximation({ approximate: true })).toEqual({ original_term: '', matched_term: '' });
  });
});

describe('getApproximationNotice', () => {
  it('usa lo escrito y no menciona el término recortado', () => {
    const text = getApproximationNotice({ original_term: 'CAPSULAX', matched_term: 'CAPSUL' }, 'capsulax');
    expect(text).toBe('Sin resultados exactos para «CAPSULAX». Mostramos productos similares.');
    expect(text).not.toContain('CAPSUL.');
  });

  it('cae a lo que hay en el buscador si el backend no devolvió original_term', () => {
    expect(getApproximationNotice({ original_term: '', matched_term: '' }, '  jarabx ')).toBe(
      'Sin resultados exactos para «jarabx». Mostramos productos similares.'
    );
  });
});

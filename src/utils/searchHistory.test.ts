import { describe, it, expect } from 'vitest';
import { addToSearchHistory, MAX_SEARCH_HISTORY, removeFromSearchHistory } from './searchHistory';

describe('addToSearchHistory', () => {
  it('agrega al inicio y recorta espacios', () => {
    expect(addToSearchHistory(['gasa'], '  ibuprofeno  ')).toEqual(['ibuprofeno', 'gasa']);
  });

  it('colapsa espacios internos', () => {
    expect(addToSearchHistory([], 'acido   alfa   lipoico')).toEqual(['acido alfa lipoico']);
  });

  it('ignora búsquedas de menos de 3 letras', () => {
    expect(addToSearchHistory(['gasa'], 'ab')).toEqual(['gasa']);
    expect(addToSearchHistory(['gasa'], '   ')).toEqual(['gasa']);
  });

  it('no repite: la repetida sube al primer lugar con su escritura nueva', () => {
    expect(addToSearchHistory(['gasa', 'alcohol', 'vitamina'], 'ALCOHOL')).toEqual(['ALCOHOL', 'gasa', 'vitamina']);
  });

  it(`se queda con las ${MAX_SEARCH_HISTORY} más recientes`, () => {
    const full = ['uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis'];
    const next = addToSearchHistory(full, 'siete');
    expect(next).toHaveLength(MAX_SEARCH_HISTORY);
    expect(next[0]).toBe('siete');
    expect(next).not.toContain('seis');
  });

  it('no muta la lista original', () => {
    const original = ['gasa'];
    addToSearchHistory(original, 'alcohol');
    expect(original).toEqual(['gasa']);
  });
});

describe('removeFromSearchHistory', () => {
  it('quita sin distinguir mayúsculas', () => {
    expect(removeFromSearchHistory(['Gasa', 'alcohol'], 'gasa')).toEqual(['alcohol']);
  });

  it('si no está, deja todo igual', () => {
    expect(removeFromSearchHistory(['gasa'], 'otra')).toEqual(['gasa']);
  });
});

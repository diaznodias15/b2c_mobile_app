import { describe, it, expect } from 'vitest';
import {
  bsToPriceInput,
  clearPrice,
  countActiveFilters,
  getDepartmentCategories,
  hasActiveFilters,
  parsePriceRange,
  priceInputToBs,
  selectCategory,
  selectSubcategory,
  setPriceRange,
  validatePriceRange,
} from './productFilters';

describe('selección excluyente', () => {
  it('elegir categoría borra subcategoría y precio', () => {
    expect(selectCategory('a')).toEqual({ category: 'a' });
  });

  it('elegir subcategoría borra categoría y precio', () => {
    expect(selectSubcategory('s')).toEqual({ subcategory: 's' });
  });

  it('el precio se conserva junto a la categoría y clearPrice lo quita', () => {
    const f = setPriceRange(selectCategory('a'), 10, 20);
    expect(f).toEqual({ category: 'a', minPrice: 10, maxPrice: 20 });
    expect(clearPrice(f)).toEqual({ category: 'a' });
  });
});

describe('hasActiveFilters / countActiveFilters', () => {
  it('sin filtros', () => {
    expect(hasActiveFilters({})).toBe(false);
    expect(countActiveFilters({})).toBe(0);
  });

  it('categoría + precio cuentan 2', () => {
    const f = { category: 'a', minPrice: 1 };
    expect(hasActiveFilters(f)).toBe(true);
    expect(countActiveFilters(f)).toBe(2);
  });

  it('un mínimo de 0 sigue siendo un filtro de precio', () => {
    expect(hasActiveFilters({ minPrice: 0 })).toBe(true);
  });
});

describe('priceInputToBs / bsToPriceInput', () => {
  it('Bs. se toma tal cual, con coma o punto', () => {
    expect(priceInputToBs('12,5', 'Bs.', 800)).toBe(12.5);
    expect(priceInputToBs('12.5', 'Bs.', 800)).toBe(12.5);
  });

  it('REF multiplica por la tasa', () => {
    expect(priceInputToBs('2', 'REF', 800)).toBe(1600);
  });

  it('vacío, negativo o texto → undefined', () => {
    expect(priceInputToBs('', 'Bs.', 800)).toBeUndefined();
    expect(priceInputToBs('-1', 'Bs.', 800)).toBeUndefined();
    expect(priceInputToBs('abc', 'Bs.', 800)).toBeUndefined();
  });

  it('REF sin tasa válida → undefined', () => {
    expect(priceInputToBs('2', 'REF', 0)).toBeUndefined();
    expect(priceInputToBs('2', 'REF', undefined)).toBeUndefined();
  });

  it('bsToPriceInput convierte de vuelta y tolera undefined', () => {
    expect(bsToPriceInput(1600, 'REF', 800)).toBe('2');
    expect(bsToPriceInput(1600, 'Bs.', 800)).toBe('1600');
    expect(bsToPriceInput(undefined, 'Bs.', 800)).toBe('');
  });
});

describe('validatePriceRange', () => {
  it('rechaza min > max', () => {
    expect(validatePriceRange(10, 5)).not.toBeNull();
  });
  it('acepta rangos válidos o abiertos', () => {
    expect(validatePriceRange(5, 10)).toBeNull();
    expect(validatePriceRange(5, undefined)).toBeNull();
    expect(validatePriceRange(undefined, undefined)).toBeNull();
  });
});

describe('parsePriceRange', () => {
  it('convierte strings a número', () => {
    expect(parsePriceRange({ min_price: '1.5', max_price: 9 })).toEqual({ min: 1.5, max: 9 });
  });
  it('null si min == max, ambos 0 o no hay metadata', () => {
    expect(parsePriceRange({ min_price: 5, max_price: 5 })).toBeNull();
    expect(parsePriceRange({ min_price: 0, max_price: 0 })).toBeNull();
    expect(parsePriceRange(undefined)).toBeNull();
  });
});

describe('getDepartmentCategories', () => {
  it('departamento sin categorías → []', () => {
    expect(getDepartmentCategories({ categories: [] })).toEqual([]);
    expect(getDepartmentCategories(undefined)).toEqual([]);
  });

  it('acepta sub_categories (web) y subcategories, y descarta lo que no tiene slug', () => {
    const result = getDepartmentCategories({
      categories: [
        { tx_slug: 'a', nb_category: 'A', sub_categories: [{ tx_slug: 's1' }, {}] } as never,
        { tx_slug: 'b', nb_category: 'B', subcategories: [{ tx_slug: 's2' }] },
        { nb_category: 'sin slug' },
      ],
    });
    expect(result.map((c) => c.tx_slug)).toEqual(['a', 'b']);
    expect(result[0].subcategories).toEqual([{ tx_slug: 's1' }]);
    expect(result[1].subcategories).toEqual([{ tx_slug: 's2' }]);
  });
});

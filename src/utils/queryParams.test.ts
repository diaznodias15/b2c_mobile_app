import { describe, it, expect } from 'vitest';
import { toQueryString } from './queryParams';

describe('toQueryString', () => {
  it('returns empty string for empty object', () => {
    expect(toQueryString({})).toBe('');
  });

  it('encodes a single param', () => {
    expect(toQueryString({ branch: 5 })).toBe('?branch=5');
  });

  it('joins multiple params with &', () => {
    expect(toQueryString({ branch: 5, page: 1 })).toBe('?branch=5&page=1');
  });

  it('omits null values', () => {
    expect(toQueryString({ branch: null, page: 1 })).toBe('?page=1');
  });

  it('omits undefined values', () => {
    expect(toQueryString({ branch: undefined, page: 1 })).toBe('?page=1');
  });

  it('omits empty strings', () => {
    expect(toQueryString({ branch: '', page: 1 })).toBe('?page=1');
  });

  it('preserves 0 and false as valid values', () => {
    expect(toQueryString({ min_price: 0, active: false })).toBe(
      '?min_price=0&active=false',
    );
  });

  it('URL-encodes special characters', () => {
    expect(toQueryString({ q: 'café & pan' })).toBe('?q=caf%C3%A9%20%26%20pan');
  });

  it('handles a realistic product list query', () => {
    expect(
      toQueryString({
        branch: 3,
        category: 'dermocosmetica',
        subcategory: null,
        min_price: 0,
        max_price: 500,
        page: 1,
      }),
    ).toBe('?branch=3&category=dermocosmetica&min_price=0&max_price=500&page=1');
  });
});

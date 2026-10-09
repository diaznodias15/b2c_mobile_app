import { describe, expect, it } from 'vitest';

import { getProductDetailView } from './productDetailState';

const base = {
  hasSlug: true,
  hasBranch: true,
  hasData: false,
  isFetching: false,
  isError: false,
  isSlow: false,
};

describe('getProductDetailView', () => {
  it('muestra el producto cuando hay datos', () => {
    expect(getProductDetailView({ ...base, hasData: true })).toBe('ready');
  });

  it('con datos sigue mostrándolo aunque un refetch posterior falle', () => {
    expect(getProductDetailView({ ...base, hasData: true, isError: true })).toBe('ready');
  });

  it('esqueleto mientras carga', () => {
    expect(getProductDetailView({ ...base, isFetching: true })).toBe('loading');
  });

  it('pasa a "tarda demasiado" si lleva mucho cargando', () => {
    expect(getProductDetailView({ ...base, isFetching: true, isSlow: true })).toBe('slow');
  });

  it('una consulta fallida muestra el error (ya no el esqueleto para siempre)', () => {
    expect(getProductDetailView({ ...base, isError: true })).toBe('error');
  });

  it('al reintentar muestra la carga y no el error viejo (isError sigue true durante el refetch)', () => {
    expect(getProductDetailView({ ...base, isError: true, isFetching: true })).toBe('loading');
  });

  it('sin sede no hay consulta: mensaje propio, no esqueleto', () => {
    expect(getProductDetailView({ ...base, hasBranch: false })).toBe('no-branch');
    expect(getProductDetailView({ ...base, hasBranch: false, isFetching: true })).toBe('no-branch');
  });

  it('sin slug es "no encontrado"', () => {
    expect(getProductDetailView({ ...base, hasSlug: false })).toBe('not-found');
  });

  it('éxito pero sin producto es "no encontrado"', () => {
    expect(getProductDetailView(base)).toBe('not-found');
  });
});

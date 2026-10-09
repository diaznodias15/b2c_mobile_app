import { describe, expect, it } from 'vitest';

import { createNavigationGuard } from './navigation';

describe('createNavigationGuard', () => {
  it('deja pasar la primera navegación', () => {
    const guard = createNavigationGuard(700, () => 1000);
    expect(guard()).toBe(true);
  });

  it('descarta toques repetidos dentro de la ventana', () => {
    let t = 1000;
    const guard = createNavigationGuard(700, () => t);
    expect(guard()).toBe(true);
    t = 1100;
    expect(guard()).toBe(false);
    t = 1699;
    expect(guard()).toBe(false);
  });

  it('vuelve a permitir pasada la ventana', () => {
    let t = 1000;
    const guard = createNavigationGuard(700, () => t);
    expect(guard()).toBe(true);
    t = 1700;
    expect(guard()).toBe(true);
  });

  it('los toques descartados no extienden la ventana', () => {
    let t = 0;
    const guard = createNavigationGuard(700, () => t);
    guard();
    t = 600;
    guard();
    t = 700;
    expect(guard()).toBe(true);
  });
});

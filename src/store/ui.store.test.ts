import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from './ui.store';

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.getState().reset();
  });

  it('starts with no modal and no toast', () => {
    const s = useUIStore.getState();
    expect(s.activeModal).toBeNull();
    expect(s.toast).toBeNull();
  });

  it('openModal sets activeModal', () => {
    useUIStore.getState().openModal('logout');
    expect(useUIStore.getState().activeModal).toBe('logout');
  });

  it('closeModal clears activeModal', () => {
    useUIStore.getState().openModal('logout');
    useUIStore.getState().closeModal();
    expect(useUIStore.getState().activeModal).toBeNull();
  });

  it('showToast sets toast with type', () => {
    useUIStore.getState().showToast('Hola', 'success');
    expect(useUIStore.getState().toast).toEqual({
      message: 'Hola',
      type: 'success',
    });
  });

  it('showToast defaults to info', () => {
    useUIStore.getState().showToast('Hola');
    expect(useUIStore.getState().toast?.type).toBe('info');
  });

  it('showToast acepta objeto {title, description}', () => {
    useUIStore.getState().showToast({
      title: 'Producto agregado',
      description: '1 x Ibuprofeno',
      type: 'success',
    });
    const t = useUIStore.getState().toast;
    expect(t?.title).toBe('Producto agregado');
    expect(t?.message).toBe('1 x Ibuprofeno');
    expect(t?.type).toBe('success');
  });

  it('clearToast clears toast', () => {
    useUIStore.getState().showToast('Hola');
    useUIStore.getState().clearToast();
    expect(useUIStore.getState().toast).toBeNull();
  });

  it('showSessionExpired opens sessionExpired modal', () => {
    useUIStore.getState().showSessionExpired();
    expect(useUIStore.getState().activeModal).toBe('sessionExpired');
  });

  it('reset clears both modal and toast', () => {
    useUIStore.getState().openModal('emailUnverified');
    useUIStore.getState().showToast('Hola');
    useUIStore.getState().reset();
    const s = useUIStore.getState();
    expect(s.activeModal).toBeNull();
    expect(s.toast).toBeNull();
  });
});

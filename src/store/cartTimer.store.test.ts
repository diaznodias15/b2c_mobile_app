import { beforeEach, describe, expect, it } from 'vitest';

import { useCartTimerStore } from './cartTimer.store';

describe('useCartTimerStore', () => {
  beforeEach(() => {
    useCartTimerStore.setState({ deadline: null, workingHoursShownFor: [] });
  });

  it('arranca sin cuenta activa', () => {
    expect(useCartTimerStore.getState().deadline).toBeNull();
  });

  it('start fija el deadline = ahora + segundos', () => {
    useCartTimerStore.getState().start(420, 1_000);
    expect(useCartTimerStore.getState().deadline).toBe(1_000 + 420_000);
  });

  it('start de nuevo reinicia la cuenta', () => {
    useCartTimerStore.getState().start(420, 1_000);
    useCartTimerStore.getState().start(420, 5_000);
    expect(useCartTimerStore.getState().deadline).toBe(5_000 + 420_000);
  });

  it('reset borra el deadline', () => {
    useCartTimerStore.getState().start(60, 0);
    useCartTimerStore.getState().reset();
    expect(useCartTimerStore.getState().deadline).toBeNull();
  });

  it('markWorkingHoursShown recuerda la sede y no duplica', () => {
    useCartTimerStore.getState().markWorkingHoursShown(1);
    useCartTimerStore.getState().markWorkingHoursShown(1);
    useCartTimerStore.getState().markWorkingHoursShown(2);
    expect(useCartTimerStore.getState().workingHoursShownFor).toEqual([1, 2]);
  });
});

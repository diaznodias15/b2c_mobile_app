import { describe, it, expect, beforeEach } from 'vitest';
import { useDepartmentStore } from './department.store';
import type { Department } from '@/types/whitelabel';

const deps: Department[] = [
  { id: 1, nb_department: 'SALUD', tx_slug: 'salud' },
  { id: 2, nb_department: 'BEBÉ', tx_slug: 'bebe' },
];

describe('useDepartmentStore', () => {
  beforeEach(() => {
    useDepartmentStore.getState().reset();
  });

  it('starts empty', () => {
    expect(useDepartmentStore.getState().departments).toEqual([]);
  });

  it('setDepartments guarda la lista', () => {
    useDepartmentStore.getState().setDepartments(deps);
    expect(useDepartmentStore.getState().departments).toHaveLength(2);
  });

  it('reset() vacía el store', () => {
    useDepartmentStore.getState().setDepartments(deps);
    useDepartmentStore.getState().reset();
    expect(useDepartmentStore.getState().departments).toEqual([]);
  });
});

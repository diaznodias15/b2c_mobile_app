import { describe, it, expect, beforeEach } from 'vitest';
import { useBranchStore, type Branch } from './branch.store';

const branchA: Branch = {
  id: 1,
  nb_name: 'Sede Maracaibo',
  nb_state: 'Zulia',
  nb_city: 'Maracaibo',
  qty_latitude: 10.6666,
  qty_longitude: -71.6125,
};

const branchB: Branch = {
  id: 2,
  nb_name: 'Sede Caracas',
  nb_state: 'Distrito Capital',
  nb_city: 'Caracas',
};

describe('useBranchStore', () => {
  beforeEach(() => {
    useBranchStore.getState().reset();
  });

  it('starts with empty state', () => {
    const s = useBranchStore.getState();
    expect(s.selectedBranch).toBeNull();
    expect(s.branches).toEqual([]);
  });

  it('setSelectedBranch stores the branch', () => {
    useBranchStore.getState().setSelectedBranch(branchA);
    expect(useBranchStore.getState().selectedBranch).toEqual(branchA);
  });

  it('setSelectedBranch replaces the previous selection', () => {
    useBranchStore.getState().setSelectedBranch(branchA);
    useBranchStore.getState().setSelectedBranch(branchB);
    expect(useBranchStore.getState().selectedBranch?.id).toBe(2);
  });

  it('setBranches stores the full list', () => {
    useBranchStore.getState().setBranches([branchA, branchB]);
    expect(useBranchStore.getState().branches).toHaveLength(2);
  });

  it('setBranches does NOT auto-select a branch', () => {
    useBranchStore.getState().setBranches([branchA, branchB]);
    expect(useBranchStore.getState().selectedBranch).toBeNull();
  });

  it('reset() clears both selected and list', () => {
    useBranchStore.getState().setBranches([branchA, branchB]);
    useBranchStore.getState().setSelectedBranch(branchA);
    useBranchStore.getState().reset();
    const s = useBranchStore.getState();
    expect(s.selectedBranch).toBeNull();
    expect(s.branches).toEqual([]);
  });
});

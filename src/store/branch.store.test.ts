import { describe, it, expect, beforeEach } from 'vitest';
import { useBranchStore } from './branch.store';
import type { BranchGroup, BranchItem } from '@/types/whitelabel';

const itemA: BranchItem = {
  value: 1,
  label: 'Sede Norte',
  nb_branch: 'FARMACIA EL SAMAN DE PERIJA',
  tx_alias: 'Sede Norte',
  lat: 10.5,
  lng: -71.6,
  is_default: 1,
};

const itemB: BranchItem = {
  value: 2,
  label: 'Sede Centro',
  nb_branch: 'FARMACIA EL SAMAN DE PERIJA',
  tx_alias: 'Sede Centro',
  is_default: 0,
};

const tree: BranchGroup[] = [
  {
    nb_state: 'Zulia',
    nb_city: 'Maracaibo',
    group: 'Maracaibo | Zulia',
    items: [itemA, itemB],
  },
];

describe('useBranchStore', () => {
  beforeEach(() => {
    useBranchStore.getState().reset();
  });

  it('starts with empty state', () => {
    const s = useBranchStore.getState();
    expect(s.selectedBranch).toBeNull();
    expect(s.branchTree).toEqual([]);
  });

  it('setSelectedBranch stores the branch', () => {
    useBranchStore.getState().setSelectedBranch(itemA);
    expect(useBranchStore.getState().selectedBranch).toEqual(itemA);
  });

  it('setSelectedBranch replaces the previous selection', () => {
    useBranchStore.getState().setSelectedBranch(itemA);
    useBranchStore.getState().setSelectedBranch(itemB);
    expect(useBranchStore.getState().selectedBranch?.value).toBe(2);
  });

  it('setBranchTree stores the full tree', () => {
    useBranchStore.getState().setBranchTree(tree);
    expect(useBranchStore.getState().branchTree).toHaveLength(1);
    expect(useBranchStore.getState().branchTree[0].items).toHaveLength(2);
  });

  it('setBranchTree does NOT auto-select a branch', () => {
    useBranchStore.getState().setBranchTree(tree);
    expect(useBranchStore.getState().selectedBranch).toBeNull();
  });

  it('reset() clears both selected and tree', () => {
    useBranchStore.getState().setBranchTree(tree);
    useBranchStore.getState().setSelectedBranch(itemA);
    useBranchStore.getState().reset();
    const s = useBranchStore.getState();
    expect(s.selectedBranch).toBeNull();
    expect(s.branchTree).toEqual([]);
  });
});

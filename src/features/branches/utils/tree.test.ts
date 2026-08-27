import { describe, it, expect } from 'vitest';
import {
  flattenBranchTree,
  pickDefaultBranch,
  findBranchById,
} from './tree';
import type { BranchGroup } from '@/types/whitelabel';

const tree: BranchGroup[] = [
  {
    nb_state: 'Zulia',
    nb_city: 'Maracaibo',
    group: 'Maracaibo | Zulia',
    items: [
      {
        value: 1,
        label: 'Sede Norte',
        nb_branch: 'FARMACIA EL SAMAN DE PERIJA',
        tx_alias: 'Sede Norte',
        tx_address: 'Av. Principal',
        tx_phone: '+584141112312',
        is_default: 1,
        tx_working_hours: 'L-V 8-18',
        lat: 10.5,
        lng: -71.6,
      },
      {
        value: 2,
        label: 'Sede Centro',
        nb_branch: 'FARMACIA EL SAMAN DE PERIJA',
        tx_alias: 'Sede Centro',
        is_default: 0,
        lat: 10.6,
        lng: -71.7,
      },
    ],
  },
  {
    nb_state: 'Zulia',
    nb_city: 'Rosario de Perijá',
    group: 'Rosario de Perijá | Zulia',
    items: [
      {
        value: 3,
        label: 'Sede Principal',
        nb_branch: 'FARMACIA EL SAMAN DE PERIJA',
        tx_alias: 'Sede Principal',
        is_default: 0,
        lat: 10.5,
        lng: -71.7,
      },
    ],
  },
];

describe('flattenBranchTree', () => {
  it('aplana el árbol a una lista', () => {
    const flat = flattenBranchTree(tree);
    expect(flat).toHaveLength(3);
    expect(flat.map((b) => b.value)).toEqual([1, 2, 3]);
  });

  it('devuelve [] para árbol vacío', () => {
    expect(flattenBranchTree([])).toEqual([]);
    expect(flattenBranchTree(undefined as any)).toEqual([]);
  });
});

describe('pickDefaultBranch', () => {
  it('prefiere la sede con is_default=1', () => {
    const def = pickDefaultBranch(tree);
    expect(def?.value).toBe(1);
  });

  it('cae a la primera si ninguna tiene is_default=1', () => {
    const noDefault: BranchGroup[] = [
      {
        nb_state: 'X',
        nb_city: 'Y',
        group: 'Y | X',
        items: [
          { value: 99, label: 'a', nb_branch: 'A' },
          { value: 100, label: 'b', nb_branch: 'B' },
        ],
      },
    ];
    const def = pickDefaultBranch(noDefault);
    expect(def?.value).toBe(99);
  });

  it('devuelve null para árbol vacío', () => {
    expect(pickDefaultBranch([])).toBeNull();
  });
});

describe('findBranchById', () => {
  it('encuentra una sede existente', () => {
    const b = findBranchById(tree, 2);
    expect(b?.tx_alias).toBe('Sede Centro');
  });

  it('devuelve null si no existe', () => {
    expect(findBranchById(tree, 999)).toBeNull();
  });

  it('maneja árbol vacío', () => {
    expect(findBranchById([], 1)).toBeNull();
  });
});

import { describe, it, expect } from 'vitest';
import { haversineDistanceKm, findNearestBranch, hasValidCoordinates } from './geo';
import type { BranchGroup } from '@/types/whitelabel';

describe('haversineDistanceKm', () => {
  it('returns 0 for the same point', () => {
    expect(haversineDistanceKm(10.5, -71.6, 10.5, -71.6)).toBe(0);
  });

  it('returns a plausible distance between Maracaibo and Caracas (~515km)', () => {
    const distance = haversineDistanceKm(10.6427, -71.6125, 10.4806, -66.9036);
    expect(distance).toBeGreaterThan(490);
    expect(distance).toBeLessThan(540);
  });
});

describe('hasValidCoordinates', () => {
  it('returns false for lat/lng 0,0 ("null island" — el backend lo usa como "sin cargar")', () => {
    expect(hasValidCoordinates({ value: 1, label: 'a', nb_branch: 'a', lat: 0, lng: 0 })).toBe(false);
  });

  it('returns false when lat/lng faltan', () => {
    expect(hasValidCoordinates({ value: 1, label: 'a', nb_branch: 'a' })).toBe(false);
  });

  it('returns true for real coordinates', () => {
    expect(
      hasValidCoordinates({ value: 1, label: 'a', nb_branch: 'a', lat: 10.68, lng: -71.62 })
    ).toBe(true);
  });
});

describe('findNearestBranch', () => {
  const tree: BranchGroup[] = [
    {
      nb_state: 'Zulia',
      nb_city: 'Maracaibo',
      group: 'Maracaibo | Zulia',
      items: [
        { value: 1, label: 'Sede Norte', nb_branch: 'GRUPO MARAPLUS', lat: 10.68, lng: -71.62 },
        { value: 2, label: 'Sede Sin Coordenadas', nb_branch: 'GRUPO MARAPLUS' },
        { value: 4, label: 'Sede Sin Cargar', nb_branch: 'GRUPO MARAPLUS', lat: 0, lng: 0 },
      ],
    },
    {
      nb_state: 'Distrito Capital',
      nb_city: 'Caracas',
      group: 'Caracas | Distrito Capital',
      items: [{ value: 3, label: 'Sede Caracas', nb_branch: 'GRUPO MARAPLUS', lat: 10.48, lng: -66.9 }],
    },
  ];

  it('returns the closest branch by coordinates', () => {
    // Usuario parado en Maracaibo — debe elegir la sede 1, no la 3 (Caracas).
    const nearest = findNearestBranch(tree, 10.65, -71.6);
    expect(nearest?.value).toBe(1);
  });

  it('ignores branches without lat/lng', () => {
    const nearest = findNearestBranch(
      [{ nb_state: 'x', nb_city: 'y', group: 'g', items: [{ value: 9, label: 'a', nb_branch: 'a' }] }],
      10,
      -71
    );
    expect(nearest).toBeNull();
  });

  it('returns null for an empty tree', () => {
    expect(findNearestBranch([], 10, -71)).toBeNull();
  });
});

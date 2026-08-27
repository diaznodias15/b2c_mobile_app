import { describe, it, expect } from 'vitest';
import {
  STOCK_LABELS,
  isInStock,
  isOutOfStock,
  sortProducts,
  flattenAvailability,
  findBranchAvailability,
  availabilityForCurrentBranch,
  productDetailImage,
  hasDescription,
  hasFeatures,
} from './adapters';
import type {
  AvailabilityByBranch,
  Product,
  ProductDetail,
} from '@/types/whitelabel';

const mkProduct = (over: Partial<Product> = {}): Product => ({
  id: 1,
  nb_brand: 'X',
  cod_barcode: '0001',
  nb_product: 'A',
  tx_slug: 'a',
  qty_product: 1,
  qty_discount: 0,
  qty_tax: 0,
  tx_img_url: null,
  pri_product_price: '100',
  pri_product_final_price: '100',
  ...over,
});

describe('stock helpers', () => {
  it('STOCK_LABELS tiene los 3 niveles', () => {
    expect(STOCK_LABELS[0]).toBe('Sin stock');
    expect(STOCK_LABELS[1]).toBe('Pocas unidades');
    expect(STOCK_LABELS[2]).toBe('En stock');
  });

  it('isInStock y isOutOfStock', () => {
    expect(isInStock(0)).toBe(false);
    expect(isInStock(1)).toBe(true);
    expect(isInStock(2)).toBe(true);
    expect(isOutOfStock(0)).toBe(true);
    expect(isOutOfStock(2)).toBe(false);
  });
});

describe('sortProducts', () => {
  it('relevance mantiene el orden', () => {
    const list = [mkProduct({ id: 1 }), mkProduct({ id: 2 })];
    expect(sortProducts(list, 'relevance').map((p) => p.id)).toEqual([1, 2]);
  });

  it('name-asc / name-desc', () => {
    const list = [
      mkProduct({ id: 1, nb_product: 'Banana' }),
      mkProduct({ id: 2, nb_product: 'Avena' }),
    ];
    expect(sortProducts(list, 'name-asc').map((p) => p.nb_product)).toEqual([
      'Avena',
      'Banana',
    ]);
    expect(sortProducts(list, 'name-desc').map((p) => p.nb_product)).toEqual([
      'Banana',
      'Avena',
    ]);
  });

  it('price-asc / price-desc', () => {
    const list = [
      mkProduct({ id: 1, pri_product_final_price: '200' }),
      mkProduct({ id: 2, pri_product_final_price: '50' }),
      mkProduct({ id: 3, pri_product_final_price: '100' }),
    ];
    expect(sortProducts(list, 'price-asc').map((p) => p.id)).toEqual([2, 3, 1]);
    expect(sortProducts(list, 'price-desc').map((p) => p.id)).toEqual([1, 3, 2]);
  });

  it('parsea precios con coma decimal como 0 (defensa)', () => {
    const list = [
      mkProduct({ id: 1, pri_product_final_price: '1,50' }),
      mkProduct({ id: 2, pri_product_final_price: '10' }),
    ];
    // '1,50' no parsea (Number.parseFloat espera punto), queda 0
    expect(sortProducts(list, 'price-asc').map((p) => p.id)).toEqual([1, 2]);
  });

  it('no muta el array original', () => {
    const list = [mkProduct({ nb_product: 'B' }), mkProduct({ nb_product: 'A' })];
    const original = [...list];
    sortProducts(list, 'name-asc');
    expect(list).toEqual(original);
  });
});

const tree: AvailabilityByBranch[] = [
  {
    nb_state: 'Zulia',
    cities: [
      {
        nb_city: 'Maracaibo',
        branches: [
          {
            branch_id: 1,
            label: 'Sede Norte',
            nb_branch: 'FARMACIA',
            qty_product: 5,
            pri_product_final_price: '100',
            availability_indicator: 2,
          },
          {
            branch_id: 2,
            label: 'Sede Centro',
            nb_branch: 'FARMACIA',
            qty_product: 0,
            pri_product_final_price: '100',
            availability_indicator: 0,
          },
        ],
      },
    ],
  },
];

describe('flattenAvailability', () => {
  it('aplana a lista plana', () => {
    expect(flattenAvailability(tree)).toHaveLength(2);
  });

  it('devuelve [] si no hay data', () => {
    expect(flattenAvailability(undefined)).toEqual([]);
    expect(flattenAvailability([])).toEqual([]);
  });
});

describe('findBranchAvailability', () => {
  it('encuentra por branch_id', () => {
    const b = findBranchAvailability(tree, 2);
    expect(b?.label).toBe('Sede Centro');
  });

  it('devuelve null si no existe', () => {
    expect(findBranchAvailability(tree, 99)).toBeNull();
  });
});

describe('availabilityForCurrentBranch', () => {
  it('devuelve la availability de la sede actual', () => {
    const a = availabilityForCurrentBranch(tree, 2);
    expect(a?.label).toBe('Sede Centro');
  });

  it('cae a la primera si la sede actual no está en la lista', () => {
    const a = availabilityForCurrentBranch(tree, 99);
    expect(a?.branch_id).toBe(1);
  });

  it('devuelve null si no hay data', () => {
    expect(availabilityForCurrentBranch(undefined, 1)).toBeNull();
  });
});

describe('productDetailImage', () => {
  it('devuelve product_img si existe', () => {
    expect(productDetailImage({ product_img: 'http://x' } as ProductDetail)).toBe(
      'http://x'
    );
  });

  it('devuelve null si no hay imagen', () => {
    expect(productDetailImage({ product_img: null } as ProductDetail)).toBeNull();
  });
});

describe('hasDescription / hasFeatures', () => {
  it('hasDescription: true si hay texto no-vacío', () => {
    expect(hasDescription({ tx_description: 'Hola' } as ProductDetail)).toBe(true);
    expect(hasDescription({ tx_description: '' } as ProductDetail)).toBe(false);
    expect(hasDescription({ tx_description: null } as ProductDetail)).toBe(false);
    expect(hasDescription({} as ProductDetail)).toBe(false);
  });

  it('hasFeatures: true si hay al menos 1', () => {
    expect(hasFeatures({ product_features: [{}] } as ProductDetail)).toBe(true);
    expect(hasFeatures({ product_features: [] } as ProductDetail)).toBe(false);
    expect(hasFeatures({} as ProductDetail)).toBe(false);
  });
});

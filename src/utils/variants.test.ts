import { describe, expect, it } from 'vitest';

import {
  familyAdapter,
  getSelectedVariant,
  getValueState,
  resolveVariantSelection,
  variantsHintText,
} from './variants';

const variant = (slug: string | null, size: number, color: number, extra: Record<string, unknown> = {}) => ({
  tx_slug: slug,
  tx_variant_label: `${size} / ${color}`,
  is_main: false,
  is_selected: false,
  is_active: slug !== null,
  in_branch: true,
  qty_product: 5,
  is_available: slug !== null,
  pri_product_final_price: 10,
  values: [
    { attribute_id: 1, value_id: size },
    { attribute_id: 2, value_id: color },
  ],
  ...extra,
});

const buildFamily = () => {
  const family = familyAdapter({
    main_slug: 's-azul',
    name: 'Bata',
    selected_slug: 's-azul',
    axes: [
      {
        attribute_id: 1,
        nb_attribute: 'Talla',
        tx_slug: 'talla',
        tx_type: 'TEXT',
        values: [
          { value_id: 10, tx_value: 'S' },
          { value_id: 11, tx_value: 'M' },
        ],
      },
      {
        attribute_id: 2,
        nb_attribute: 'Color',
        tx_slug: 'color',
        tx_type: 'COLOR',
        values: [
          { value_id: 20, tx_value: 'Azul', tx_hex: '#0000FF' },
          { value_id: 21, tx_value: 'Verde', tx_hex: '#00AA00' },
        ],
      },
    ],
    variants: [
      variant('s-azul', 10, 20, { is_selected: true, is_main: true }),
      variant('m-azul', 11, 20),
      variant('m-verde', 11, 21),
      // S / Verde no existe como combinación
      variant(null, 10, 21), // inactiva
    ],
  });
  if (!family) throw new Error('la ficha de prueba debe adaptarse');
  return family;
};

describe('familyAdapter', () => {
  it('devuelve null sin family o sin ejes/variantes', () => {
    expect(familyAdapter(undefined)).toBeNull();
    expect(familyAdapter(null)).toBeNull();
    expect(familyAdapter('texto')).toBeNull();
    expect(familyAdapter({ axes: [], variants: [] })).toBeNull();
  });

  it('normaliza defaults null-safe', () => {
    const family = familyAdapter({
      axes: [{ attribute_id: 1, values: null }],
      variants: [{ tx_slug: 'a', values: null }],
    });
    expect(family?.axes[0].values).toEqual([]);
    expect(family?.variants[0].values).toEqual([]);
    expect(family?.variants[0].is_available).toBe(false);
    expect(family?.name).toBe('');
  });

  it('tx_hex ausente queda en null y los números llegan como Number', () => {
    expect(buildFamily().axes[0].values[0].tx_hex).toBeNull();
    expect(buildFamily().axes[1].values[0].tx_hex).toBe('#0000FF');
    const f = familyAdapter({
      axes: [{ attribute_id: 1, values: [] }],
      variants: [{ tx_slug: 'a', qty_product: '4', pri_product_final_price: '12.5' }],
    });
    expect(f?.variants[0].qty_product).toBe(4);
    expect(f?.variants[0].pri_product_final_price).toBe(12.5);
  });
});

describe('familyAdapter — orden de los valores', () => {
  it('sigue el orden de variants[] y no el de axes[].values', () => {
    const family = familyAdapter({
      axes: [
        {
          attribute_id: 1,
          values: [
            { value_id: 10, tx_value: 'S' },
            { value_id: 11, tx_value: 'M' },
            { value_id: 12, tx_value: 'L' },
            { value_id: 13, tx_value: 'XL' },
          ],
        },
      ],
      variants: [12, 11, 10].map((id) => ({ tx_slug: `v-${id}`, values: [{ attribute_id: 1, value_id: id }] })),
    });
    // XL no lo usa ninguna variante: queda al final.
    expect(family?.axes[0].values.map((v) => v.tx_value)).toEqual(['L', 'M', 'S', 'XL']);
  });

  it('con dos ejes ordena cada uno por su primera aparición', () => {
    const family = familyAdapter({
      axes: [
        { attribute_id: 1, values: [{ value_id: 10 }, { value_id: 11 }] },
        { attribute_id: 2, values: [{ value_id: 20 }, { value_id: 21 }] },
      ],
      variants: [
        { tx_slug: 'a', values: [{ attribute_id: 1, value_id: 11 }, { attribute_id: 2, value_id: 21 }] },
        { tx_slug: 'b', values: [{ attribute_id: 1, value_id: 10 }, { attribute_id: 2, value_id: 20 }] },
      ],
    });
    expect(family?.axes[0].values.map((v) => v.value_id)).toEqual([11, 10]);
    expect(family?.axes[1].values.map((v) => v.value_id)).toEqual([21, 20]);
  });
});

describe('resolveVariantSelection', () => {
  it('conserva los demás ejes cuando la combinación existe', () => {
    expect(resolveVariantSelection(buildFamily(), 1, 11)?.tx_slug).toBe('m-azul');
  });

  it('usa la más cercana si la combinación exacta no existe', () => {
    // Actual S/Azul; Verde -> S/Verde está inactiva, queda M/Verde.
    expect(resolveVariantSelection(buildFamily(), 2, 21)?.tx_slug).toBe('m-verde');
  });

  it('devuelve null si el valor solo existe en variantes sin página', () => {
    const family = buildFamily();
    family.variants = family.variants.filter((v) => v.tx_slug !== 'm-verde');
    expect(resolveVariantSelection(family, 2, 21)).toBeNull();
  });

  it('a igual cercanía prefiere la disponible', () => {
    const family = buildFamily();
    // Desde S/Azul, tocar Talla M: M/Azul comparte el color; se vuelve no disponible pero sigue ganando por eje.
    family.variants.find((v) => v.tx_slug === 'm-azul')!.is_available = false;
    expect(resolveVariantSelection(family, 1, 11)?.tx_slug).toBe('m-azul');
  });
});

describe('getValueState', () => {
  it('marca el valor seleccionado y los deshabilitados', () => {
    const family = buildFamily();
    expect(getSelectedVariant(family)?.tx_slug).toBe('s-azul');
    expect(getValueState(family, 1, 10).isSelected).toBe(true);
    expect(getValueState(family, 1, 11).isSelected).toBe(false);
    family.variants = family.variants.filter((v) => v.tx_slug !== 'm-verde');
    expect(getValueState(family, 2, 21).isDisabled).toBe(true);
  });

  it('marca como no disponible una variante sin stock', () => {
    const family = buildFamily();
    family.variants.find((v) => v.tx_slug === 'm-azul')!.is_available = false;
    const state = getValueState(family, 1, 11);
    expect(state.isUnavailable).toBe(true);
    expect(state.isDisabled).toBe(false);
  });

  it('si ninguna variante está marcada, usa selected_slug', () => {
    const family = buildFamily();
    family.variants.forEach((v) => (v.is_selected = false));
    expect(getSelectedVariant(family)?.tx_slug).toBe('s-azul');
  });
});

describe('variantsHintText', () => {
  it('solo aparece con opciones adicionales', () => {
    expect(variantsHintText(undefined)).toBeNull();
    expect(variantsHintText(0)).toBeNull();
    expect(variantsHintText(1)).toBe('+1 opción');
    expect(variantsHintText(3)).toBe('+3 opciones');
  });
});

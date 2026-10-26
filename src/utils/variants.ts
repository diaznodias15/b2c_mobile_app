/**
 * Variantes de producto ("fichas", FRONTEND_CLIENTE_VARIANTES.md). Una ficha es un producto
 * principal con variantes (talla, color…); cada variante es un producto normal con su slug,
 * precio, stock e imágenes. Todo es aditivo: sin `family` el detalle se comporta como siempre.
 *
 * Lógica pura (sin React) para poder probarla. Portada de la web (`utilities/variants.js`).
 */

export type FamilyAxisValue = { value_id: number; tx_value: string; tx_hex: string | null };

export type FamilyAxis = {
  attribute_id: number;
  nb_attribute: string;
  tx_slug: string;
  /** "TEXT" o "COLOR". */
  tx_type: string;
  values: FamilyAxisValue[];
};

export type FamilyVariant = {
  /** `null` si la variante está inactiva (su página no existe). */
  tx_slug: string | null;
  tx_variant_label: string;
  is_main: boolean;
  is_selected: boolean;
  is_active: boolean;
  in_branch: boolean;
  is_available: boolean;
  qty_product: number;
  pri_product_final_price: number;
  values: { attribute_id: number; value_id: number }[];
};

export type ProductFamily = {
  main_slug: string | null;
  /** Nombre propio de la ficha, o el del producto visible si el admin no definió uno. */
  name: string;
  selected_slug: string | null;
  axes: FamilyAxis[];
  variants: FamilyVariant[];
};

type RawRecord = Record<string, any>;

/**
 * Posición de cada valor de un eje según la primera variante que lo usa: el orden de
 * `family.variants` (el que definió el admin) manda sobre el de `axes[].values`. Los valores que
 * ninguna variante usa quedan al final.
 */
function orderValuesByVariants<T extends RawRecord>(
  attributeId: number,
  values: T[],
  variants: RawRecord[]
): T[] {
  const firstSeen = new Map<number, number>();
  variants.forEach((variant, index) => {
    (Array.isArray(variant.values) ? variant.values : []).forEach((v: RawRecord) => {
      if (v.attribute_id === attributeId && !firstSeen.has(v.value_id)) firstSeen.set(v.value_id, index);
    });
  });
  const position = (v: T) => firstSeen.get(v.value_id) ?? Infinity;
  // `sort` es estable: los empates conservan el orden recibido.
  return [...values].sort((a, b) => position(a) - position(b));
}

/**
 * Normaliza el bloque `family` del detalle. Devuelve `null` si el producto no pertenece a una
 * ficha (o el bloque viene mal formado), para que el detalle se comporte como siempre.
 */
export function familyAdapter(family: unknown): ProductFamily | null {
  if (family == null || typeof family !== 'object') return null;
  const f = family as RawRecord;
  const axes: RawRecord[] = Array.isArray(f.axes) ? f.axes : [];
  const variants: RawRecord[] = Array.isArray(f.variants) ? f.variants : [];
  if (axes.length === 0 || variants.length === 0) return null;

  return {
    main_slug: f.main_slug ?? null,
    name: f.name ?? '',
    selected_slug: f.selected_slug ?? null,
    axes: axes.map((axis) => ({
      attribute_id: axis.attribute_id,
      nb_attribute: axis.nb_attribute,
      tx_slug: axis.tx_slug,
      tx_type: axis.tx_type,
      values: orderValuesByVariants<RawRecord>(
        axis.attribute_id,
        Array.isArray(axis.values) ? axis.values : [],
        variants
      ).map((v) => ({ value_id: v.value_id, tx_value: v.tx_value, tx_hex: v.tx_hex ?? null })),
    })),
    variants: variants.map((v) => ({
      tx_slug: v.tx_slug ?? null,
      tx_variant_label: v.tx_variant_label ?? '',
      is_main: Boolean(v.is_main),
      is_selected: Boolean(v.is_selected),
      is_active: Boolean(v.is_active),
      in_branch: Boolean(v.in_branch),
      is_available: Boolean(v.is_available),
      qty_product: Number(v.qty_product ?? 0),
      pri_product_final_price: Number(v.pri_product_final_price ?? 0),
      values: (Array.isArray(v.values) ? v.values : []).map((val: RawRecord) => ({
        attribute_id: val.attribute_id,
        value_id: val.value_id,
      })),
    })),
  };
}

/** Valor que tiene la variante en un eje (o `undefined`). */
const valueOf = (variant: FamilyVariant, attributeId: number): number | undefined =>
  variant.values.find((v) => v.attribute_id === attributeId)?.value_id;

/** Una combinación se puede abrir solo si tiene página (slug) y está activa. */
export const isVariantNavigable = (variant: FamilyVariant): boolean =>
  Boolean(variant.tx_slug) && variant.is_active;

export function getSelectedVariant(family: ProductFamily): FamilyVariant | null {
  return (
    family.variants.find((v) => v.is_selected) ??
    family.variants.find((v) => v.tx_slug === family.selected_slug) ??
    null
  );
}

/**
 * Variante a la que ir al tocar `valueId` del eje `attributeId`: conserva los valores de los
 * demás ejes; si esa combinación exacta no existe, elige la que más ejes comparta con la actual
 * (a igualdad, prefiere la disponible). Devuelve `null` si ninguna variante con ese valor tiene
 * página.
 */
export function resolveVariantSelection(
  family: ProductFamily,
  attributeId: number,
  valueId: number
): FamilyVariant | null {
  const selected = getSelectedVariant(family);
  const candidates = family.variants.filter(
    (v) => valueOf(v, attributeId) === valueId && isVariantNavigable(v)
  );
  if (candidates.length === 0) return null;

  const otherAxes = family.axes.filter((axis) => axis.attribute_id !== attributeId);
  const score = (v: FamilyVariant): number =>
    otherAxes.filter((axis) => selected && valueOf(v, axis.attribute_id) === valueOf(selected, axis.attribute_id))
      .length *
      10 +
    (v.is_available ? 1 : 0);

  return candidates.reduce((best, v) => (score(v) > score(best) ? v : best));
}

export type ValueState = {
  isSelected: boolean;
  /** Variante a la que se navegaría al tocarlo. */
  target: FamilyVariant | null;
  /** No hay ninguna combinación con página: no se puede elegir. */
  isDisabled: boolean;
  /** Hay combinación pero sin stock en la sede: se muestra tachado. */
  isUnavailable: boolean;
};

/** Estado de un valor del selector: seleccionado, y si se puede elegir / hay stock. */
export function getValueState(family: ProductFamily, attributeId: number, valueId: number): ValueState {
  const selected = getSelectedVariant(family);
  const target = resolveVariantSelection(family, attributeId, valueId);
  return {
    isSelected: selected ? valueOf(selected, attributeId) === valueId : false,
    target,
    isDisabled: target === null,
    isUnavailable: target !== null && !target.is_available,
  };
}

/** "+N opciones" para una card cuyo producto tiene `variants_count` > 0; `null` si no aplica. */
export function variantsHintText(count: number | undefined): string | null {
  if (!count || count < 1) return null;
  return count === 1 ? '+1 opción' : `+${count} opciones`;
}

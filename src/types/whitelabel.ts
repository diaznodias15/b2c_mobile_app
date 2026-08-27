/**
 * Tipos del envelope de `/api/config/get` y de los sub-recursos que la
 * mobile necesita para renderizar Home, Departamentos y selector de sede.
 *
 * Los nombres de campo siguen la convención del backend de iCommerce360
 * (`tx_`, `nb_`, `qty_`, `amt_`, `is_`, `dt_`, `col_`, `seq_`).
 *
 * Si el backend agrega un campo nuevo, lo sumamos acá con `?` y los
 * adapters lo filtran para no contaminar la UI.
 */

import type { AppConfig } from '@/store';
import type { ConfigColors } from '@/theme';

/** Envelope genérico de la API. */
export type Envelope<T> = {
  status: string;
  message: string;
  data: T;
};

/** Publicidad del carrusel del Home. */
export type Advertising = {
  id?: number;
  nb_advertising: string;
  tx_img_url_web: string;
  tx_img_url_mobile: string;
  seq_order?: number;
  seq_importance?: number;
};

/** Subcategoría dentro de una categoría. */
export type Subcategory = {
  id?: number;
  nb_subcategory?: string;
  tx_slug?: string;
};

/** Categoría dentro de un departamento. */
export type Category = {
  id?: number;
  nb_category?: string;
  tx_slug?: string;
  subcategories?: Subcategory[];
};

/** Departamento del catálogo. */
export type Department = {
  id: number;
  nb_department: string;
  tx_slug: string;
  tx_description?: string;
  tx_img_url?: string;
  col_department?: string;
  categories?: Category[];
};

/** Marca (para Fase 3+ cuando se renderice el strip de marcas). */
export type Brand = {
  id?: number;
  nb_brand?: string;
  tx_img_url?: string;
};

/** Item final de sede (lo que se asigna como `selectedBranch`). */
export type BranchItem = {
  value: number;
  label: string;
  nb_branch: string;
  tx_alias?: string;
  tx_address?: string;
  tx_phone?: string;
  is_default?: number;
  tx_working_hours?: string;
  lat?: number;
  lng?: number;
};

/**
 * Una entrada de `data.branches[]`. Es un nivel del árbol
 * estado → ciudad → items[]. El backend lo manda así para que
 * el frontend agrupe por ciudad/estado sin lógica extra.
 */
export type BranchGroup = {
  nb_state: string;
  nb_city: string;
  group: string;
  items: BranchItem[];
};

/** Producto devuelto por `/api/products/top-products`. */
export type TopProduct = {
  id: number;
  nb_brand: string;
  cod_barcode: string;
  nb_product: string;
  is_regulado?: number;
  tx_slug: string;
  qty_product: number;
  qty_discount?: number;
  qty_tax?: number;
  tx_img_url?: string | null;
  /** Precio base en USD (string porque así viene del backend). */
  pri_product_price: string;
  /** Precio final con impuestos en USD (string). */
  pri_product_final_price: string;
};

/** Forma completa de `data` en `/api/config/get`. */
export type ConfigData = {
  app_config: AppConfig;
  config_colors?: ConfigColors;
  advertisings?: Advertising[];
  brands?: Brand[];
  departments?: Department[];
  branches?: BranchGroup[];
};

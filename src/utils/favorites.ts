import type { FavoriteProduct } from '@/api/services/favorites.services';
import type { Product } from '@/types/whitelabel';

/**
 * Adapta un favorito de la sede a un `Product` para reutilizar las filas de producto (precio,
 * stock, agregar al carrito). `qty_availability` ya es el stock real menos lo reservado, y un
 * producto que la sede no maneja llega con stock 0 y precios 0, así que las filas lo muestran
 * "sin stock" y deshabilitan el botón por sí solas.
 */
export function favoriteToProduct(f: FavoriteProduct): Product {
  return {
    id: f.id,
    nb_brand: f.nb_brand,
    cod_barcode: f.cod_barcode ?? '',
    nb_product: f.nb_product,
    is_regulado: f.is_regulado,
    tx_slug: f.tx_slug,
    qty_product: f.is_in_branch ? f.qty_availability : 0,
    qty_discount: f.qty_discount,
    qty_tax: f.qty_tax,
    tx_img_url: f.tx_img_url,
    pri_product_price: String(f.pri_product_price),
    pri_product_final_price: String(f.pri_product_final_price),
  };
}

/** `true` si se puede sumar al carrito de la sede (la maneja y tiene stock). */
export function isFavoriteAddable(f: FavoriteProduct): boolean {
  return f.is_in_branch && f.qty_availability > 0;
}

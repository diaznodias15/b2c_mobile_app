/**
 * Lógica pura del escáner de código de barras (portada de la web: `useBarcodeScanner`). El código
 * leído NO tiene endpoint propio: viaja como término de la búsqueda de productos.
 */

/** Formatos que se leen: EAN-13/8, UPC-A/E y Code 128 (los de los productos de farmacia). */
export const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'] as const;

/** Mínimo de caracteres de un código/búsqueda (igual que la búsqueda de productos). */
export const MIN_BARCODE_LENGTH = 3;

/** Lecturas consecutivas iguales que hacen falta para aceptar un código (evita falsos positivos). */
export const REQUIRED_CONSECUTIVE_READS = 2;

/** Recorta el código y descarta lo que es demasiado corto o no es texto. */
export function normalizeBarcode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const code = raw.trim();
  return code.length >= MIN_BARCODE_LENGTH ? code : null;
}

/**
 * Acepta un código solo tras `required` lecturas consecutivas iguales; un código distinto o una
 * lectura vacía reinicia la cuenta. Tras aceptar uno, se reinicia (el llamador debe cerrar el
 * escáner: no se vuelve a avisar del mismo código por accidente).
 */
export function createConsecutiveReader(required: number = REQUIRED_CONSECUTIVE_READS) {
  let last: string | null = null;
  let count = 0;

  return {
    /** Devuelve el código aceptado, o `null` si todavía no hay lecturas suficientes. */
    push(raw: unknown): string | null {
      const code = normalizeBarcode(raw);
      if (!code) {
        last = null;
        count = 0;
        return null;
      }
      count = code === last ? count + 1 : 1;
      last = code;
      if (count >= required) {
        last = null;
        count = 0;
        return code;
      }
      return null;
    },
    reset() {
      last = null;
      count = 0;
    },
  };
}
